import { Router } from 'express'
import { body, param, query, validationResult } from 'express-validator'
import { postRepository } from '../repositories/postRepository.js'
import type { PostStatus } from '../types.js'

const router = Router()
const ALL_STATUSES: PostStatus[] = ['draft', 'published', 'archived']

// ========== PUBLIC ROUTES (published only) ==========

// Get published posts with pagination (public homepage/list)
router.get('/public',
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().trim(),
  (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const search = req.query.search as string | undefined
    
    const result = postRepository.findAllPublic({ page, limit, search })
    res.json(result)
  }
)

// Search published posts (public search)
router.get('/public/search',
  query('q').notEmpty().trim(),
  (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }
    const posts = postRepository.searchPublished(req.query.q as string)
    res.json(posts)
  }
)

// Get published post by slug (public detail page)
router.get('/public/slug/:slug',
  param('slug').notEmpty().trim().escape(),
  (req, res) => {
    const post = postRepository.findPublishedBySlug(req.params.slug)
    if (!post) {
      return res.status(404).json({ error: 'Post not found' })
    }
    res.json(post)
  }
)

// Get published posts by category (public category page)
router.get('/public/category/:slug',
  param('slug').notEmpty().trim().escape(),
  (req, res) => {
    const posts = postRepository.findPublishedByCategory(req.params.slug)
    res.json(posts)
  }
)

// Get related published posts (public detail page sidebar)
router.get('/public/:id/related',
  param('id').isInt(),
  query('limit').optional().isInt({ min: 1, max: 10 }),
  (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 3
    const posts = postRepository.findRelatedPublished(parseInt(req.params.id), limit)
    res.json(posts)
  }
)

// Increment views (only for published posts)
router.post('/public/:id/view',
  param('id').isInt(),
  (req, res) => {
    const success = postRepository.incrementViews(parseInt(req.params.id))
    if (!success) {
      return res.status(404).json({ error: 'Post not found' })
    }
    res.status(204).send()
  }
)

// Increment likes (only for published posts)
router.post('/public/:id/like',
  param('id').isInt(),
  (req, res) => {
    const success = postRepository.incrementLikes(parseInt(req.params.id))
    if (!success) {
      return res.status(404).json({ error: 'Post not found' })
    }
    res.status(204).send()
  }
)

// ========== ADMIN ROUTES (all statuses accessible) ==========

// Get all posts with pagination, status filter, and search (admin)
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

// Search posts (admin - can search all statuses)
router.get('/search',
  query('q').notEmpty().trim(),
  query('status').optional().isIn(ALL_STATUSES),
  (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }
    const status = req.query.status as PostStatus | undefined
    // Admin search uses the same search but with status filter
    const result = postRepository.findAllPaginated({ 
      status, 
      search: req.query.q as string,
      limit: 100
    })
    res.json(result.data)
  }
)

// Get post by slug (admin)
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

// Get posts by category (admin)
router.get('/category/:slug',
  param('slug').notEmpty().trim().escape(),
  query('status').optional().isIn(ALL_STATUSES),
  (req, res) => {
    // Admin can see all posts by category regardless of status
    const status = req.query.status as PostStatus | undefined
    const result = postRepository.findAllPaginated({ 
      categorySlug: req.params.slug, 
      status,
      limit: 100
    })
    res.json(result.data)
  }
)

// Get related posts (admin)
router.get('/:id/related',
  param('id').isInt(),
  query('limit').optional().isInt({ min: 1, max: 10 }),
  (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 3
    // For admin, we still show published related posts (consistent behavior)
    const posts = postRepository.findRelatedPublished(parseInt(req.params.id), limit)
    res.json(posts)
  }
)

// Get post by ID (admin)
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

// Create post (admin)
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

// Update post (admin)
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

// Bulk update status (admin)
router.put('/bulk/status',
  body('ids').isArray({ min: 1 }),
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

// Delete post (admin)
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
