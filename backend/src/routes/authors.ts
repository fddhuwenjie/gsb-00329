import { Router } from 'express'
import { body, param, validationResult } from 'express-validator'
import { authorRepository } from '../repositories/authorRepository.js'

const router = Router()

// Get all authors
router.get('/', (req, res) => {
  const authors = authorRepository.findAll()
  res.json(authors)
})

// Get author by ID
router.get('/:id',
  param('id').isInt(),
  (req, res) => {
    const author = authorRepository.findById(parseInt(req.params.id))
    if (!author) {
      return res.status(404).json({ error: 'Author not found' })
    }
    res.json(author)
  }
)

// Create author
router.post('/',
  body('name').notEmpty().trim(),
  body('avatar').optional().trim(),
  body('bio').optional().trim(),
  (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }
    const author = authorRepository.create(req.body)
    res.status(201).json(author)
  }
)

// Update author
router.put('/:id',
  param('id').isInt(),
  body('name').optional().trim(),
  body('avatar').optional().trim(),
  body('bio').optional().trim(),
  (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }
    const author = authorRepository.update(parseInt(req.params.id), req.body)
    if (!author) {
      return res.status(404).json({ error: 'Author not found' })
    }
    res.json(author)
  }
)

// Delete author
router.delete('/:id',
  param('id').isInt(),
  (req, res) => {
    const deleted = authorRepository.delete(parseInt(req.params.id))
    if (!deleted) {
      return res.status(404).json({ error: 'Author not found' })
    }
    res.status(204).send()
  }
)

export default router
