import { db } from '../db.js'
import type { Post, CreatePostInput, UpdatePostInput } from '../types.js'

interface PaginatedResult {
  data: Post[]
  total: number
  page: number
  limit: number
  totalPages: number
}

interface FindAllOptions {
  status?: 'draft' | 'published'
  page?: number
  limit?: number
  search?: string
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

export const postRepository = {
  findAll(status?: 'draft' | 'published'): Post[] {
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
    const { status, page = 1, limit = 20, search } = options
    const offset = (page - 1) * limit
    
    let whereClause = '1=1'
    const params: (string | number)[] = []
    
    if (status) {
      whereClause += ' AND p.status = ?'
      params.push(status)
    }
    
    if (search) {
      whereClause += ' AND (p.title LIKE ? OR p.excerpt LIKE ?)'
      params.push(`%${search}%`, `%${search}%`)
    }
    
    // Get total count
    const countQuery = `SELECT COUNT(*) as count FROM posts p WHERE ${whereClause}`
    const { count: total } = db.prepare(countQuery).get(...params) as { count: number }
    
    // Get paginated data
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

  findByCategory(categorySlug: string): Post[] {
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

  search(query: string): Post[] {
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
        p.title LIKE ? OR p.excerpt LIKE ? OR t.name LIKE ?
      )
      ORDER BY p.created_at DESC
    `).all(searchTerm, searchTerm, searchTerm) as Post[]
    return posts.map(enrichPost)
  },

  findRelated(postId: number, limit = 3): Post[] {
    const post = this.findById(postId)
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

  delete(id: number): boolean {
    const result = db.prepare('DELETE FROM posts WHERE id = ?').run(id)
    return result.changes > 0
  },

  incrementViews(id: number): void {
    db.prepare('UPDATE posts SET views = views + 1 WHERE id = ?').run(id)
  },

  incrementLikes(id: number): void {
    db.prepare('UPDATE posts SET likes = likes + 1 WHERE id = ?').run(id)
  }
}
