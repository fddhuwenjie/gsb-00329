import { Router } from 'express'
import { body, param, query, validationResult } from 'express-validator'
import { postRepository } from '../repositories/postRepository.js'
import type { PostStatus, BatchUpdateStatusInput } from '../types.js'

const router = Router()

const ALL_STATUSES: PostStatus[] = ['draft', 'published', 'archived']

function validateStatus(value?: string): PostStatus | undefined {
  if (!value) return undefined
  if (!ALL_STATUSES.includes(value as PostStatus)) {
    throw new Error(`Invalid status. Must be one of: ${ALL_STATUSES.join(', ')}`)
  }
  return value as PostStatus
}

router.get('/search',
  query('q').notEmpty().trim(),
  query('status').optional().custom((value) => {
    if (value) validateStatus(value as string)
    return true
  }),
  (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }
    const status = req.query.status ? validateStatus(req.query.status as string) : undefined
    const posts = postRepository.search(req.query.q as string, status || ALL_STATUSES)
    res.json(posts)
  }
)

router.get('/slug/:slug',
  param('slug').notEmpty().trim().escape(),
  (req, res) => {
    const post = postRepository.findBySlug(req.params.slug)
    if (!post) {
      return res.status(404).json({ error: 'Post not found' })
    }
    res.json(post)
  }
)

router.get('/category/:slug',
  param('slug').notEmpty().trim().escape(),
  query('status').optional().custom((value) => {
    if (value) validateStatus(value as string)
    return true
  }),
  (req, res) => {
    const status = req.query.status ? validateStatus(req.query.status as string) : ALL_STATUSES
    const posts = postRepository.findByCategory(req.params.slug, status)
    res.json(posts)
  }
)

router.post('/batch-status',
  body('ids').isArray({ min: 1 }).withMessage('Must provide at least one post ID'),
  body('ids.*').isInt(),
  body('status').isIn(['draft', 'published', 'archived']),
  (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }
    const { ids, status } = req.body as BatchUpdateStatusInput
    const result = postRepository.batchUpdateStatus(ids, status)
    res.json(result)
  }
)

router.get('/:id/related',
  param('id').isInt(),
  query('limit').optional().isInt({ min: 1, max: 10 }),
  (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 3
    const posts = postRepository.findRelated(parseInt(req.params.id), limit)
    res.json(posts)
  }
)

router.get('/', 
  query('status').optional().custom((value) => {
    if (value) {
      const statuses = Array.isArray(value) ? value : [value]
      for (const s of statuses) {
        validateStatus(s)
      }
    }
    return true
  }),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().trim(),
  (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }
    
    let statusFilter: PostStatus | PostStatus[] | undefined
    const statusParam = req.query.status
    if (statusParam) {
      const statuses = Array.isArray(statusParam) ? statusParam : [statusParam]
      statusFilter = statuses.map(s => validateStatus(s) as PostStatus)
      if (statusFilter.length === 1) {
        statusFilter = statusFilter[0]
      }
    }
    
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const search = req.query.search as string | undefined
    
    const result = postRepository.findAllPaginated({ status: statusFilter, page, limit, search })
    res.json(result)
  }
)

router.get('/:id',
  param('id').isInt(),
  (req, res) => {
    const post = postRepository.findById(parseInt(req.params.id))
    if (!post) {
      return res.status(404).json({ error: 'Post not found' })
    }
    res.json(post)
  }
)

router.post('/',
  body('title').notEmpty().trim().isLength({ min: 1, max: 500 }),
  body('slug').notEmpty().trim().isLength({ min: 1, max: 200 })
    .matches(/^[a-z0-9\-]+$/).withMessage('Slug must contain only lowercase letters, numbers and hyphens'),
  body('excerpt').optional().trim().isLength({ max: 1000 }),
  body('content').optional().trim().isLength({ max: 100000 }),
  body('image').optional().trim(),
  body('category_id').optional().isInt(),
  body('author_id').optional().isInt(),
  body('status').optional().isIn(['draft', 'published', 'archived']),
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
  body('status').optional().isIn(['draft', 'published', 'archived']),
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

export default router
