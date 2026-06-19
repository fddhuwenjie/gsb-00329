import { Router } from 'express'
import { param, query, validationResult } from 'express-validator'
import { postRepository } from '../repositories/postRepository.js'

const router = Router()

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

router.get('/category/:slug',
  param('slug').notEmpty().trim().escape(),
  (req, res) => {
    const posts = postRepository.findByCategory(req.params.slug, 'published')
    res.json(posts)
  }
)

router.get('/:id/related',
  param('id').isInt(),
  query('limit').optional().isInt({ min: 1, max: 10 }),
  (req, res) => {
    const id = parseInt(req.params.id)
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 3
    const requestingPost = postRepository.findPublicById(id)
    if (!requestingPost) {
      return res.status(404).json({ error: 'Post not found' })
    }
    const posts = postRepository.findRelated(id, limit, 'published')
    res.json(posts)
  }
)

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

router.get('/', 
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
    
    const result = postRepository.findAllPaginated({ status: 'published', page, limit, search })
    res.json(result)
  }
)

export default router
