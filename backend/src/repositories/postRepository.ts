import { db as defaultDb } from '../db.js'
import type { Post, PostStatus, CreatePostInput, UpdatePostInput } from '../types.js'
import type Database from 'better-sqlite3'

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
}

export class PostRepository {
  private db: Database.Database

  constructor(db?: Database.Database) {
    this.db = db || defaultDb
  }

  private getPostTags(postId: number): string[] {
    try {
      const tags = this.db.prepare(`
        SELECT t.name FROM tags t
        JOIN post_tags pt ON pt.tag_id = t.id
        WHERE pt.post_id = ?
      `).all(postId) as { name: string }[]
      return tags.map(t => t.name)
    } catch {
      return []
    }
  }

  private setPostTags(postId: number, tags: string[]) {
    try {
      this.db.prepare('DELETE FROM post_tags WHERE post_id = ?').run(postId)
      
      for (const tagName of tags) {
        let tag = this.db.prepare('SELECT id FROM tags WHERE name = ?').get(tagName) as { id: number } | undefined
        if (!tag) {
          const result = this.db.prepare('INSERT INTO tags (name) VALUES (?)').run(tagName)
          tag = { id: result.lastInsertRowid as number }
        }
        this.db.prepare('INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?)').run(postId, tag.id)
      }
    } catch {
    }
  }

  private enrichPost(post: Post): Post {
    return {
      ...post,
      tags: this.getPostTags(post.id)
    }
  }

  private buildStatusClause(alias: string, status?: PostStatus | PostStatus[]): { clause: string; params: (string | number)[] } {
    if (!status) {
      return { clause: '1=1', params: [] }
    }
    if (Array.isArray(status)) {
      if (status.length === 0) {
        return { clause: '1=1', params: [] }
      }
      const placeholders = status.map(() => '?').join(', ')
      return { clause: `${alias}.status IN (${placeholders})`, params: [...status] }
    }
    return { clause: `${alias}.status = ?`, params: [status] }
  }

  findAll(status?: PostStatus | PostStatus[]): Post[] {
    const { clause, params } = this.buildStatusClause('p', status)
    let query = `
      SELECT p.*, 
        c.name as category, c.slug as category_slug, c.color as category_color,
        a.name as author_name, a.avatar as author_avatar, a.bio as author_bio
      FROM posts p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN authors a ON p.author_id = a.id
      WHERE ${clause}
      ORDER BY p.created_at DESC
    `
    
    const posts = this.db.prepare(query).all(...params) as Post[]
    return posts.map(p => this.enrichPost(p))
  }

