import Database from 'better-sqlite3'
import type { Database as DatabaseType } from 'better-sqlite3'

let testDb: DatabaseType | null = null

export function initTestDatabase(): DatabaseType {
  const db = new Database(':memory:')
  db.pragma('foreign_keys = ON')

  db.exec(`
    CREATE TABLE categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      icon TEXT DEFAULT '📁',
      color TEXT DEFAULT 'border-slate-200',
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE authors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      avatar TEXT,
      bio TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE posts (
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

    CREATE TABLE tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    );

    CREATE TABLE post_tags (
      post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
      tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
      PRIMARY KEY (post_id, tag_id)
    );

    CREATE INDEX idx_posts_slug ON posts(slug);
    CREATE INDEX idx_posts_category ON posts(category_id);
    CREATE INDEX idx_posts_status ON posts(status);
    CREATE INDEX idx_categories_slug ON categories(slug);
  `)

  return db
}

export function setupTestData(db: DatabaseType) {
  const categoryStmt = db.prepare('INSERT INTO categories (name, slug) VALUES (?, ?)')
  const authorStmt = db.prepare('INSERT INTO authors (name) VALUES (?)')
  const postStmt = db.prepare(`
    INSERT INTO posts (title, slug, excerpt, content, category_id, author_id, status, views, likes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  categoryStmt.run('技术', 'tech')
  categoryStmt.run('生活', 'life')

  authorStmt.run('张三')
  authorStmt.run('李四')

  postStmt.run('已发布文章', 'published-post', '摘要1', '正文内容1', 1, 1, 'published', 100, 50)
  postStmt.run('草稿文章', 'draft-post', '摘要2', '正文内容2', 1, 1, 'draft', 0, 0)
  postStmt.run('已下线文章', 'archived-post', '摘要3', '正文内容3', 1, 1, 'archived', 50, 20)
  postStmt.run('另一个已发布', 'another-published', '摘要4', '正文内容4', 2, 2, 'published', 200, 80)
  postStmt.run('特殊关键词文章', 'special-keyword', '包含搜索词测试', '这是一段测试搜索功能的正文内容', 1, 1, 'published', 30, 10)
  postStmt.run('草稿含关键词', 'draft-keyword', '草稿里的关键词', '草稿正文也有搜索词但不应该被搜到', 1, 1, 'draft', 0, 0)
}

export function withTestDb<T>(fn: (db: DatabaseType) => T): T {
  const db = initTestDatabase()
  setupTestData(db)
  try {
    return fn(db)
  } finally {
    db.close()
  }
}
