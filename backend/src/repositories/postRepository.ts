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
  categoryId?: number
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

function buildWhereClause(options: FindAllOptions): { where: string; params: (string | number)[] } {
  const conditions: string[] = []
  const params: (string | number)[] = []

  if (options.status) {
    if (Array.isArray(options.status)) {
      if (options.status.length > 0) {
        const placeholders = options.status.map(() => '?').join(', ')
        conditions.push(`p.status IN (${placeholders})`)
        params.push(...options.status)
      }
    } else {
      conditions.push('p.status = ?')
      params.push(options.status)
    }
  }

  if (options.search) {
    conditions.push('(p.title LIKE ? OR p.excerpt LIKE ? OR p.content LIKE ?)')
    const searchTerm = `%${options.search}%`
    params.push(searchTerm, searchTerm, searchTerm)
  }

  if (options.categoryId) {
    conditions.push('p.category_id = ?')
    params.push(options.categoryId)
  }

  if (options.categorySlug) {
    conditions.push('c.slug = ?')
    params.push(options.categorySlug)
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  return { where, params }
}

export const postRepository = {
  // ========== ADMIN METHODS (no status restrictions) ==========
  
  findAll(status?: PostStatus): Post[] {
    let query = `
      SELECT p.*, 
        c.name as category, c.slug as category_slug, c.color as category_color,
        a.name as author_name, a.avatar as author_avatar, a.bio as author_bio
      FROM posts p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN authors a ON p.author_id = a.id
    `
    if (status) {
      query += ` WHERE p.status = ?`
    }
    query += ` ORDER BY p.created_at DESC`
    
    const posts = (status 
      ? db.prepare(query).all(status) 
      : db.prepare(query).all()) as Post[]
    return posts.map(enrichPost)
  },

  findAllPaginated(options: FindAllOptions): PaginatedResult {
    const { page = 1, limit = 20 } = options
    const offset = (page - 1) * limit
    
    const { where, params } = buildWhereClause(options)
    
    const countQuery = `SELECT COUNT(*) as count FROM posts p LEFT JOIN categories c ON p.category_id = c.id ${where}`
    const { count: total } = db.prepare(countQuery).get(...params) as { count: number }
    
    const dataQuery = `
      SELECT p.*, 
        c.name as category, c.slug as category_slug, c.color as category_color,
        a.name as author_name, a.avatar as author_avatar, a.bio as author_bio
      FROM posts p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN authors a ON p.author_id = a.id
      ${where}
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

  findById(id: number): Post | undefined {
    const post = db.prepare(`
      SELECT p.*, 
        c.name as category, c.slug as category_slug, c.color as category_color,
        a.name as author_name, a.avatar as author_avatar, a.bio as author_bio
      FROM posts p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN authors a ON p.author_id = a.id
      WHERE p.id = ?
    `).get(id) as Post | undefined
    return post ? enrichPost(post) : undefined
  },

  findBySlug(slug: string): Post | undefined {
    const post = db.prepare(`
      SELECT p.*, 
        c.name as category, c.slug as category_slug, c.color as category_color,
        a.name as author_name, a.avatar as author_avatar, a.bio as author_bio
      FROM posts p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN authors a ON p.author_id = a.id
      WHERE p.slug = ?
    `).get(slug) as Post | undefined
    return post ? enrichPost(post) : undefined
  },

  // ========== PUBLIC METHODS (only published articles) ==========

  findAllPublic(options: Omit<FindAllOptions, 'status'> = {}): PaginatedResult {
    return this.findAllPaginated({ ...options, status: 'published' })
  },

  findPublishedBySlug(slug: string): Post | undefined {
    const post = db.prepare(`
      SELECT p.*, 
        c.name as category, c.slug as category_slug, c.color as category_color,
        a.name as author_name, a.avatar as author_avatar, a.bio as author_bio
      FROM posts p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN authors a ON p.author_id = a.id
      WHERE p.slug = ? AND p.status = 'published'
    `).get(slug) as Post | undefined
    return post ? enrichPost(post) : undefined
  },

  findPublishedById(id: number): Post | undefined {
    const post = db.prepare(`
      SELECT p.*, 
        c.name as category, c.slug as category_slug, c.color as category_color,
        a.name as author_name, a.avatar as author_avatar, a.bio as author_bio
      FROM posts p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN authors a ON p.author_id = a.id
      WHERE p.id = ? AND p.status = 'published'
    `).get(id) as Post | undefined
    return post ? enrichPost(post) : undefined
  },

  findPublishedByCategory(categorySlug: string): Post[] {
    const posts = db.prepare(`
      SELECT p.*, 
        c.name as category, c.slug as category_slug, c.color as category_color,
        a.name as author_name, a.avatar as author_avatar, a.bio as author_bio
      FROM posts p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN authors a ON p.author_id = a.id
      WHERE c.slug = ? AND p.status = 'published'
      ORDER BY p.created_at DESC
    `).all(categorySlug) as Post[]
    return posts.map(enrichPost)
  },

  searchPublished(query: string): Post[] {
    const searchTerm = `%${query}%`
    const posts = db.prepare(`
      SELECT DISTINCT p.*, 
        c.name as category, c.slug as category_slug, c.color as category_color,
        a.name as author_name, a.avatar as author_avatar, a.bio as author_bio
      FROM posts p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN authors a ON p.author_id = a.id
      LEFT JOIN post_tags pt ON pt.post_id = p.id
      LEFT JOIN tags t ON t.id = pt.tag_id
      WHERE p.status = 'published' AND (
        p.title LIKE ? OR p.excerpt LIKE ? OR p.content LIKE ? OR t.name LIKE ?
      )
      ORDER BY p.created_at DESC
    `).all(searchTerm, searchTerm, searchTerm, searchTerm) as Post[]
    return posts.map(enrichPost)
  },

  findRelatedPublished(postId: number, limit = 3): Post[] {
    const post = this.findPublishedById(postId)
    if (!post || !post.category_slug) return []
    
    const posts = db.prepare(`
      SELECT p.*, 
        c.name as category, c.slug as category_slug, c.color as category_color,
        a.name as author_name, a.avatar as author_avatar, a.bio as author_bio
      FROM posts p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN authors a ON p.author_id = a.id
      WHERE c.slug = ? AND p.id != ? AND p.status = 'published'
      ORDER BY p.created_at DESC
      LIMIT ?
    `).all(post.category_slug, postId, limit) as Post[]
    return posts.map(enrichPost)
  },

  getLatestPublished(limit: number = 20): Post[] {
    const result = this.findAllPublic({ limit })
    return result.data
  },

  // ========== WRITE METHODS ==========

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

  bulkUpdateStatus(ids: number[], status: PostStatus): number {
    if (ids.length === 0) return 0
    const placeholders = ids.map(() => '?').join(', ')
    const stmt = db.prepare(`UPDATE posts SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id IN (${placeholders})`)
    const result = stmt.run(status, ...ids)
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

  getStats(): { total_posts: number; published_posts: number; draft_posts: number; archived_posts: number; total_views: number; total_likes: number; total_categories: number; total_authors: number } {
    return db.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM posts) as total_posts,
        (SELECT COUNT(*) FROM posts WHERE status = 'published') as published_posts,
        (SELECT COUNT(*) FROM posts WHERE status = 'draft') as draft_posts,
        (SELECT COUNT(*) FROM posts WHERE status = 'archived') as archived_posts,
        (SELECT COALESCE(SUM(views), 0) FROM posts WHERE status = 'published') as total_views,
        (SELECT COALESCE(SUM(likes), 0) FROM posts WHERE status = 'published') as total_likes,
        (SELECT COUNT(*) FROM categories) as total_categories,
        (SELECT COUNT(*) FROM authors) as total_authors
    `).get() as any
  }
}