  findAllPaginated(options: FindAllOptions): PaginatedResult {
    const { status, page = 1, limit = 20, search } = options
    const offset = (page - 1) * limit
    
    const conditions: string[] = ['1=1']
    const params: (string | number)[] = []
    
    const { clause: statusClause, params: statusParams } = this.buildStatusClause('p', status)
    conditions.push(statusClause)
    params.push(...statusParams)
    
    if (search) {
      conditions.push('(p.title LIKE ? OR p.excerpt LIKE ? OR p.content LIKE ?)')
      params.push(`%${search}%`, `%${search}%`, `%${search}%`)
    }
    
    const whereClause = conditions.join(' AND ')
    
    const countQuery = `SELECT COUNT(*) as count FROM posts p WHERE ${whereClause}`
    const { count: total } = this.db.prepare(countQuery).get(...params) as { count: number }
    
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
    const posts = this.db.prepare(dataQuery).all(...params, limit, offset) as Post[]
    
    return {
      data: posts.map(p => this.enrichPost(p)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  }

  findById(id: number, status?: PostStatus | PostStatus[]): Post | undefined {
    const { clause, params } = this.buildStatusClause('p', status)
    const post = this.db.prepare(`
      SELECT p.*, 
        c.name as category, c.slug as category_slug, c.color as category_color,
        a.name as author_name, a.avatar as author_avatar, a.bio as author_bio
      FROM posts p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN authors a ON p.author_id = a.id
      WHERE p.id = ? AND ${clause}
    `).get(id, ...params) as Post | undefined
    return post ? this.enrichPost(post) : undefined
  }

  findBySlug(slug: string, status?: PostStatus | PostStatus[]): Post | undefined {
    const { clause, params } = this.buildStatusClause('p', status)
    const post = this.db.prepare(`
      SELECT p.*, 
        c.name as category, c.slug as category_slug, c.color as category_color,
        a.name as author_name, a.avatar as author_avatar, a.bio as author_bio
      FROM posts p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN authors a ON p.author_id = a.id
      WHERE p.slug = ? AND ${clause}
    `).get(slug, ...params) as Post | undefined
    return post ? this.enrichPost(post) : undefined
  }

  findPublicBySlug(slug: string): Post | undefined {
    return this.findBySlug(slug, 'published')
  }

  findPublicById(id: number): Post | undefined {
    return this.findById(id, 'published')
  }

  findByCategory(categorySlug: string, status: PostStatus | PostStatus[] = 'published'): Post[] {
    const { clause, params } = this.buildStatusClause('p', status)
    const posts = this.db.prepare(`
      SELECT p.*, 
        c.name as category, c.slug as category_slug, c.color as category_color,
        a.name as author_name, a.avatar as author_avatar, a.bio as author_bio
      FROM posts p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN authors a ON p.author_id = a.id
      WHERE c.slug = ? AND ${clause}
      ORDER BY p.created_at DESC
    `).all(categorySlug, ...params) as Post[]
    return posts.map(p => this.enrichPost(p))
  }

  findByCategoryId(categoryId: number, status: PostStatus | PostStatus[] = 'published'): Post[] {
    const { clause, params } = this.buildStatusClause('p', status)
    const posts = this.db.prepare(`
      SELECT p.*, 
        c.name as category, c.slug as category_slug, c.color as category_color,
        a.name as author_name, a.avatar as author_avatar, a.bio as author_bio
      FROM posts p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN authors a ON p.author_id = a.id
      WHERE c.id = ? AND ${clause}
      ORDER BY p.created_at DESC
    `).all(categoryId, ...params) as Post[]
    return posts.map(p => this.enrichPost(p))
  }

  search(query: string, status: PostStatus | PostStatus[] = 'published'): Post[] {
    const searchTerm = `%${query}%`
    const { clause, params: statusParams } = this.buildStatusClause('p', status)
    const posts = this.db.prepare(`
      SELECT DISTINCT p.*, 
        c.name as category, c.slug as category_slug, c.color as category_color,
        a.name as author_name, a.avatar as author_avatar, a.bio as author_bio
      FROM posts p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN authors a ON p.author_id = a.id
      WHERE ${clause} AND (
        p.title LIKE ? OR p.excerpt LIKE ? OR p.content LIKE ?
      )
      ORDER BY p.created_at DESC
    `).all(...statusParams, searchTerm, searchTerm, searchTerm) as Post[]
    return posts.map(p => this.enrichPost(p))
  }

  findRelated(postId: number, limit = 3, status: PostStatus = 'published'): Post[] {
    const post = this.findById(postId)
    if (!post || !post.category_id) return []
    
    const posts = this.db.prepare(`
      SELECT p.*, 
        c.name as category, c.slug as category_slug, c.color as category_color,
        a.name as author_name, a.avatar as author_avatar, a.bio as author_bio
      FROM posts p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN authors a ON p.author_id = a.id
      WHERE p.category_id = ? AND p.id != ? AND p.status = ?
      ORDER BY p.created_at DESC
      LIMIT ?
    `).all(post.category_id, postId, status, limit) as Post[]
    return posts.map(p => this.enrichPost(p))
  }

  create(input: CreatePostInput): Post {
    const stmt = this.db.prepare(`
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
      this.setPostTags(postId, input.tags)
    }
    return this.findById(postId)!
  }

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
      const stmt = this.db.prepare(`UPDATE posts SET ${fields.join(', ')} WHERE id = ?`)
      stmt.run(...values, id)
    }

    if (input.tags !== undefined) {
      this.setPostTags(id, input.tags)
    }
    return this.findById(id)
  }

  batchUpdateStatus(ids: number[], status: PostStatus): { updated: number } {
    if (ids.length === 0) return { updated: 0 }
    const placeholders = ids.map(() => '?').join(', ')
    const stmt = this.db.prepare(`UPDATE posts SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id IN (${placeholders})`)
    const result = stmt.run(status, ...ids)
    return { updated: result.changes }
  }

  delete(id: number): boolean {
    const result = this.db.prepare('DELETE FROM posts WHERE id = ?').run(id)
    return result.changes > 0
  }

  incrementViews(id: number): boolean {
    const result = this.db.prepare('UPDATE posts SET views = views + 1 WHERE id = ? AND status = ?').run(id, 'published')
    return result.changes > 0
  }

  incrementLikes(id: number): boolean {
    const result = this.db.prepare('UPDATE posts SET likes = likes + 1 WHERE id = ? AND status = ?').run(id, 'published')
    return result.changes > 0
  }

  countByStatus(): Record<PostStatus, number> {
    const rows = this.db.prepare(`
      SELECT status, COUNT(*) as count FROM posts GROUP BY status
    `).all() as { status: PostStatus; count: number }[]
    const result: Record<PostStatus, number> = { draft: 0, published: 0, archived: 0 }
    for (const row of rows) {
      result[row.status] = row.count
    }
    return result
  }
}

export const postRepository = new PostRepository()
