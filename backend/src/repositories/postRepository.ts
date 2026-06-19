import { db } from '../db.js'
import type { Post, CreatePostInput, UpdatePostInput, PostStatus } from '../types.js'

interface PaginatedResult {
  data: Post[]
  total: number
  page: number
  limit: number
  totalPages: number
}

interface FindAllOptions {
  status?: PostStatus | PostStatus[]
  page?: number
  limit?: number
  search?: string
  categorySlug?: string
}

function getPostTags(postId: number): string[] {
  const tags = db.prepare(`
    SELECT t.name FROM tags t
    JOIN post_tags pt ON pt.tag_id = t.id
    WHERE pt.post_id = ?
  `).all(postId) as { name: string }[]
  return tags.map(t => t.name)
}

function setPostTags(postId: number, tags: string[]) {
  db.prepare('DELETE FROM post_tags WHERE post_id = ?').run(postId)
  
  for (const tagName of tags) {
    let tag = db.prepare('SELECT id FROM tags WHERE name = ?').get(tagName) as { id: number } | undefined
    if (!tag) {
      const result = db.prepare('INSERT INTO tags (name) VALUES (?)').run(tagName)
      tag = { id: result.lastInsertRowid as number }
    }
    db.prepare('INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?)').run(postId, tag.id)
  }
}

