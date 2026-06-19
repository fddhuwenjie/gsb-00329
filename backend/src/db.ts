import Database, { type Database as DatabaseType } from 'better-sqlite3'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const dbPath = join(__dirname, '..', 'data', 'blog.db')
export const db: DatabaseType = new Database(dbPath)

db.pragma('foreign_keys = ON')
db.pragma('journal_mode = WAL')

function columnExists(db: DatabaseType, tableName: string, columnName: string): boolean {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all() as { name: string }[]
  return columns.some(c => c.name === columnName)
}

function tableExists(db: DatabaseType, tableName: string): boolean {
  const result = db.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name = ?"
  ).get(tableName) as { name: string } | undefined
  return !!result
}

function migratePostsTable(db: DatabaseType) {
  if (!tableExists(db, 'posts')) return

  const hasArchivedSupport = (() => {
    try {
      const stmt = db.prepare("INSERT INTO posts (slug, title, status) VALUES (?, ?, 'archived')")
      const result = stmt.run('__migration_test_archived__', '__migration_test__')
      db.prepare('DELETE FROM posts WHERE slug = ?').run('__migration_test_archived__')
      return true
    } catch {
      return false
    }
  })()

  if (hasArchivedSupport) return

  console.log('[DB] Migrating posts table to support archived status...')

  const columns = db.prepare('PRAGMA table_info(posts)').all() as {
    cid: number
    name: string
    type: string
    notnull: number
    dflt_value: string | null
    pk: number
  }[]

  const columnDefs = columns.map(col => {
    let def = `"${col.name}" ${col.type}`
    if (col.name === 'status') {
      def = `"status" TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'published', 'archived'))`
    } else {
      if (col.notnull) def += ' NOT NULL'
      if (col.dflt_value !== null) def += ` DEFAULT ${col.dflt_value}`
      if (col.pk) def += ' PRIMARY KEY'
    }
    return def
  }).join(',\n    ')

  const foreignKeys = db.prepare('PRAGMA foreign_key_list(posts)').all() as {
    id: number
    seq: number
    table: string
    from: string
    to: string
    on_update: string
    on_delete: string
    match: string
  }[]

  const fkDefs = foreignKeys.map(fk => 
    `FOREIGN KEY ("${fk.from}") REFERENCES "${fk.table}"("${fk.to}") ON DELETE ${fk.on_delete} ON UPDATE ${fk.on_update}`
  ).join(',\n  ')

  const columnNames = columns.map(c => `"${c.name}"`).join(', ')

  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS posts_new (
      ${columnDefs}
      ${fkDefs ? ', ' + fkDefs : ''}
    )
  `

  const migrateTx = db.transaction(() => {
    db.exec(createTableSQL)
    db.exec(`INSERT INTO posts_new (${columnNames}) SELECT ${columnNames} FROM posts`)
    db.exec('DROP TABLE posts')
    db.exec('ALTER TABLE posts_new RENAME TO posts')
    
    const indexes = db.prepare("SELECT name, sql FROM sqlite_master WHERE type='index' AND tbl_name = 'posts_new'").all() as { name: string; sql: string }[]
    for (const idx of indexes) {
      const newIdxName = idx.name.replace('posts_new', 'posts')
      const newSql = idx.sql.replace('posts_new', 'posts').replace(idx.name, newIdxName)
      db.exec(newSql)
    }
  })

  try {
    migrateTx()
    console.log('[DB] Posts table migration completed successfully.')
  } catch (err) {
    console.error('[DB] Migration failed:', err)
    throw err
  }
}

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      icon TEXT DEFAULT '📁',
      color TEXT DEFAULT 'border-slate-200 hover:border-slate-500 hover:bg-slate-50',
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS authors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      avatar TEXT,
      bio TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      excerpt TEXT,
      content TEXT,
      image TEXT,
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      author_id INTEGER REFERENCES authors(id) ON DELETE SET NULL,
      status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'published', 'archived')),
      read_time INTEGER DEFAULT 5,
      views INTEGER DEFAULT 0,
      likes INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS post_tags (
      post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
      tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
      PRIMARY KEY (post_id, tag_id)
    );
  `)

  migratePostsTable(db)

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
    CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category_id);
    CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
    CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
  `)
}
