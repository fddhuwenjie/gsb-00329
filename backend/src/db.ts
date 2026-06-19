import Database, { type Database as DatabaseType } from 'better-sqlite3'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 允许外部（如测试）通过 BLOG_DB_PATH 注入隔离的 sqlite 文件，
// 避免在自动化回归里污染生产 / 开发用库。
const dbPath = process.env.BLOG_DB_PATH || join(__dirname, '..', 'data', 'blog.db')
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

    CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
    CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category_id);
    CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
    CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
  `)

  migratePostStatusCheck()
}

// 旧库 posts.status 的 CHECK 约束只允许 ('draft','published')，
// 这里需要把它升级到 ('draft','published','archived')，否则把已有文章
// 改成 'archived'（下线）会因为约束直接报错，进而出现 “后台已下线但前台还能访问”
// 的边角场景。SQLite 不支持直接修改 CHECK 约束，所以走表重建迁移。
function migratePostStatusCheck() {
  try {
    const row = db
      .prepare(`SELECT sql FROM sqlite_master WHERE type='table' AND name='posts'`)
      .get() as { sql?: string } | undefined
    const sql = row?.sql || ''
    if (!sql || sql.includes(`'archived'`)) return

    db.exec('BEGIN')
    try {
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
          status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'published', 'archived')),
          read_time INTEGER DEFAULT 5,
          views INTEGER DEFAULT 0,
          likes INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        INSERT INTO posts_new SELECT * FROM posts;
        DROP TABLE posts;
        ALTER TABLE posts_new RENAME TO posts;
        CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
        CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category_id);
        CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
      `)
      db.exec('COMMIT')
    } catch (err) {
      db.exec('ROLLBACK')
      throw err
    }
  } catch (err) {
    console.error('[db] migratePostStatusCheck failed:', err)
  }
}
