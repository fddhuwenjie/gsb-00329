/**
 * 文章状态一致性自动化回归测试
 * 
 * 覆盖场景：
 * 1. 公开接口永远只返回 published 文章
 * 2. slug/ID 访问草稿/下线文章返回 null
 * 3. 搜索只返回 published
 * 4. 分类聚合只返回 published
 * 5. 相关文章只返回 published
 * 6. 浏览/点赞计数对非published不生效
 * 7. 单篇状态切换后立即可见性变化
 * 8. 批量状态切换后立即可见性变化
 * 9. 管理后台能看到所有状态
 */

import Database from 'better-sqlite3'
import { PostRepository } from '../repositories/postRepository.js'
import type { PostStatus } from '../types.js'

let db: Database.Database
let postRepo: PostRepository
let testCategoryId: number
let testPostIds: { draft: number; published: number; archived: number }

const log = {
  pass: (msg: string) => console.log(`  ✅ ${msg}`),
  fail: (msg: string) => console.log(`  ❌ ${msg}`),
  info: (msg: string) => console.log(`  ℹ️  ${msg}`),
  section: (msg: string) => console.log(`\n📋 ${msg}`),
}

function assert(condition: any, message: string) {
  if (condition) {
    log.pass(message)
  } else {
    log.fail(message)
    throw new Error(`Test failed: ${message}`)
  }
}

