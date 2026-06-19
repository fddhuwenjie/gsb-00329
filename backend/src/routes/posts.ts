import { Router } from 'express'
import { body, param, query, validationResult } from 'express-validator'
import { postRepository } from '../repositories/postRepository.js'
import { POST_STATUSES, PUBLIC_POST_STATUSES, type PostStatus } from '../types.js'

const router = Router()

// 公网入口（详情页 / 搜索 / 分类 / 浏览量 / 点赞）必须命中这一份白名单。
// 任何想绕过它的代码都会被代码评审拦下来。
const PUBLIC_STATUSES: PostStatus[] = PUBLIC_POST_STATUSES

function parseIncludeAll(value: unknown): boolean {
  if (typeof value === 'string') {
    return value === '1' || value.toLowerCase() === 'true'
  }
  return Boolean(value)
}

// Get all posts with pagination and search
router.get('/',
  query('status').optional().isIn(POST_STATUSES),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().trim(),
  query('includeAll').optional(),
  (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }
    const status = req.query.status as PostStatus | undefined
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const search = req.query.search as string | undefined
    // 默认（前台访问）只返回 published；管理端调用时传 includeAll=1 才能看到 draft/archived。
    const includeAll = parseIncludeAll(req.query.includeAll)

    let statuses: PostStatus[] | undefined
    if (status) {
      statuses = [status]
    } else if (!includeAll) {
      statuses = PUBLIC_STATUSES
    }

    const result = postRepository.findAllPaginated({ statuses, page, limit, search })
    res.json(result)
  }
)

// Search posts —— 仅返回 published，避免搜索框把草稿/下线的文章透出。
router.get('/search',
  query('q').notEmpty().trim(),
  (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }
    const posts = postRepository.search(req.query.q as string, PUBLIC_STATUSES)
    res.json(posts)
  }
)

// Get post by slug
//   - 默认按 slug 直链访问，仅返回 published（修复「后台已下线但前台仍可访问」）
//   - 管理端编辑器走 includeAll=1，能拿到 draft/archived 进行编辑
router.get('/slug/:slug',
  param('slug').notEmpty().trim().escape(),
  query('includeAll').optional(),
  (req, res) => {
    const includeAll = parseIncludeAll(req.query.includeAll)
    const statuses = includeAll ? undefined : PUBLIC_STATUSES
    const post = postRepository.findBySlug(req.params.slug, statuses)
    if (!post) {
      return res.status(404).json({ error: 'Post not found' })
    }
    res.json(post)
  }
)

// Get posts by category —— 公网聚合，强制 published
router.get('/category/:slug',
  param('slug').notEmpty().trim().escape(),
  (req, res) => {
    const posts = postRepository.findByCategory(req.params.slug, PUBLIC_STATUSES)
    res.json(posts)
  }
)

// Get related posts —— 公网，仅 published
router.get('/:id/related',
  param('id').isInt(),
  query('limit').optional().isInt({ min: 1, max: 10 }),
  (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 3
    const posts = postRepository.findRelated(parseInt(req.params.id), limit, PUBLIC_STATUSES)
    res.json(posts)
  }
)

// Get post by ID
//   - 默认仅返回 published：知道 id 也不能从前台拿到草稿/下线，
//     避免「slug 路由被锁住，id 路由却变成绕过通道」的旁路。
//   - 管理端编辑器调用时显式带 includeAll=1，才能看到 draft/archived。
router.get('/:id',
  param('id').isInt(),
  query('includeAll').optional(),
  (req, res) => {
    const includeAll = parseIncludeAll(req.query.includeAll)
    const statuses = includeAll ? undefined : PUBLIC_STATUSES
    const post = postRepository.findById(parseInt(req.params.id), statuses)
    if (!post) {
      return res.status(404).json({ error: 'Post not found' })
    }
    res.json(post)
  }
)

// Create post
router.post('/',
  body('title').notEmpty().trim().isLength({ min: 1, max: 500 }),
  body('slug').notEmpty().trim().isLength({ min: 1, max: 200 })
    .matches(/^[a-z0-9\-]+$/).withMessage('Slug must contain only lowercase letters, numbers and hyphens'),
  body('excerpt').optional().trim().isLength({ max: 1000 }),
  body('content').optional().trim().isLength({ max: 100000 }),
  body('image').optional().trim(),
  body('category_id').optional().isInt(),
  body('author_id').optional().isInt(),
  body('status').optional().isIn(POST_STATUSES),
  body('read_time').optional().isInt({ min: 1, max: 999 }),
  body('tags').optional().isArray({ max: 20 }),
  body('tags.*').optional().isString().isLength({ max: 50 }),
  (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }
    try {
      const post = postRepository.create(req.body)
      res.status(201).json(post)
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes('UNIQUE constraint')) {
        return res.status(400).json({ error: 'Slug already exists' })
      }
      throw error
    }
  }
)

// Update post
router.put('/:id',
  param('id').isInt(),
  body('title').optional().trim().isLength({ min: 1, max: 500 }),
  body('slug').optional().trim().isLength({ min: 1, max: 200 })
    .matches(/^[a-z0-9\-]+$/).withMessage('Slug must contain only lowercase letters, numbers and hyphens'),
  body('excerpt').optional().trim().isLength({ max: 1000 }),
  body('content').optional().trim().isLength({ max: 100000 }),
  body('image').optional().trim(),
  body('category_id').optional().isInt(),
  body('author_id').optional().isInt(),
  body('status').optional().isIn(POST_STATUSES),
  body('read_time').optional().isInt({ min: 1, max: 999 }),
  body('tags').optional().isArray({ max: 20 }),
  body('tags.*').optional().isString().isLength({ max: 50 }),
  (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }
    try {
      const post = postRepository.update(parseInt(req.params.id), req.body)
      if (!post) {
        return res.status(404).json({ error: 'Post not found' })
      }
      res.json(post)
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes('UNIQUE constraint')) {
        return res.status(400).json({ error: 'Slug already exists' })
      }
      throw error
    }
  }
)

// 批量切换状态：management only，用于一次性把多篇文章切到同一个状态。
router.post('/bulk-status',
  body('ids').isArray({ min: 1 }).withMessage('ids 不能为空'),
  body('ids.*').isInt({ min: 1 }),
  body('status').isIn(POST_STATUSES),
  (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }
    const { ids, status } = req.body as { ids: number[]; status: PostStatus }
    const updated = postRepository.bulkUpdateStatus(ids, status)
    res.json({ updated, status, ids })
  }
)

// Delete post
router.delete('/:id',
  param('id').isInt(),
  (req, res) => {
    const deleted = postRepository.delete(parseInt(req.params.id))
    if (!deleted) {
      return res.status(404).json({ error: 'Post not found' })
    }
    res.status(204).send()
  }
)

// Increment views —— 仅对 published 生效
router.post('/:id/view',
  param('id').isInt(),
  (req, res) => {
    const ok = postRepository.incrementViews(parseInt(req.params.id), PUBLIC_STATUSES)
    if (!ok) {
      return res.status(404).json({ error: 'Post not found or not public' })
    }
    res.status(204).send()
  }
)

// Increment likes —— 仅对 published 生效
router.post('/:id/like',
  param('id').isInt(),
  (req, res) => {
    const ok = postRepository.incrementLikes(parseInt(req.params.id), PUBLIC_STATUSES)
    if (!ok) {
      return res.status(404).json({ error: 'Post not found or not public' })
    }
    res.status(204).send()
  }
)

export default router
