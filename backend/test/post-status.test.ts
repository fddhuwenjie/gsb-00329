import assert from 'node:assert/strict'
import Database from 'better-sqlite3'
import type { Database as DatabaseType } from 'better-sqlite3'

function createTestDb(): DatabaseType {
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
      status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'published', 'offline')),
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

type PostStatus = 'draft' | 'published' | 'offline'

interface Post {
  id: number
  slug: string
  title: string
  excerpt: string | null
  content: string | null
  image: string | null
  category_id: number | null
  author_id: number | null
  status: PostStatus
  read_time: number
  views: number
  likes: number
  created_at: string
  updated_at: string
}

function buildStatusCondition(status?: PostStatus | PostStatus[]): { clause: string, params: PostStatus[] } {
  if (!status) {
    return { clause: '', params: [] }
  }
  if (Array.isArray(status)) {
    if (status.length === 0) {
      return { clause: '', params: [] }
    }
    const placeholders = status.map(() => '?').join(', ')
    return { clause: ` AND p.status IN (${placeholders})`, params: status }
  }
  return { clause: ' AND p.status = ?', params: [status] }
}

interface FindAllOptions {
  status?: PostStatus | PostStatus[]
  page?: number
  limit?: number
  search?: string
  categorySlug?: string
}

interface PaginatedResult {
  data: Post[]
  total: number
  page: number
  limit: number
  totalPages: number
}

