import { Router } from 'express'
import { body, param, validationResult } from 'express-validator'
import { categoryRepository } from '../repositories/categoryRepository.js'

const router = Router()

// Get all categories
router.get('/', (req, res) => {
  const categories = categoryRepository.findAll()
  res.json(categories)
})

// Get category by slug
router.get('/slug/:slug',
  param('slug').notEmpty().trim(),
  (req, res) => {
    const category = categoryRepository.findBySlug(req.params.slug)
    if (!category) {
      return res.status(404).json({ error: 'Category not found' })
    }
    res.json(category)
  }
)

// Get category by ID
router.get('/:id',
  param('id').isInt(),
  (req, res) => {
    const category = categoryRepository.findById(parseInt(req.params.id))
    if (!category) {
      return res.status(404).json({ error: 'Category not found' })
    }
    res.json(category)
  }
)

// Create category
router.post('/',
  body('name').notEmpty().trim(),
  body('slug').notEmpty().trim(),
  body('icon').optional().trim(),
  body('color').optional().trim(),
  body('description').optional().trim(),
  (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }
    try {
      const category = categoryRepository.create(req.body)
      res.status(201).json(category)
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes('UNIQUE constraint')) {
        return res.status(400).json({ error: 'Slug already exists' })
      }
      throw error
    }
  }
)

// Update category
router.put('/:id',
  param('id').isInt(),
  body('name').optional().trim(),
  body('slug').optional().trim(),
  body('icon').optional().trim(),
  body('color').optional().trim(),
  body('description').optional().trim(),
  (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }
    const category = categoryRepository.update(parseInt(req.params.id), req.body)
    if (!category) {
      return res.status(404).json({ error: 'Category not found' })
    }
    res.json(category)
  }
)

// Delete category
router.delete('/:id',
  param('id').isInt(),
  (req, res) => {
    const deleted = categoryRepository.delete(parseInt(req.params.id))
    if (!deleted) {
      return res.status(404).json({ error: 'Category not found' })
    }
    res.status(204).send()
  }
)

export default router
