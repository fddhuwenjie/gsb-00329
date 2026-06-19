import { mkdtempSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

// 必须在 import 任何业务模块（db / app / repo）之前设置好环境变量，
// 否则 db.ts 顶层的 new Database(dbPath) 会用真实数据。
const tmpDir = mkdtempSync(join(tmpdir(), 'blog-test-'))
process.env.BLOG_DB_PATH = join(tmpDir, 'test.db')
process.env.NODE_ENV = 'test'

const { default: request } = await import('supertest')
const { initDatabase, db } = await import('../src/db.js')
const { createApp } = await import('../src/index.js')

initDatabase()
// 给测试预置一个分类，方便后面构造分类聚合页验证。
db.prepare(
  `INSERT OR IGNORE INTO categories (id, name, slug, icon, color, description) VALUES (1, '前端', 'frontend', '🚀', 'border-emerald-200', '')`
).run()

const app = createApp()

async function createPost(overrides: Record<string, unknown> = {}) {
  const slugSuffix = Math.random().toString(36).slice(2, 8)
  const res = await request(app).post('/api/posts').send({
    title: 'Hello ' + slugSuffix,
    slug: 'hello-' + slugSuffix,
    excerpt: 'excerpt',
    content: 'content',
    category_id: 1,
    status: 'draft',
    ...overrides,
  })
  expect(res.status).toBe(201)
  return res.body as { id: number; slug: string; status: string }
}

describe('文章状态在前后台一致性回归', () => {
  afterAll(() => {
    try { db.close() } catch {}
    rmSync(tmpDir, { recursive: true, force: true })
  })

  it('创建：默认状态为 draft，前台 slug 直链返回 404，管理端 includeAll 可见', async () => {
    const post = await createPost({ slug: 'create-default' })
    expect(post.status).toBe('draft')

    const publicRes = await request(app).get(`/api/posts/slug/${post.slug}`)
    expect(publicRes.status).toBe(404)

    const adminRes = await request(app).get(`/api/posts/slug/${post.slug}?includeAll=1`)
    expect(adminRes.status).toBe(200)
    expect(adminRes.body.id).toBe(post.id)
  })

  it('发布：published 文章在 slug 详情、列表、搜索、分类、RSS 全部可见', async () => {
    const post = await createPost({ slug: 'publish-flow', title: 'Publish Flow Title', status: 'published' })

    const slugRes = await request(app).get(`/api/posts/slug/${post.slug}`)
    expect(slugRes.status).toBe(200)

    const listRes = await request(app).get('/api/posts')
    expect(listRes.body.data.some((p: { id: number }) => p.id === post.id)).toBe(true)

    const searchRes = await request(app).get('/api/posts/search').query({ q: 'Publish Flow' })
    expect(searchRes.body.some((p: { id: number }) => p.id === post.id)).toBe(true)

    const categoryRes = await request(app).get('/api/posts/category/frontend')
    expect(categoryRes.body.some((p: { id: number }) => p.id === post.id)).toBe(true)

    const rssRes = await request(app).get('/rss')
    expect(rssRes.text).toContain(post.slug)
  })

  it('下线：archived 文章必须从 slug、列表、搜索、分类、RSS、view/like 全部消失', async () => {
    const post = await createPost({ slug: 'archive-flow', title: 'Archive Flow Title', status: 'published' })

    // 先确认是可见的
    expect((await request(app).get(`/api/posts/slug/${post.slug}`)).status).toBe(200)

    // 下线
    const upd = await request(app).put(`/api/posts/${post.id}`).send({ status: 'archived' })
    expect(upd.status).toBe(200)

    // 公网各入口都应当 404 / 不再出现
    expect((await request(app).get(`/api/posts/slug/${post.slug}`)).status).toBe(404)

    const listRes = await request(app).get('/api/posts')
    expect(listRes.body.data.some((p: { id: number }) => p.id === post.id)).toBe(false)

    const searchRes = await request(app).get('/api/posts/search').query({ q: 'Archive Flow' })
    expect(searchRes.body.some((p: { id: number }) => p.id === post.id)).toBe(false)

    const categoryRes = await request(app).get('/api/posts/category/frontend')
    expect(categoryRes.body.some((p: { id: number }) => p.id === post.id)).toBe(false)

    const rssRes = await request(app).get('/rss')
    expect(rssRes.text).not.toContain(post.slug)

    // 浏览/点赞接口也不应该再为下线文章计数
    expect((await request(app).post(`/api/posts/${post.id}/view`)).status).toBe(404)
    expect((await request(app).post(`/api/posts/${post.id}/like`)).status).toBe(404)

    // 但管理端编辑器仍可打开（必须显式 includeAll=1）
    expect((await request(app).get(`/api/posts/${post.id}?includeAll=1`)).status).toBe(200)
    expect((await request(app).get(`/api/posts/slug/${post.slug}?includeAll=1`)).status).toBe(200)
    // 反过来：不带 includeAll 的 id 路由必须 404，避免旁路
    expect((await request(app).get(`/api/posts/${post.id}`)).status).toBe(404)
  })

  it('恢复：archived → published 后旧链接立即重新可见，状态指标同步', async () => {
    const post = await createPost({ slug: 'restore-flow', status: 'archived' })
    expect((await request(app).get(`/api/posts/slug/${post.slug}`)).status).toBe(404)

    await request(app).put(`/api/posts/${post.id}`).send({ status: 'published' })
    const slugRes = await request(app).get(`/api/posts/slug/${post.slug}`)
    expect(slugRes.status).toBe(200)
    expect(slugRes.body.status).toBe('published')

    const stats = await request(app).get('/api/stats')
    expect(stats.body).toHaveProperty('archived_posts')
    expect(typeof stats.body.published_posts).toBe('number')
  })

  it('批量切换：bulk-status 一次性把多篇文章设为 archived，前台立即不可见', async () => {
    const a = await createPost({ slug: 'bulk-a', status: 'published' })
    const b = await createPost({ slug: 'bulk-b', status: 'published' })

    expect((await request(app).get(`/api/posts/slug/${a.slug}`)).status).toBe(200)
    expect((await request(app).get(`/api/posts/slug/${b.slug}`)).status).toBe(200)

    const bulk = await request(app)
      .post('/api/posts/bulk-status')
      .send({ ids: [a.id, b.id], status: 'archived' })
    expect(bulk.status).toBe(200)
    expect(bulk.body.updated).toBe(2)

    expect((await request(app).get(`/api/posts/slug/${a.slug}`)).status).toBe(404)
    expect((await request(app).get(`/api/posts/slug/${b.slug}`)).status).toBe(404)
  })

  it('管理端 listing 默认带回 archived，公网默认不带', async () => {
    await createPost({ slug: 'visibility-pub', status: 'published' })
    await createPost({ slug: 'visibility-arc', status: 'archived' })
    await createPost({ slug: 'visibility-draft', status: 'draft' })

    const publicList = await request(app).get('/api/posts')
    expect(publicList.body.data.every((p: { status: string }) => p.status === 'published')).toBe(true)

    const adminList = await request(app).get('/api/posts?includeAll=1')
    const statuses = new Set(adminList.body.data.map((p: { status: string }) => p.status))
    expect(statuses.has('published')).toBe(true)
    expect(statuses.has('draft')).toBe(true)
    expect(statuses.has('archived')).toBe(true)
  })

  it('id 旁路：知道文章 id 也不能从公网拿到 draft / archived，必须 includeAll=1 才能看到', async () => {
    const draft = await createPost({ slug: 'id-bypass-draft', status: 'draft' })
    const archived = await createPost({ slug: 'id-bypass-archived', status: 'archived' })
    const published = await createPost({ slug: 'id-bypass-published', status: 'published' })

    // 公网默认行为：草稿 / 下线必须 404
    expect((await request(app).get(`/api/posts/${draft.id}`)).status).toBe(404)
    expect((await request(app).get(`/api/posts/${archived.id}`)).status).toBe(404)
    // 发布的文章仍然可以通过 id 拿到
    expect((await request(app).get(`/api/posts/${published.id}`)).status).toBe(200)

    // 显式 includeAll=0 也不应放行
    expect((await request(app).get(`/api/posts/${draft.id}?includeAll=0`)).status).toBe(404)
    expect((await request(app).get(`/api/posts/${archived.id}?includeAll=false`)).status).toBe(404)

    // 管理端 includeAll=1 才能拿到全部状态
    expect((await request(app).get(`/api/posts/${draft.id}?includeAll=1`)).status).toBe(200)
    expect((await request(app).get(`/api/posts/${archived.id}?includeAll=true`)).status).toBe(200)
  })

  it('非法状态会被服务端拒绝，避免脏数据混入持久层', async () => {
    const create = await request(app).post('/api/posts').send({
      title: 'bad', slug: 'bad-status', status: 'banana',
    })
    expect(create.status).toBe(400)

    const post = await createPost({ slug: 'bad-status-update' })
    const upd = await request(app).put(`/api/posts/${post.id}`).send({ status: 'banana' })
    expect(upd.status).toBe(400)

    const bulk = await request(app)
      .post('/api/posts/bulk-status')
      .send({ ids: [post.id], status: 'banana' })
    expect(bulk.status).toBe(400)
  })
})
