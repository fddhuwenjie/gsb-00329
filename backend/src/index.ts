import express from 'express'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import { initDatabase } from './db.js'
import postsRouter from './routes/posts.js'
import categoriesRouter from './routes/categories.js'
import authorsRouter from './routes/authors.js'
import uploadRouter from './routes/upload.js'
import rssRouter from './routes/rss.js'
import { postRepository } from './repositories/postRepository.js'
import { existsSync, mkdirSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Ensure data directory exists
const dataDir = join(__dirname, '..', 'data')
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true })
}

// Initialize database
initDatabase()

const app = express()
const PORT = process.env.PORT || 3001

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
})

const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit uploads to 10 per minute
  message: { error: 'Too many uploads, please try again later' }
})

// Middleware
app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use('/api', limiter)

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`)
  next()
})

// Static files for uploads
app.use('/uploads', express.static(join(__dirname, '..', 'data', 'uploads')))

// Routes
app.use('/api/posts', postsRouter)
app.use('/api/categories', categoriesRouter)
app.use('/api/authors', authorsRouter)
app.use('/api/upload', uploadLimiter, uploadRouter)
app.use('/rss', rssRouter)

// Stats endpoint
app.get('/api/stats', (req, res) => {
  const stats = postRepository.getStats()
  res.json(stats)
})

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`)
})
