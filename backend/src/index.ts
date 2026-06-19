import express from 'express'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import { initDatabase, db } from './db.js'
import postsRouter from './routes/posts.js'
import categoriesRouter from './routes/categories.js'
import authorsRouter from './routes/authors.js'
import uploadRouter from './routes/upload.js'
import rssRouter from './routes/rss.js'
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

export function createApp() {
  const app = express()

  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false
  }))

  // 测试环境关掉限流，避免 supertest 串行打多次请求时被 429。
  if (process.env.NODE_ENV !== 'test') {
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      message: { error: 'Too many requests, please try again later' },
      standardHeaders: true,
      legacyHeaders: false
    })
    app.use('/api', limiter)
  }

  const uploadLimiter = process.env.NODE_ENV === 'test'
    ? (_: express.Request, __: express.Response, next: express.NextFunction) => next()
    : rateLimit({
        windowMs: 60 * 1000,
        max: 10,
        message: { error: 'Too many uploads, please try again later' }
      })

  app.use(cors())
  app.use(express.json({ limit: '10mb' }))

  if (process.env.NODE_ENV !== 'test') {
    app.use((req, _res, next) => {
      console.log(`${new Date().toISOString()} ${req.method} ${req.url}`)
      next()
    })
  }

  app.use('/uploads', express.static(join(__dirname, '..', 'data', 'uploads')))

  app.use('/api/posts', postsRouter)
  app.use('/api/categories', categoriesRouter)
  app.use('/api/authors', authorsRouter)
  app.use('/api/upload', uploadLimiter, uploadRouter)
  app.use('/rss', rssRouter)

  app.get('/api/stats', (_req, res) => {
    const stats = db.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM posts) as total_posts,
        (SELECT COUNT(*) FROM posts WHERE status = 'published') as published_posts,
        (SELECT COUNT(*) FROM posts WHERE status = 'draft') as draft_posts,
        (SELECT COUNT(*) FROM posts WHERE status = 'archived') as archived_posts,
        (SELECT COALESCE(SUM(views), 0) FROM posts) as total_views,
        (SELECT COALESCE(SUM(likes), 0) FROM posts) as total_likes,
        (SELECT COUNT(*) FROM categories) as total_categories,
        (SELECT COUNT(*) FROM authors) as total_authors
    `).get()
    res.json(stats)
  })

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
  })

  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err.stack)
    res.status(500).json({ error: 'Internal server error' })
  })

  return app
}

if (process.env.NODE_ENV !== 'test') {
  const app = createApp()
  const PORT = process.env.PORT || 3001
  app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`)
  })
}