function enrichPost(post: Post): Post {
  return {
    ...post,
    tags: getPostTags(post.id)
  }
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

export const postRepository = {
  findAll(status?: PostStatus | PostStatus[]): Post[] {
    const { clause, params } = buildStatusCondition(status)
    let query = `
      SELECT p.*, 
        c.name as category, c.slug as category_slug, c.color as category_color,
        a.name as author_name, a.avatar as author_avatar, a.bio as author_bio
      FROM posts p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN authors a ON p.author_id = a.id
      WHERE 1=1${clause}
      ORDER BY p.created_at DESC
    `
    const posts = db.prepare(query).all(...params) as Post[]
    return posts.map(enrichPost)
  },

  findAllPaginated(options: FindAllOptions): PaginatedResult {
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
      SELECT p.*, 
        c.name as category, c.slug as category_slug, c.color as category_color,
        a.name as author_name, a.avatar as author_avatar, a.bio as author_bio
      FROM posts p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN authors a ON p.author_id = a.id
      WHERE ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `
    const posts = db.prepare(dataQuery).all(...params, limit, offset) as Post[]
    
    return {
      data: posts.map(enrichPost),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  },

  findById(id: number, status?: PostStatus | PostStatus[]): Post | undefined {
    const { clause, params } = buildStatusCondition(status)
    const post = db.prepare(`
      SELECT p.*, 
        c.name as category, c.slug as category_slug, c.color as category_color,
        a.name as author_name, a.avatar as author_avatar, a.bio as author_bio
      FROM posts p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN authors a ON p.author_id = a.id
      WHERE p.id = ?${clause}
    `).get(id, ...params) as Post | undefined
    return post ? enrichPost(post) : undefined
  },

  findBySlug(slug: string, status?: PostStatus | PostStatus[]): Post | undefined {
    const { clause, params } = buildStatusCondition(status)
    const post = db.prepare(`
      SELECT p.*, 
        c.name as category, c.slug as category_slug, c.color as category_color,
        a.name as author_name, a.avatar as author_avatar, a.bio as author_bio
      FROM posts p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN authors a ON p.author_id = a.id
      WHERE p.slug = ?${clause}
    `).get(slug, ...params) as Post | undefined
    return post ? enrichPost(post) : undefined
  },

  findPublicBySlug(slug: string): Post | undefined {
    return this.findBySlug(slug, 'published')
  },

  findPublicById(id: number): Post | undefined {
    return this.findById(id, 'published')
  },

  findByCategory(categorySlug: string, status: PostStatus | PostStatus[] = 'published'): Post[] {
    const { clause, params } = buildStatusCondition(status)
    const posts = db.prepare(`
      SELECT p.*, 
        c.name as category, c.slug as category_slug, c.color as category_color,
        a.name as author_name, a.avatar as author_avatar, a.bio as author_bio
      FROM posts p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN authors a ON p.author_id = a.id
      WHERE c.slug = ?${clause}
      ORDER BY p.created_at DESC
    `).all(categorySlug, ...params) as Post[]
    return posts.map(enrichPost)
  },

  search(query: string, status: PostStatus | PostStatus[] = 'published'): Post[] {
    const searchTerm = `%${query}%`
    const { clause, params: statusParams } = buildStatusCondition(status)
    const posts = db.prepare(`
      SELECT DISTINCT p.*, 
        c.name as category, c.slug as category_slug, c.color as category_color,
        a.name as author_name, a.avatar as author_avatar, a.bio as author_bio
      FROM posts p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN authors a ON p.author_id = a.id
      LEFT JOIN post_tags pt ON pt.post_id = p.id
      LEFT JOIN tags t ON t.id = pt.tag_id
      WHERE 1=1${clause} AND (
        p.title LIKE ? OR p.excerpt LIKE ? OR p.content LIKE ? OR t.name LIKE ?
      )
      ORDER BY p.created_at DESC
    `).all(...statusParams, searchTerm, searchTerm, searchTerm, searchTerm) as Post[]
    return posts.map(enrichPost)
  },

  findRelated(postId: number, limit = 3, status: PostStatus | PostStatus[] = 'published'): Post[] {
    const post = this.findPublicById(postId)
    if (!post || !post.category_slug) return []
    
    const { clause, params: statusParams } = buildStatusCondition(status)
    const posts = db.prepare(`
      SELECT p.*, 
        c.name as category, c.slug as category_slug, c.color as category_color,
        a.name as author_name, a.avatar as author_avatar, a.bio as author_bio
      FROM posts p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN authors a ON p.author_id = a.id
      WHERE c.slug = ? AND p.id != ?${clause}
      ORDER BY p.created_at DESC
      LIMIT ?
    `).all(post.category_slug, postId, ...statusParams, limit) as Post[]
    return posts.map(enrichPost)
  },

  create(input: CreatePostInput): Post {
    const stmt = db.prepare(`
      INSERT INTO posts (title, slug, excerpt, content, image, category_id, author_id, status, read_time)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    const result = stmt.run(
      input.title,
      input.slug,
      input.excerpt || null,
      input.content || null,
      input.image || null,
      input.category_id || null,
      input.author_id || null,
      input.status || 'draft',
      input.read_time || 5
    )
    const postId = result.lastInsertRowid as number
    if (input.tags?.length) {
      setPostTags(postId, input.tags)
    }
    return this.findById(postId)!
  },

  update(id: number, input: UpdatePostInput): Post | undefined {
    const post = this.findById(id)
    if (!post) return undefined

    const fields: string[] = []
    const values: (string | number | null)[] = []

    if (input.title !== undefined) { fields.push('title = ?'); values.push(input.title) }
    if (input.slug !== undefined) { fields.push('slug = ?'); values.push(input.slug) }
    if (input.excerpt !== undefined) { fields.push('excerpt = ?'); values.push(input.excerpt || null) }
    if (input.content !== undefined) { fields.push('content = ?'); values.push(input.content || null) }
    if (input.image !== undefined) { fields.push('image = ?'); values.push(input.image || null) }
    if (input.category_id !== undefined) { fields.push('category_id = ?'); values.push(input.category_id || null) }
    if (input.author_id !== undefined) { fields.push('author_id = ?'); values.push(input.author_id || null) }
    if (input.status !== undefined) { fields.push('status = ?'); values.push(input.status) }
    if (input.read_time !== undefined) { fields.push('read_time = ?'); values.push(input.read_time) }

    if (fields.length > 0) {
      fields.push('updated_at = CURRENT_TIMESTAMP')
      const stmt = db.prepare(`UPDATE posts SET ${fields.join(', ')} WHERE id = ?`)
      stmt.run(...values, id)
    }

    if (input.tags !== undefined) {
      setPostTags(id, input.tags)
    }
    return this.findById(id)
  },

  updateStatus(id: number, status: PostStatus): Post | undefined {
    return this.update(id, { status })
  },

  bulkUpdateStatus(ids: number[], status: PostStatus): number {
    if (ids.length === 0) return 0
    const placeholders = ids.map(() => '?').join(', ')
    const result = db.prepare(`UPDATE posts SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id IN (${placeholders})`).run(status, ...ids)
    return result.changes
  },

  delete(id: number): boolean {
    const result = db.prepare('DELETE FROM posts WHERE id = ?').run(id)
    return result.changes > 0
  },

  incrementViews(id: number): boolean {
    const result = db.prepare('UPDATE posts SET views = views + 1 WHERE id = ? AND status = ?').run(id, 'published')
    return result.changes > 0
  },

  incrementLikes(id: number): boolean {
    const result = db.prepare('UPDATE posts SET likes = likes + 1 WHERE id = ? AND status = ?').run(id, 'published')
    return result.changes > 0
  },

  countByStatus(): Record<PostStatus, number> {
    const result = db.prepare(`
      SELECT status, COUNT(*) as count 
      FROM posts 
      GROUP BY status
    `).all() as { status: PostStatus, count: number }[]
    
    const counts: Record<PostStatus, number> = {
      draft: 0,
      published: 0,
      offline: 0
    }
    
    for (const row of result) {
      counts[row.status] = row.count
    }
    
    return counts
  }
}
