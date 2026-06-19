import { db } from '../db.js'
import {
  PUBLIC_POST_STATUSES,
  POST_STATUSES,
  type Post,
  type PostStatus,
  type CreatePostInput,
  type UpdatePostInput,
} from '../types.js'

interface PaginatedResult {
  data: Post[]
  total: number
  page: number
  limit: number
  totalPages: number
}

interface FindAllOptions {
  status?: PostStatus
  // 公共入口（前台/RSS/搜索/分类聚合）必须把 statuses 限定到 published。
  // 管理端默认会传 includeAll=true 以拿到 draft/published/archived。
  statuses?: PostStatus[]
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

function buildStatusClause(statuses: PostStatus[] | undefined): { clause: string; params: PostStatus[] } {
  if (!statuses || statuses.length === 0) {
    return { clause: '', params: [] }
  }
  const placeholders = statuses.map(() => '?').join(', ')
  return {
    clause: `p.status IN (${placeholders})`,
    params: statuses,
  }
}

function normalizeStatuses(options: FindAllOptions): PostStatus[] | undefined {
  if (options.statuses && options.statuses.length > 0) {
    // 仅保留合法状态，避免外部直接拼 SQL
    return options.statuses.filter((s): s is PostStatus => POST_STATUSES.includes(s))
  }
  if (options.status) {
    return [options.status]
  }
  return undefined
}

export const postRepository = {
  // 内部全集查询（管理端 / 测试 / 后台编辑用）
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
    const { page = 1, limit = 20, search } = options
    const statuses = normalizeStatuses(options)
    const offset = (page - 1) * limit

    const whereParts: string[] = []
    const params: (string | number)[] = []

    const { clause, params: statusParams } = buildStatusClause(statuses)
    if (clause) {
      whereParts.push(clause)
      params.push(...statusParams)
    }

    if (search) {
      whereParts.push('(p.title LIKE ? OR p.excerpt LIKE ?)')
      params.push(`%${search}%`, `%${search}%`)
    }

    const whereClause = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : ''

    const countQuery = `SELECT COUNT(*) as count FROM posts p ${whereClause}`
    const { count: total } = db.prepare(countQuery).get(...params) as { count: number }

    const dataQuery = `
      SELECT p.*, 
        c.name as category, c.slug as category_slug, c.color as category_color,
        a.name as author_name, a.avatar as author_avatar, a.bio as author_bio
      FROM posts p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN authors a ON p.author_id = a.id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `
    const posts = db.prepare(dataQuery).all(...params, limit, offset) as Post[]

    return {
      data: posts.map(enrichPost),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 0,
    }
  },

  findById(id: number, statuses?: PostStatus[]): Post | undefined {
    const { clause, params } = buildStatusClause(statuses)
    const where = clause ? ` AND ${clause}` : ''
    const post = db.prepare(`
      SELECT p.*, 
        c.name as category, c.slug as category_slug, c.color as category_color,
        a.name as author_name, a.avatar as author_avatar, a.bio as author_bio
      FROM posts p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN authors a ON p.author_id = a.id
      WHERE p.id = ?${where}
    `).get(id, ...params) as Post | undefined
    return post ? enrichPost(post) : undefined
  },

  findBySlug(slug: string, statuses?: PostStatus[]): Post | undefined {
    const { clause, params } = buildStatusClause(statuses)
    const where = clause ? ` AND ${clause}` : ''
    const post = db.prepare(`
      SELECT p.*, 
        c.name as category, c.slug as category_slug, c.color as category_color,
        a.name as author_name, a.avatar as author_avatar, a.bio as author_bio
      FROM posts p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN authors a ON p.author_id = a.id
      WHERE p.slug = ?${where}
    `).get(slug, ...params) as Post | undefined
    return post ? enrichPost(post) : undefined
  },

  findByCategory(categorySlug: string, statuses: PostStatus[] = PUBLIC_POST_STATUSES): Post[] {
    const { clause, params } = buildStatusClause(statuses)
    const where = clause ? ` AND ${clause}` : ''
    const posts = db.prepare(`
      SELECT p.*, 
        c.name as category, c.slug as category_slug, c.color as category_color,
        a.name as author_name, a.avatar as author_avatar, a.bio as author_bio
      FROM posts p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN authors a ON p.author_id = a.id
      WHERE c.slug = ?${where}
      ORDER BY p.created_at DESC
    `).all(categorySlug, ...params) as Post[]
    return posts.map(enrichPost)
  },

