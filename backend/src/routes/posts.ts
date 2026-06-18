import { Router } from 'express'
import { body, param, query, validationResult } from 'express-validator'
import { postRepository } from '../repositories/postRepository.js'

const router = Router()

// Get all posts with pagination and search
router.get('/', 
  query('status').optional().isIn(['draft', 'published']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().trim(),
  (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }
    const status = req.query.status as 'draft' | 'published' | undefined
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const search = req.query.search as string | undefined
    
    const result = postRepository.findAllPaginated({ status, page, limit, search })
    res.json(result)
  }
)

// Search posts
router.get('/search',
  query('q').notEmpty().trim(),
  (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }
    const posts = postRepository.search(req.query.q as string)
    res.json(posts)
  }
)

// Get post by slug
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

// Get posts by category
router.get('/category/:slug',
  param('slug').notEmpty().trim().escape(),
  (req, res) => {
    const posts = postRepository.findByCategory(req.params.slug)
    res.json(posts)
  }
)

// Get related posts
router.get('/:id/related',
  param('id').isInt(),
  query('limit').optional().isInt({ min: 1, max: 10 }),
  (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 3
    const posts = postRepository.findRelated(parseInt(req.params.id), limit)
    res.json(posts)
  }
)

// Get post by ID
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
  body('status').optional().isIn(['draft', 'published']),
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
  body('status').optional().isIn(['draft', 'published']),
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

// Increment views
router.post('/:id/view',
  param('id').isInt(),
  (req, res) => {
    postRepository.incrementViews(parseInt(req.params.id))
    res.status(204).send()
  }
)

// Increment likes
router.post('/:id/like',
  param('id').isInt(),
  (req, res) => {
    postRepository.incrementLikes(parseInt(req.params.id))
    res.status(204).send()
  }
)

export default router
