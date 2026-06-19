import Database, { type Database as DatabaseType } from 'better-sqlite3'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const dbPath = join(__dirname, '..', 'data', 'blog.db')
export const db: DatabaseType = new Database(dbPath)

// Enable foreign keys
db.pragma('foreign_keys = ON')

// Initialize database schema
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
      status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'published', 'offline')),
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

    CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
    CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category_id);
    CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
    CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
  `)

  migratePostsTable()
}

function migratePostsTable() {
  const tableDefStmt = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='posts'")
  const tableDef = tableDefStmt.get() as { sql: string } | undefined
  
  if (!tableDef) {
    return
  }

  if (tableDef.sql.includes("'offline'")) {
    console.log('Posts table schema already up to date (supports offline status)')
    return
  }

  console.log('Migrating posts table to support offline status...')

  const migrateTransaction = db.transaction(() => {
    db.exec(`
      CREATE TABLE posts_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slug TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        excerpt TEXT,
        content TEXT,
        image TEXT,
        category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
        author_id INTEGER REFERENCES authors(id) ON DELETE SET NULL,
        status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'published', 'offline')),
        read_time INTEGER DEFAULT 5,
        views INTEGER DEFAULT 0,
        likes INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      INSERT INTO posts_new SELECT * FROM posts;
      DROP TABLE posts;
      ALTER TABLE posts_new RENAME TO posts;
    `)
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
      CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category_id);
      CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
    `)
  })

  try {
    migrateTransaction()
    console.log('Posts table migration completed successfully')
  } catch (migrationError) {
    console.error('FATAL: Failed to migrate posts table schema:', migrationError)
    console.error('The existing posts table may have incompatible data. Please backup your data and resolve the issue manually.')
    throw new Error(`Database migration failed: ${migrationError instanceof Error ? migrationError.message : String(migrationError)}`)
  }
}
