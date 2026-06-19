import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import express from 'express'
import request from 'supertest'
import Database from 'better-sqlite3'
import type { Database as DatabaseType } from 'better-sqlite3'

describe('API 路由状态一致性集成测试', () => {
  let app: express.Express
  let db: DatabaseType

  beforeEach(async () => {
    vi.resetModules()
    
    db = new Database(':memory:')
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
      CREATE TABLE tags (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE NOT NULL);
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

    db.prepare('INSERT INTO categories (name, slug) VALUES (?, ?)').run('技术', 'tech')
    db.prepare('INSERT INTO authors (name) VALUES (?)').run('测试作者')
    
    const insertPost = db.prepare(`
      INSERT INTO posts (title, slug, excerpt, content, category_id, author_id, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    insertPost.run('公开文章', 'public-post', '公开摘要', '公开内容', 1, 1, 'published')
    insertPost.run('草稿文章', 'draft-post', '草稿摘要', '草稿内容', 1, 1, 'draft')
    insertPost.run('下线文章', 'archived-post', '下线摘要', '下线内容', 1, 1, 'archived')

    vi.doMock('../src/db.js', () => ({ db, initDatabase: vi.fn() }))

    app = express()
    app.use(express.json())

    const postsRouterModule = await import('../src/routes/posts.js')
    const rssRouterModule = await import('../src/routes/rss.js')
    app.use('/posts', postsRouterModule.default)
    app.use('/rss', rssRouterModule.default)
  })

  afterEach(() => {
    db.close()
  })

  describe('公开 /posts/public/* 接口安全性', () => {
    it('GET /posts/public 只返回 published 文章', async () => {
      const res = await request(app).get('/posts/public')
      expect(res.status).toBe(200)
      expect(res.body.data.length).toBe(1)
      expect(res.body.data[0].slug).toBe('public-post')
      expect(res.body.total).toBe(1)
    })

    it('GET /posts/public/slug/:slug 对 draft/archived 返回 404', async () => {
      const publicRes = await request(app).get('/posts/public/slug/public-post')
      expect(publicRes.status).toBe(200)
      expect(publicRes.body.slug).toBe('public-post')

      const draftRes = await request(app).get('/posts/public/slug/draft-post')
      expect(draftRes.status).toBe(404)

      const archivedRes = await request(app).get('/posts/public/slug/archived-post')
      expect(archivedRes.status).toBe(404)
    })

    it('GET /posts/public/search 不搜索 draft/archived 文章', async () => {
      const res = await request(app).get('/posts/public/search?q=内容')
      expect(res.status).toBe(200)
      expect(res.body.length).toBe(1)
      expect(res.body[0].slug).toBe('public-post')
    })

    it('GET /posts/public/category/:slug 只返回该分类的 published 文章', async () => {
      const res = await request(app).get('/posts/public/category/tech')
      expect(res.status).toBe(200)
      expect(res.body.length).toBe(1)
      expect(res.body[0].slug).toBe('public-post')
    })

    it('POST /posts/public/:id/view 只对 published 生效', async () => {
      const publicRes = await request(app).post('/posts/public/1/view')
      expect(publicRes.status).toBe(204)

      const draftRes = await request(app).post('/posts/public/2/view')
      expect(draftRes.status).toBe(404)

      const archivedRes = await request(app).post('/posts/public/3/view')
      expect(archivedRes.status).toBe(404)
    })

    it('POST /posts/public/:id/like 只对 published 生效', async () => {
      const publicRes = await request(app).post('/posts/public/1/like')
      expect(publicRes.status).toBe(204)

      const draftRes = await request(app).post('/posts/public/2/like')
      expect(draftRes.status).toBe(404)
    })
  })

  describe('管理接口 /posts/* 完整性', () => {
    it('GET /posts (无筛选) 返回所有状态文章', async () => {
      const res = await request(app).get('/posts')
      expect(res.status).toBe(200)
      expect(res.body.total).toBe(3)
    })

    it('GET /posts?status=draft 返回草稿', async () => {
      const res = await request(app).get('/posts?status=draft')
      expect(res.status).toBe(200)
      expect(res.body.data[0].slug).toBe('draft-post')
    })

    it('GET /posts?status=archived 返回下线文章', async () => {
      const res = await request(app).get('/posts?status=archived')
      expect(res.status).toBe(200)
      expect(res.body.data[0].slug).toBe('archived-post')
    })

    it('GET /posts/slug/:slug 可以访问任意状态', async () => {
      const draftRes = await request(app).get('/posts/slug/draft-post')
      expect(draftRes.status).toBe(200)

      const archivedRes = await request(app).get('/posts/slug/archived-post')
      expect(archivedRes.status).toBe(200)
    })

    it('PUT /posts/bulk/status 批量更新状态', async () => {
      const res = await request(app)
        .put('/posts/bulk/status')
        .send({ ids: [1], status: 'archived' })
      expect(res.status).toBe(200)
      expect(res.body.updated).toBe(1)

      const publicRes = await request(app).get('/posts/public/slug/public-post')
      expect(publicRes.status).toBe(404)
    })
  })

  describe('RSS 接口', () => {
    it('GET /rss 只包含 published 文章', async () => {
      const res = await request(app).get('/rss')
      expect(res.status).toBe(200)
      expect(res.text).toContain('public-post')
      expect(res.text).not.toContain('draft-post')
      expect(res.text).not.toContain('archived-post')
    })
  })
})
