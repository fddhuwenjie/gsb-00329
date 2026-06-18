import { Router } from 'express'
import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { join, dirname, extname } from 'path'
import { fileURLToPath } from 'url'
import { randomUUID } from 'crypto'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const router = Router()

// Upload directory
const uploadDir = join(__dirname, '..', '..', 'data', 'uploads')
if (!existsSync(uploadDir)) {
  mkdirSync(uploadDir, { recursive: true })
}

// Allowed image types
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

// Upload image (base64)
router.post('/image', (req, res) => {
  try {
    const { data, filename, type } = req.body

    if (!data || !type) {
      return res.status(400).json({ error: 'Missing data or type' })
    }

    if (!ALLOWED_TYPES.includes(type)) {
      return res.status(400).json({ error: 'Invalid file type. Allowed: jpeg, png, gif, webp' })
    }

    // Decode base64
    const base64Data = data.replace(/^data:image\/\w+;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')

    if (buffer.length > MAX_SIZE) {
      return res.status(400).json({ error: 'File too large. Max size: 5MB' })
    }

    // Generate unique filename
    const ext = extname(filename || '.jpg') || '.jpg'
    const newFilename = `${randomUUID()}${ext}`
    const filepath = join(uploadDir, newFilename)

    // Save file
    writeFileSync(filepath, buffer)

    // Return URL
    const url = `/uploads/${newFilename}`
    res.json({ url, filename: newFilename })
  } catch (error) {
    console.error('Upload error:', error)
    res.status(500).json({ error: 'Upload failed' })
  }
})

export default router