function createPostRepository(db: DatabaseType) {
  function findAll(status?: PostStatus | PostStatus[]): Post[] {
    const { clause, params } = buildStatusCondition(status)
    const query = `
      SELECT p.* FROM posts p
      WHERE 1=1${clause}
      ORDER BY p.created_at DESC
    `
    return db.prepare(query).all(...params) as Post[]
  }

  function findAllPaginated(options: FindAllOptions): PaginatedResult {
    const { status, page = 1, limit = 20, search, categorySlug } = options
    const offset = (page - 1) * limit
    
    let whereClause = '1=1'
    const params: (string | number)[] = []
    
    const { clause: statusClause, params: statusParams } = buildStatusCondition(status)
    whereClause += statusClause
    params.push(...statusParams)

    if (categorySlug) {
      whereClause += ' AND c.slug = ?'
      params.push(categorySlug)
    }
    
    if (search) {
      whereClause += ' AND (p.title LIKE ? OR p.excerpt LIKE ? OR p.content LIKE ?)'
      params.push(`%${search}%`, `%${search}%`, `%${search}%`)
    }
    
    const countQuery = `SELECT COUNT(*) as count FROM posts p LEFT JOIN categories c ON p.category_id = c.id WHERE ${whereClause}`
    const { count: total } = db.prepare(countQuery).get(...params) as { count: number }
    
    const dataQuery = `
      SELECT p.* FROM posts p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `
    const posts = db.prepare(dataQuery).all(...params, limit, offset) as Post[]
    
    return {
      data: posts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  }

  function findById(id: number, status?: PostStatus | PostStatus[]): Post | undefined {
    const { clause, params } = buildStatusCondition(status)
    return db.prepare(`SELECT p.* FROM posts p WHERE p.id = ?${clause}`).get(id, ...params) as Post | undefined
  }

  function findBySlug(slug: string, status?: PostStatus | PostStatus[]): Post | undefined {
    const { clause, params } = buildStatusCondition(status)
    return db.prepare(`SELECT p.* FROM posts p WHERE p.slug = ?${clause}`).get(slug, ...params) as Post | undefined
  }

  function findPublicBySlug(slug: string): Post | undefined {
    return findBySlug(slug, 'published')
  }

  function findPublicById(id: number): Post | undefined {
    return findById(id, 'published')
  }

  function findByCategory(categorySlug: string, status: PostStatus | PostStatus[] = 'published'): Post[] {
    const { clause, params } = buildStatusCondition(status)
    return db.prepare(`
      SELECT p.* FROM posts p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE c.slug = ?${clause}
      ORDER BY p.created_at DESC
    `).all(categorySlug, ...params) as Post[]
  }

  function search(query: string, status: PostStatus | PostStatus[] = 'published'): Post[] {
    const searchTerm = `%${query}%`
    const { clause, params: statusParams } = buildStatusCondition(status)
    return db.prepare(`
      SELECT DISTINCT p.* FROM posts p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE 1=1${clause} AND (p.title LIKE ? OR p.excerpt LIKE ? OR p.content LIKE ?)
      ORDER BY p.created_at DESC
    `).all(...statusParams, searchTerm, searchTerm, searchTerm) as Post[]
  }

  function findRelated(postId: number, limit = 3, status: PostStatus | PostStatus[] = 'published'): Post[] {
    const post = findPublicById(postId)
    if (!post || !post.category_id) return []
    
    const { clause, params: statusParams } = buildStatusCondition(status)
    return db.prepare(`
      SELECT p.* FROM posts p
      WHERE p.category_id = ? AND p.id != ?${clause}
      ORDER BY p.created_at DESC
      LIMIT ?
    `).all(post.category_id, postId, ...statusParams, limit) as Post[]
  }

  function create(input: { title: string, slug: string, status?: PostStatus, excerpt?: string, content?: string }): Post {
    const stmt = db.prepare(`
      INSERT INTO posts (title, slug, excerpt, content, status, read_time)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    const result = stmt.run(
      input.title,
      input.slug,
      input.excerpt || null,
      input.content || null,
      input.status || 'draft',
      5
    )
    return findById(result.lastInsertRowid as number)!
  }

  function update(id: number, input: { status?: PostStatus }): Post | undefined {
    if (input.status !== undefined) {
      db.prepare('UPDATE posts SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(input.status, id)
    }
    return findById(id)
  }

  function updateStatus(id: number, status: PostStatus): Post | undefined {
    return update(id, { status })
  }

  function bulkUpdateStatus(ids: number[], status: PostStatus): number {
    if (ids.length === 0) return 0
    const placeholders = ids.map(() => '?').join(', ')
    const result = db.prepare(`UPDATE posts SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id IN (${placeholders})`).run(status, ...ids)
    return result.changes
  }

  function incrementViews(id: number): boolean {
    const result = db.prepare('UPDATE posts SET views = views + 1 WHERE id = ? AND status = ?').run(id, 'published')
    return result.changes > 0
  }

  function incrementLikes(id: number): boolean {
    const result = db.prepare('UPDATE posts SET likes = likes + 1 WHERE id = ? AND status = ?').run(id, 'published')
    return result.changes > 0
  }

  function countByStatus(): Record<PostStatus, number> {
    const result = db.prepare(`SELECT status, COUNT(*) as count FROM posts GROUP BY status`).all() as { status: PostStatus, count: number }[]
    const counts: Record<PostStatus, number> = { draft: 0, published: 0, offline: 0 }
    for (const row of result) {
      counts[row.status] = row.count
    }
    return counts
  }

  return {
    findAll,
    findAllPaginated,
    findById,
    findBySlug,
    findPublicBySlug,
    findPublicById,
    findByCategory,
    search,
    findRelated,
    create,
    update,
    updateStatus,
    bulkUpdateStatus,
    incrementViews,
    incrementLikes,
    countByStatus
  }
}

let passed = 0
let failed = 0

function test(name: string, fn: () => void) {
  try {
    fn()
    console.log(`  ✓ ${name}`)
    passed++
  } catch (err) {
    console.log(`  ✗ ${name}`)
    console.log(`    ${(err as Error).message}`)
    failed++
  }
}

console.log('\n=== Post Status Consistency Regression Tests ===\n')

const db = createTestDb()
const repo = createPostRepository(db)

const draftPost = repo.create({ title: 'Draft Article', slug: 'draft-article', status: 'draft', content: 'draft content' })
const publishedPost = repo.create({ title: 'Published Article', slug: 'published-article', status: 'published', content: 'published content' })
const offlinePost = repo.create({ title: 'Offline Article', slug: 'offline-article', status: 'offline', content: 'offline content' })

console.log('1. Public access isolation tests:')

test('findPublicBySlug returns published posts', () => {
  const p = repo.findPublicBySlug('published-article')
  assert.ok(p, 'Published post should be found via public slug lookup')
  assert.equal(p.status, 'published')
})

test('findPublicBySlug returns undefined for draft posts', () => {
  const p = repo.findPublicBySlug('draft-article')
  assert.equal(p, undefined, 'Draft post should NOT be found via public slug lookup')
})

test('findPublicBySlug returns undefined for offline posts', () => {
  const p = repo.findPublicBySlug('offline-article')
  assert.equal(p, undefined, 'Offline post should NOT be found via public slug lookup')
})

test('findPublicById returns published posts', () => {
  const p = repo.findPublicById(publishedPost.id)
  assert.ok(p, 'Published post should be found via public ID lookup')
})

test('findPublicById returns undefined for draft posts', () => {
  const p = repo.findPublicById(draftPost.id)
  assert.equal(p, undefined, 'Draft post should NOT be found via public ID lookup')
})

test('findPublicById returns undefined for offline posts', () => {
  const p = repo.findPublicById(offlinePost.id)
  assert.equal(p, undefined, 'Offline post should NOT be found via public ID lookup')
})

console.log('\n2. Search tests:')

test('search with default status only returns published posts', () => {
  const results = repo.search('article')
  assert.equal(results.length, 1, 'Only 1 post (published) should be found by public search')
  assert.equal(results[0].status, 'published')
})

test('search with explicit draft status finds drafts', () => {
  const results = repo.search('article', 'draft')
  assert.equal(results.length, 1)
  assert.equal(results[0].status, 'draft')
})

console.log('\n3. View/Like protection tests:')

test('incrementViews succeeds for published posts', () => {
  const before = (repo.findPublicById(publishedPost.id))!.views
  const ok = repo.incrementViews(publishedPost.id)
  const after = (repo.findPublicById(publishedPost.id))!.views
  assert.equal(ok, true)
  assert.equal(after, before + 1)
})

test('incrementViews fails for draft posts', () => {
  const ok = repo.incrementViews(draftPost.id)
  assert.equal(ok, false, 'Should not increment views on draft post')
})

test('incrementViews fails for offline posts', () => {
  const ok = repo.incrementViews(offlinePost.id)
  assert.equal(ok, false, 'Should not increment views on offline post')
})

test('incrementLikes succeeds for published posts', () => {
  const before = (repo.findPublicById(publishedPost.id))!.likes
  const ok = repo.incrementLikes(publishedPost.id)
  const after = (repo.findPublicById(publishedPost.id))!.likes
  assert.equal(ok, true)
  assert.equal(after, before + 1)
})

test('incrementLikes fails for draft posts', () => {
  const ok = repo.incrementLikes(draftPost.id)
  assert.equal(ok, false)
})

test('incrementLikes fails for offline posts', () => {
  const ok = repo.incrementLikes(offlinePost.id)
  assert.equal(ok, false)
})

console.log('\n4. Status transition tests:')

test('publish draft: draft -> published', () => {
  const newDraft = repo.create({ title: 'New Draft', slug: 'new-draft', status: 'draft' })
  const updated = repo.updateStatus(newDraft.id, 'published')
  assert.ok(updated)
  assert.equal(updated!.status, 'published')
  const pub = repo.findPublicBySlug('new-draft')
  assert.ok(pub, 'Post should now be publicly visible after publishing')
})

test('offline published: published -> offline', () => {
  const newPub = repo.create({ title: 'New Pub', slug: 'new-pub', status: 'published' })
  assert.ok(repo.findPublicBySlug('new-pub'))
  const updated = repo.updateStatus(newPub.id, 'offline')
  assert.ok(updated)
  assert.equal(updated!.status, 'offline')
  assert.equal(repo.findPublicBySlug('new-pub'), undefined, 'Offline post should not be public')
})

test('restore offline: offline -> published', () => {
  const newOffline = repo.create({ title: 'New Offline', slug: 'new-offline', status: 'offline' })
  assert.equal(repo.findPublicBySlug('new-offline'), undefined)
  repo.updateStatus(newOffline.id, 'published')
  assert.ok(repo.findPublicBySlug('new-offline'), 'Restored post should be public again')
})

test('revert to draft: published -> draft', () => {
  const toDraft = repo.create({ title: 'To Draft', slug: 'to-draft', status: 'published' })
  assert.ok(repo.findPublicBySlug('to-draft'))
  repo.updateStatus(toDraft.id, 'draft')
  assert.equal(repo.findPublicBySlug('to-draft'), undefined)
})

console.log('\n5. Bulk operations tests:')

test('bulkUpdateStatus updates correct count', () => {
  const b1 = repo.create({ title: 'B1', slug: 'b1', status: 'draft' })
  const b2 = repo.create({ title: 'B2', slug: 'b2', status: 'draft' })
  const b3 = repo.create({ title: 'B3', slug: 'b3', status: 'offline' })
  const count = repo.bulkUpdateStatus([b1.id, b2.id], 'published')
  assert.equal(count, 2, 'Should update 2 posts')
  assert.ok(repo.findPublicBySlug('b1'))
  assert.ok(repo.findPublicBySlug('b2'))
  assert.equal(repo.findPublicBySlug('b3'), undefined, 'Unselected post should remain offline')
})

test('bulkUpdateStatus on empty array returns 0', () => {
  assert.equal(repo.bulkUpdateStatus([], 'published'), 0)
})

console.log('\n6. Count by status tests:')

test('countByStatus returns accurate counts', () => {
  const counts = repo.countByStatus()
  assert.ok(counts.draft >= 1, 'Should have at least 1 draft')
  assert.ok(counts.published >= 1, 'Should have at least 1 published')
  assert.ok(counts.offline >= 1, 'Should have at least 1 offline')
})

console.log('\n7. Pagination tests:')

test('findAllPaginated with status=published returns only published', () => {
  const result = repo.findAllPaginated({ status: 'published', page: 1, limit: 100 })
  assert.ok(result.total >= 1)
  for (const p of result.data) {
    assert.equal(p.status, 'published', 'All paginated public results must be published')
  }
})

test('findAllPaginated without status returns all posts', () => {
  const allResult = repo.findAllPaginated({ page: 1, limit: 100 })
  const pubResult = repo.findAllPaginated({ status: 'published', page: 1, limit: 100 })
  assert.ok(allResult.total > pubResult.total, 'Total posts should be greater than published-only count')
})

console.log('\n8. Related posts tests:')

db.exec(`INSERT INTO categories (name, slug) VALUES ('Tech', 'tech')`)
const catTech = db.prepare('SELECT id FROM categories WHERE slug = ?').get('tech') as { id: number }

const catPub1 = repo.create({ title: 'CatPub1', slug: 'cat-pub-1', status: 'published' })
const catPub2 = repo.create({ title: 'CatPub2', slug: 'cat-pub-2', status: 'published' })
const catDraft = repo.create({ title: 'CatDraft', slug: 'cat-draft', status: 'draft' })

db.prepare('UPDATE posts SET category_id = ? WHERE slug IN (?, ?, ?)').run(catTech.id, 'cat-pub-1', 'cat-pub-2', 'cat-draft')

test('findRelated returns only published related posts', () => {
  const related = repo.findRelated(catPub1.id, 10)
  assert.equal(related.length, 1, 'Only 1 published post should be related')
  assert.equal(related[0].slug, 'cat-pub-2')
  assert.equal(related[0].status, 'published')
})

test('findRelated for non-published source returns empty', () => {
  const related = repo.findRelated(catDraft.id, 10)
  assert.equal(related.length, 0, 'Draft post should not return related posts publicly')
})

console.log('\n9. Invalid status rejection test:')

test('database CHECK constraint rejects invalid status', () => {
  let threw = false
  try {
    db.prepare(`INSERT INTO posts (title, slug, status) VALUES ('bad', 'bad-status', 'invalid_status')`).run()
  } catch {
    threw = true
  }
  assert.ok(threw, 'Database should reject invalid status values via CHECK constraint')
})

db.close()

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`)

if (failed > 0) {
  process.exit(1)
}
