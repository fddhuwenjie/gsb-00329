import { Router } from 'express'
import { body, param, query, validationResult } from 'express-validator'
import { postRepository } from '../repositories/postRepository.js'
import type { PostStatus } from '../types.js'

const router = Router()

const ALL_STATUSES: PostStatus[] = ['draft', 'published', 'offline']

// IMPORTANT: Route order matters! More specific paths must come before parameterized paths.

// Get stats by status (no id param)
router.get('/stats/by-status',
  (_req, res) => {
    const counts = postRepository.countByStatus()
    res.json({
      total: counts.draft + counts.published + counts.offline,
      ...counts
    })
  }
)

// Search posts (public endpoint - always returns only published)
router.get('/search',
  query('q').notEmpty().trim(),
  (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }
    const posts = postRepository.search(req.query.q as string, 'published')
    res.json(posts)
  }
)

// Admin: Get post by slug with any status (for preview purposes)
router.get('/admin/slug/:slug',
  param('slug').notEmpty().trim().escape(),
  (req, res) => {
    const post = postRepository.findBySlug(req.params.slug)
    if (!post) {
      return res.status(404).json({ error: 'Post not found' })
    }
    res.json(post)
  }
)

// Get post by slug (public endpoint - always returns only published)
router.get('/slug/:slug',
  param('slug').notEmpty().trim().escape(),
  (req, res) => {
    const post = postRepository.findPublicBySlug(req.params.slug)
    if (!post) {
      return res.status(404).json({ error: 'Post not found' })
    }
    res.json(post)
  }
)

// Get posts by category (public endpoint - always returns only published)
router.get('/category/:slug',
  param('slug').notEmpty().trim().escape(),
  (req, res) => {
    const posts = postRepository.findByCategory(req.params.slug, 'published')
    res.json(posts)
  }
)

// Bulk update status (no id param)
router.patch('/bulk-status',
  body('ids').isArray({ min: 1 }).withMessage('ids must be a non-empty array'),
  body('ids.*').isInt(),
  body('status').isIn(ALL_STATUSES),
  (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }
    const { ids, status } = req.body
    const count = postRepository.bulkUpdateStatus(ids, status)
    res.json({ updated: count })
  }
)

// Get all posts with pagination and search (admin-capable)
router.get('/', 
  query('status').optional().isIn(ALL_STATUSES),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().trim(),
  (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }
    const status = req.query.status as PostStatus | undefined
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const search = req.query.search as string | undefined
    
    const result = postRepository.findAllPaginated({ status, page, limit, search })
    res.json(result)
  }
)

// Get related posts (public endpoint - always returns only published)
router.get('/:id/related',
  param('id').isInt(),
  query('limit').optional().isInt({ min: 1, max: 10 }),
  (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 3
    const postId = parseInt(req.params.id)
    const post = postRepository.findPublicById(postId)
    if (!post) {
      return res.status(404).json({ error: 'Post not found' })
    }
    const posts = postRepository.findRelated(postId, limit, 'published')
    res.json(posts)
  }
)

// Single update status
router.patch('/:id/status',
  param('id').isInt(),
  body('status').isIn(ALL_STATUSES),
  (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }
    const post = postRepository.updateStatus(parseInt(req.params.id), req.body.status as PostStatus)
    if (!post) {
      return res.status(404).json({ error: 'Post not found' })
    }
    res.json(post)
  }
)

// Increment views - only works for published posts (enforced in repository)
router.post('/:id/view',
  param('id').isInt(),
  (req, res) => {
    const success = postRepository.incrementViews(parseInt(req.params.id))
    if (!success) {
      return res.status(404).json({ error: 'Post not found or not published' })
    }
    res.status(204).send()
  }
)

// Increment likes - only works for published posts (enforced in repository)
router.post('/:id/like',
  param('id').isInt(),
  (req, res) => {
    const success = postRepository.incrementLikes(parseInt(req.params.id))
    if (!success) {
      return res.status(404).json({ error: 'Post not found or not published' })
    }
    res.status(204).send()
  }
)

// Get post by ID (admin-capable)
router.get('/:id',
  param('id').isInt(),
  query('status').optional().isIn(ALL_STATUSES),
  (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }
    const id = parseInt(req.params.id)
    const requestStatus = req.query.status as PostStatus | undefined
    
    let post
    if (requestStatus) {
      post = postRepository.findById(id, requestStatus)
    } else {
      post = postRepository.findById(id)
    }
    
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
  body('status').optional().isIn(ALL_STATUSES),
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
  body('status').optional().isIn(ALL_STATUSES),
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

export default router