async function setup() {
  log.section('初始化测试环境')
  
  db = new Database(':memory:')
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE,
      icon TEXT DEFAULT '📁',
      color TEXT DEFAULT '',
      description TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      excerpt TEXT DEFAULT '',
      content TEXT DEFAULT '',
      image TEXT DEFAULT '',
      category_id INTEGER,
      author_id INTEGER DEFAULT 1,
      read_time INTEGER DEFAULT 5,
      views INTEGER DEFAULT 0,
      likes INTEGER DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'published', 'archived')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      published_at DATETIME,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
    )
  `)
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS post_tags (
      post_id INTEGER NOT NULL,
      tag TEXT NOT NULL,
      PRIMARY KEY (post_id, tag),
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
    )
  `)
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS authors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      avatar TEXT DEFAULT '',
      bio TEXT DEFAULT ''
    )
  `)
  
  db.prepare('INSERT INTO authors (id, name, avatar, bio) VALUES (?, ?, ?, ?)').run(1, 'Test Author', '', 'Test Bio')
  db.prepare('INSERT INTO categories (id, name, slug, icon, color, description) VALUES (?, ?, ?, ?, ?, ?)').run(1, 'Test Category', 'test-category', '📁', '', 'Test')
  testCategoryId = 1
  
  postRepo = new PostRepository(db)
  log.pass('测试数据库初始化完成')
  
  log.section('创建测试文章：草稿、已发布、已下线')
  
  const draft = postRepo.create({
    title: 'Draft Post',
    slug: 'draft-post',
    excerpt: 'This is a draft',
    content: 'Draft content',
    category_id: testCategoryId,
    author_id: 1,
    status: 'draft',
    read_time: 5,
  })
  
  const published = postRepo.create({
    title: 'Published Post',
    slug: 'published-post',
    excerpt: 'This is published',
    content: 'Published content',
    category_id: testCategoryId,
    author_id: 1,
    status: 'published',
    read_time: 5,
  })
  
  const archived = postRepo.create({
    title: 'Archived Post',
    slug: 'archived-post',
    excerpt: 'This is archived',
    content: 'Archived content',
    category_id: testCategoryId,
    author_id: 1,
    status: 'archived',
    read_time: 5,
  })
  
  testPostIds = { draft: draft.id, published: published.id, archived: archived.id }
  log.pass(`创建完成: draft=${draft.id}, published=${published.id}, archived=${archived.id}`)
}

async function testPublicListOnlyShowsPublished() {
  log.section('1. 公开列表只返回已发布文章')
  
  const result = postRepo.findAllPaginated({ status: 'published' })
  assert(result.total === 1, `公开列表应该只有1篇，实际是${result.total}`)
  assert(result.data[0].id === testPostIds.published, `返回的应该是已发布文章，实际id=${result.data[0]?.id}`)
  assert(result.data.every(p => p.status === 'published'), `所有返回文章必须是published状态`)
  
  const pub = postRepo.findPublicBySlug('published-post')
  assert(pub, '通过slug应该能找到published文章')
  
  const draftBySlug = postRepo.findPublicBySlug('draft-post')
  assert(!draftBySlug, '公开slug访问草稿应该返回空')
  
  const archivedBySlug = postRepo.findPublicBySlug('archived-post')
  assert(!archivedBySlug, '公开slug访问下线文章应该返回空')
}

async function testSearchOnlyPublished() {
  log.section('2. 搜索只返回已发布文章')
  
  const result = postRepo.search('post')
  assert(result.every(p => p.status === 'published'), `搜索结果全部必须是published`)
  assert(result.length === 1, `搜索"post"应该只找到1篇已发布，实际${result.length}`)
  
  const draftResult = postRepo.search('draft')
  assert(draftResult.length === 0, `搜索"draft"内容应该找不到草稿文章`)
}

async function testCategoryOnlyPublished() {
  log.section('3. 分类聚合页只返回已发布文章')
  
  const result = postRepo.findByCategoryId(testCategoryId)
  assert(result.every(p => p.status === 'published'), `分类页文章全部必须是published`)
  assert(result.length === 1, `分类页应该只有1篇已发布，实际${result.length}`)
}

async function testRelatedOnlyPublished() {
  log.section('4. 相关文章推荐只返回已发布')
  
  const related = postRepo.findRelated(testPostIds.published, testCategoryId)
  assert(related.every(p => p.status === 'published'), `相关文章全部必须是published`)
  assert(!related.some(p => p.id === testPostIds.draft), `相关文章不应该包含草稿`)
  assert(!related.some(p => p.id === testPostIds.archived), `相关文章不应该包含下线文章`)
}

async function testViewLikeOnlyForPublished() {
  log.section('5. 浏览/点赞计数只对已发布生效')
  
  const initialViews = postRepo.findPublicById(testPostIds.published)?.views || 0
  postRepo.incrementViews(testPostIds.published)
  postRepo.incrementViews(testPostIds.draft)
  postRepo.incrementViews(testPostIds.archived)
  
  const afterViews = postRepo.findPublicById(testPostIds.published)?.views || 0
  assert(afterViews === initialViews + 1, `已发布文章浏览量+1`)
  
  const draftAfter = postRepo.findById(testPostIds.draft)
  assert(draftAfter?.views === 0, `草稿文章浏览量不应该增加`)
  
  const archivedAfter = postRepo.findById(testPostIds.archived)
  assert(archivedAfter?.views === 0, `下线文章浏览量不应该增加`)
  
  postRepo.incrementLikes(testPostIds.published)
  postRepo.incrementLikes(testPostIds.draft)
  postRepo.incrementLikes(testPostIds.archived)
  
  const publishedLikes = postRepo.findPublicById(testPostIds.published)?.likes || 0
  assert(publishedLikes === 1, `已发布文章点赞+1`)
  
  const draftLikes = postRepo.findById(testPostIds.draft)?.likes || 0
  assert(draftLikes === 0, `草稿文章点赞不增加`)
  
  const archivedLikes = postRepo.findById(testPostIds.archived)?.likes || 0
  assert(archivedLikes === 0, `下线文章点赞不增加`)
}

async function testStatusTransitionImmediateEffect() {
  log.section('6. 单篇状态切换后立即生效')
  
  const pubPost = postRepo.findPublicBySlug('published-post')
  assert(pubPost, '初始状态：已发布文章可见')
  
  postRepo.update(testPostIds.published, { status: 'archived' as PostStatus })
  
  const afterArchive = postRepo.findPublicBySlug('published-post')
  assert(!afterArchive, '下线后：原来已发布的文章立即不可见')
  
  const adminCanStillSee = postRepo.findById(testPostIds.published)
  assert(adminCanStillSee, '管理后台仍然可以看到下线文章')
  assert(adminCanStillSee?.status === 'archived', '管理后台看到状态是archived')
  
  postRepo.update(testPostIds.published, { status: 'published' as PostStatus })
  const republished = postRepo.findPublicBySlug('published-post')
  assert(republished, '重新发布后文章再次可见')
  assert(republished?.status === 'published', '状态确实变回published')
  
  postRepo.update(testPostIds.draft, { status: 'published' as PostStatus })
  const draftPublished = postRepo.findPublicBySlug('draft-post')
  assert(draftPublished, '草稿发布后立即可见')
}

async function testBatchStatusTransition() {
  log.section('7. 批量状态切换后立即生效')
  
  postRepo.update(testPostIds.draft, { status: 'draft' as PostStatus })
  postRepo.update(testPostIds.published, { status: 'published' as PostStatus })
  postRepo.update(testPostIds.archived, { status: 'archived' as PostStatus })
  
  const anotherDraft = postRepo.create({
    title: 'Another Draft',
    slug: 'another-draft',
    excerpt: 'Another draft',
    content: 'content',
    category_id: testCategoryId,
    author_id: 1,
    status: 'draft',
    read_time: 3,
  })
  
  const initialPublic = postRepo.findAllPaginated({ status: 'published' })
  log.info(`批量操作前公开文章数: ${initialPublic.total}`)
  
  postRepo.batchUpdateStatus([anotherDraft.id, testPostIds.draft], 'published')
  
  const afterBatchPublish = postRepo.findAllPaginated({ status: 'published' })
  assert(afterBatchPublish.total === initialPublic.total + 2, `批量发布后公开文章数+2，实际${afterBatchPublish.total}`)
  
  postRepo.batchUpdateStatus([anotherDraft.id, testPostIds.draft, testPostIds.published], 'archived')
  
  const afterBatchArchive = postRepo.findAllPaginated({ status: 'published' })
  assert(afterBatchArchive.total === 0, `批量下线后没有公开文章，实际${afterBatchArchive.total}`)
  
  const allStatus = postRepo.findAllPaginated({ status: ['draft', 'published', 'archived'] })
  assert(allStatus.total === 4, `后台仍然能看到所有文章（3初始+1新），实际${allStatus.total}`)
}

async function testAdminCanSeeAllStatuses() {
  log.section('8. 管理后台可以查询所有状态')
  
  postRepo.update(testPostIds.published, { status: 'published' as PostStatus })
  postRepo.update(testPostIds.draft, { status: 'draft' as PostStatus })
  postRepo.update(testPostIds.archived, { status: 'archived' as PostStatus })
  
  const all = postRepo.findAllPaginated({ status: ['draft', 'published', 'archived'] })
  assert(all.total >= 3, `管理后台能看到所有状态文章，实际${all.total}`)
  
  const draftsOnly = postRepo.findAllPaginated({ status: 'draft' })
  assert(draftsOnly.data.every(p => p.status === 'draft'), '草稿筛选只返回草稿')
  
  const archivedOnly = postRepo.findAllPaginated({ status: 'archived' })
  assert(archivedOnly.data.every(p => p.status === 'archived'), '下线筛选只返回下线')
}

async function cleanup() {
  log.section('清理测试环境')
  db.close()
  log.pass('测试完成')
}

async function runAllTests() {
  console.log('🧪 开始执行文章状态一致性自动化回归测试\n')
  
  try {
    await setup()
    await testPublicListOnlyShowsPublished()
    await testSearchOnlyPublished()
    await testCategoryOnlyPublished()
    await testRelatedOnlyPublished()
    await testViewLikeOnlyForPublished()
    await testStatusTransitionImmediateEffect()
    await testBatchStatusTransition()
    await testAdminCanSeeAllStatuses()
    await cleanup()
    
    console.log('\n🎉 所有测试通过！文章状态一致性保障生效。')
    process.exit(0)
  } catch (err) {
    console.error('\n💥 测试失败:', err)
    process.exit(1)
  }
}

runAllTests()