  search(query: string, statuses: PostStatus[] = PUBLIC_POST_STATUSES): Post[] {
    const searchTerm = `%${query}%`
    const { clause, params } = buildStatusClause(statuses)
    const where = clause ? ` AND ${clause}` : ''
    const posts = db.prepare(`
      SELECT DISTINCT p.*, 
        c.name as category, c.slug as category_slug, c.color as category_color,
        a.name as author_name, a.avatar as author_avatar, a.bio as author_bio
      FROM posts p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN authors a ON p.author_id = a.id
      LEFT JOIN post_tags pt ON pt.post_id = p.id
      LEFT JOIN tags t ON t.id = pt.tag_id
      WHERE (p.title LIKE ? OR p.excerpt LIKE ? OR t.name LIKE ?)${where}
      ORDER BY p.created_at DESC
    `).all(searchTerm, searchTerm, searchTerm, ...params) as Post[]
    return posts.map(enrichPost)
  },

  findRelated(postId: number, limit = 3, statuses: PostStatus[] = PUBLIC_POST_STATUSES): Post[] {
    // 主文章本身必须先满足公开状态，否则相关推荐也不应该出现在前台。
    const post = this.findById(postId, statuses)
    if (!post || !post.category_slug) return []

    const { clause, params } = buildStatusClause(statuses)
    const where = clause ? ` AND ${clause}` : ''
    const posts = db.prepare(`
      SELECT p.*, 
        c.name as category, c.slug as category_slug, c.color as category_color,
        a.name as author_name, a.avatar as author_avatar, a.bio as author_bio
      FROM posts p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN authors a ON p.author_id = a.id
      WHERE c.slug = ? AND p.id != ?${where}
      ORDER BY p.created_at DESC
      LIMIT ?
    `).all(post.category_slug, postId, ...params, limit) as Post[]
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

  // 批量切换状态：用于「批量下线」「批量恢复」「批量发布」等管理后台流程。
  // 通过事务一次性更新，避免分次写入造成「一半已下线、一半还可见」的中间态。
  bulkUpdateStatus(ids: number[], status: PostStatus): number {
    if (!ids.length) return 0
    if (!POST_STATUSES.includes(status)) {
      throw new Error(`Invalid status: ${status}`)
    }
    const placeholders = ids.map(() => '?').join(', ')
    const stmt = db.prepare(
      `UPDATE posts SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id IN (${placeholders})`
    )
    const txn = db.transaction((targetIds: number[]) => {
      const result = stmt.run(status, ...targetIds)
      return result.changes
    })
    return txn(ids) as number
  },

  delete(id: number): boolean {
    const result = db.prepare('DELETE FROM posts WHERE id = ?').run(id)
    return result.changes > 0
  },

  incrementViews(id: number, statuses: PostStatus[] = PUBLIC_POST_STATUSES): boolean {
    // 浏览量只能在 published 文章上累加，避免「下线后仍被外部直链刷量」。
    // 注意 UPDATE 没有表别名，这里需要直接用列名 status，而不是 p.status。
    const cleanStatuses = statuses?.length ? statuses : []
    if (!cleanStatuses.length) {
      const result = db
        .prepare(`UPDATE posts SET views = views + 1 WHERE id = ?`)
        .run(id)
      return result.changes > 0
    }
    const placeholders = cleanStatuses.map(() => '?').join(', ')
    const result = db
      .prepare(`UPDATE posts SET views = views + 1 WHERE id = ? AND status IN (${placeholders})`)
      .run(id, ...cleanStatuses)
    return result.changes > 0
  },

  incrementLikes(id: number, statuses: PostStatus[] = PUBLIC_POST_STATUSES): boolean {
    const cleanStatuses = statuses?.length ? statuses : []
    if (!cleanStatuses.length) {
      const result = db
        .prepare(`UPDATE posts SET likes = likes + 1 WHERE id = ?`)
        .run(id)
      return result.changes > 0
    }
    const placeholders = cleanStatuses.map(() => '?').join(', ')
    const result = db
      .prepare(`UPDATE posts SET likes = likes + 1 WHERE id = ? AND status IN (${placeholders})`)
      .run(id, ...cleanStatuses)
    return result.changes > 0
  },
}
