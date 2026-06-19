import { describe, it, expect, beforeEach, vi } from 'vitest'
import { initTestDatabase, setupTestData } from './setup'
import type { Database as DatabaseType } from 'better-sqlite3'

vi.mock('../src/db.js', async () => {
  const actual = await vi.importActual('../src/db.js')
  return {
    ...actual,
    db: null,
    initDatabase: vi.fn()
  }
})

import { db as mockedDb } from '../src/db.js'

describe('postRepository - 状态一致性测试', () => {
  let db: DatabaseType
  let postRepository: any

  beforeEach(async () => {
    db = initTestDatabase()
    setupTestData(db)
    
    vi.resetModules()
    vi.doMock('../src/db.js', () => ({
      db,
      initDatabase: vi.fn()
    }))
    
    const repoModule = await import('../src/repositories/postRepository.js')
    postRepository = repoModule.postRepository
  })

  describe('公开接口安全性测试', () => {
    it('findAllPublic 应该只返回 published 状态的文章', () => {
      const result = postRepository.findAllPublic()
      expect(result.data.length).toBe(3)
      expect(result.data.every((p: any) => p.status === 'published')).toBe(true)
      expect(result.total).toBe(3)
    })

    it('findPublishedBySlug 应该只返回 published 文章，拒绝 draft 和 archived', () => {
      const publishedPost = postRepository.findPublishedBySlug('published-post')
      expect(publishedPost).toBeDefined()
      expect(publishedPost.status).toBe('published')

      const draftPost = postRepository.findPublishedBySlug('draft-post')
      expect(draftPost).toBeUndefined()

      const archivedPost = postRepository.findPublishedBySlug('archived-post')
      expect(archivedPost).toBeUndefined()
    })

    it('findPublishedById 应该只返回 published 文章', () => {
      const publishedPost = postRepository.findPublishedById(1)
      expect(publishedPost).toBeDefined()
      expect(publishedPost.status).toBe('published')

      const draftPost = postRepository.findPublishedById(2)
      expect(draftPost).toBeUndefined()

      const archivedPost = postRepository.findPublishedById(3)
      expect(archivedPost).toBeUndefined()
    })

    it('findPublishedByCategory 应该只返回该分类下的 published 文章', () => {
      const techPosts = postRepository.findPublishedByCategory('tech')
      expect(techPosts.length).toBe(2)
      expect(techPosts.every((p: any) => p.status === 'published')).toBe(true)
      expect(techPosts.every((p: any) => p.category_slug === 'tech')).toBe(true)
    })

    it('searchPublished 应该只搜索 published 文章，即使草稿/下线文章包含关键词也不返回', () => {
      const results = postRepository.searchPublished('搜索词')
      expect(results.length).toBe(1)
      expect(results[0].slug).toBe('special-keyword')
      expect(results[0].status).toBe('published')

      const results2 = postRepository.searchPublished('关键词')
      expect(results2.length).toBe(1)
      expect(results2[0].slug).toBe('special-keyword')

      const allPublished = postRepository.searchPublished('')
      expect(allPublished.length).toBe(3)
      expect(allPublished.every((p: any) => p.status === 'published')).toBe(true)
    })

    it('findRelatedPublished 应该只返回同分类的 published 文章', () => {
      const related = postRepository.findRelatedPublished(1, 5)
      expect(related.length).toBe(1)
      expect(related[0].id).toBe(5)
      expect(related[0].status).toBe('published')

      const relatedForDraft = postRepository.findRelatedPublished(2)
      expect(relatedForDraft.length).toBe(0)
    })

    it('getLatestPublished 应该只返回最新的 published 文章', () => {
      const latest = postRepository.getLatestPublished(2)
      expect(latest.length).toBe(2)
      expect(latest.every((p: any) => p.status === 'published')).toBe(true)
    })
  })

  describe('浏览/点赞计数安全测试', () => {
    it('incrementViews 只应该对 published 文章生效', () => {
      expect(postRepository.incrementViews(1)).toBe(true)
      const updatedPost = postRepository.findById(1)
      expect(updatedPost.views).toBe(101)

      expect(postRepository.incrementViews(2)).toBe(false)
      const draftPost = postRepository.findById(2)
      expect(draftPost.views).toBe(0)

      expect(postRepository.incrementViews(3)).toBe(false)
      const archivedPost = postRepository.findById(3)
      expect(archivedPost.views).toBe(50)
    })

    it('incrementLikes 只应该对 published 文章生效', () => {
      expect(postRepository.incrementLikes(1)).toBe(true)
      const updatedPost = postRepository.findById(1)
      expect(updatedPost.likes).toBe(51)

      expect(postRepository.incrementLikes(2)).toBe(false)
      const draftPost = postRepository.findById(2)
      expect(draftPost.likes).toBe(0)

      expect(postRepository.incrementLikes(3)).toBe(false)
      const archivedPost = postRepository.findById(3)
      expect(archivedPost.likes).toBe(20)
    })
  })

  describe('管理接口测试', () => {
    it('findBySlug (admin) 可以返回任意状态的文章', () => {
      const published = postRepository.findBySlug('published-post')
      expect(published).toBeDefined()
      
      const draft = postRepository.findBySlug('draft-post')
      expect(draft).toBeDefined()
      
      const archived = postRepository.findBySlug('archived-post')
      expect(archived).toBeDefined()
    })

    it('findById (admin) 可以返回任意状态的文章', () => {
      expect(postRepository.findById(1)).toBeDefined()
      expect(postRepository.findById(2)).toBeDefined()
      expect(postRepository.findById(3)).toBeDefined()
    })

    it('findAllPaginated 支持按多种状态筛选', () => {
      const all = postRepository.findAllPaginated({})
      expect(all.total).toBe(6)

      const publishedOnly = postRepository.findAllPaginated({ status: 'published' })
      expect(publishedOnly.total).toBe(3)

      const draftOnly = postRepository.findAllPaginated({ status: 'draft' })
      expect(draftOnly.total).toBe(2)

      const archivedOnly = postRepository.findAllPaginated({ status: 'archived' })
      expect(archivedOnly.total).toBe(1)
    })
  })

  describe('状态切换测试', () => {
    it('update 可以将文章在三种状态间切换', () => {
      let post = postRepository.update(1, { status: 'archived' })
      expect(post.status).toBe('archived')
      expect(postRepository.findPublishedById(1)).toBeUndefined()

      post = postRepository.update(1, { status: 'draft' })
      expect(post.status).toBe('draft')
      expect(postRepository.findPublishedById(1)).toBeUndefined()

      post = postRepository.update(1, { status: 'published' })
      expect(post.status).toBe('published')
      expect(postRepository.findPublishedById(1)).toBeDefined()
    })

    it('bulkUpdateStatus 可以批量修改多篇文章的状态', () => {
      const changed = postRepository.bulkUpdateStatus([1, 4], 'archived')
      expect(changed).toBe(2)
      
      expect(postRepository.findPublishedById(1)).toBeUndefined()
      expect(postRepository.findPublishedById(4)).toBeUndefined()
      
      const publicPosts = postRepository.findAllPublic()
      expect(publicPosts.total).toBe(1)
    })
  })

  describe('统计数据测试', () => {
    it('getStats 应该正确统计三种状态，且只统计 published 的 views/likes', () => {
      const stats = postRepository.getStats()
      expect(stats.total_posts).toBe(6)
      expect(stats.published_posts).toBe(3)
      expect(stats.draft_posts).toBe(2)
      expect(stats.archived_posts).toBe(1)
      expect(stats.total_views).toBe(100 + 200 + 30)
      expect(stats.total_likes).toBe(50 + 80 + 10)
    })
  })

  describe('文章创建测试', () => {
    it('create 默认状态是 draft', () => {
      const newPost = postRepository.create({
        title: '新文章',
        slug: 'new-post',
        content: '内容'
      })
      expect(newPost.status).toBe('draft')
      expect(postRepository.findPublishedById(newPost.id)).toBeUndefined()
    })

    it('create 可以指定 published 状态', () => {
      const newPost = postRepository.create({
        title: '新发文章',
        slug: 'new-published',
        content: '内容',
        status: 'published'
      })
      expect(newPost.status).toBe('published')
      expect(postRepository.findPublishedById(newPost.id)).toBeDefined()
    })
  })
})
