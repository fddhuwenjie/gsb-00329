import { initDatabase, db } from './db.js'
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

// Initialize database schema
initDatabase()

// Check if database has data
const postCount = (db.prepare('SELECT COUNT(*) as count FROM posts').get() as { count: number }).count

if (postCount > 0) {
  console.log(`Database already has ${postCount} posts, skipping seed.`)
  process.exit(0)
}

console.log('Database is empty, seeding...')

// Seed authors
const authors = [
  { name: '张三', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangsan', bio: '资深前端工程师，专注于 Web 性能优化和架构设计' },
  { name: '李四', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lisi', bio: '全栈开发者，Nuxt 核心贡献者' },
  { name: '王五', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wangwu', bio: 'UI/UX 设计师，CSS 布道者' },
  { name: '赵六', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhaoliu', bio: 'DevOps 工程师，云原生技术爱好者' }
]

const authorStmt = db.prepare('INSERT INTO authors (name, avatar, bio) VALUES (?, ?, ?)')
for (const author of authors) {
  authorStmt.run(author.name, author.avatar, author.bio)
}

// Seed categories
const categories = [
  { name: '前端开发', slug: 'frontend', icon: '💻', color: 'border-blue-200 hover:border-blue-500 hover:bg-blue-50', description: '包含 Vue、React、Angular 等前端框架的深度教程和最佳实践' },
  { name: 'CSS', slug: 'css', icon: '🎨', color: 'border-pink-200 hover:border-pink-500 hover:bg-pink-50', description: '现代 CSS 技术，包括 Tailwind、动画、布局等' },
  { name: 'Vue', slug: 'vue', icon: '⚡', color: 'border-emerald-200 hover:border-emerald-500 hover:bg-emerald-50', description: 'Vue.js 生态系统的完整指南' },
  { name: 'DevOps', slug: 'devops', icon: '🚀', color: 'border-orange-200 hover:border-orange-500 hover:bg-orange-50', description: 'Docker、Kubernetes、CI/CD 等运维技术' },
  { name: 'TypeScript', slug: 'typescript', icon: '📘', color: 'border-indigo-200 hover:border-indigo-500 hover:bg-indigo-50', description: 'TypeScript 类型系统和高级特性' },
  { name: '工具', slug: 'tools', icon: '🔧', color: 'border-purple-200 hover:border-purple-500 hover:bg-purple-50', description: 'Vite、Webpack 等构建工具详解' },
  { name: '性能', slug: 'performance', icon: '⚡', color: 'border-red-200 hover:border-red-500 hover:bg-red-50', description: 'Web 性能优化策略和实战' }
]

const categoryStmt = db.prepare('INSERT INTO categories (name, slug, icon, color, description) VALUES (?, ?, ?, ?, ?)')
for (const cat of categories) {
  categoryStmt.run(cat.name, cat.slug, cat.icon, cat.color, cat.description)
}

// Seed sample posts
const posts = [
  {
    slug: 'modern-web-app-complete-guide',
    title: '构建高性能的现代 Web 应用：完整指南',
    excerpt: '从架构设计到性能优化，全面解析如何使用最新技术栈构建企业级 Web 应用',
    content: '## 前言\n\n在当今快速发展的技术环境中，构建高性能的 Web 应用变得越来越重要。本文将从多个维度详细介绍如何使用现代技术栈构建企业级应用。\n\n## 技术栈选型\n\n### 前端框架\nVue 3 和 Nuxt 4 的组合提供了出色的开发体验和性能表现。',
    image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=1200&h=600&fit=crop',
    category_slug: 'frontend',
    author_name: '张三',
    status: 'published',
    read_time: 15,
    views: 3256,
    likes: 128,
    tags: ['Vue', 'Nuxt', '性能优化', '架构设计']
  },
  {
    slug: 'vue3-composition-api-practice',
    title: 'Vue 3 组合式 API 实战',
    excerpt: '通过实际案例学习 Vue 3 组合式 API 的最佳实践',
    content: '## 组合式 API 介绍\n\nVue 3 的组合式 API 提供了一种更灵活的代码组织方式。\n\n## 核心概念\n\n### reactive 和 ref\n```typescript\nconst count = ref(0)\nconst state = reactive({ name: "Vue", version: 3 })\n```',
    image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&h=400&fit=crop',
    category_slug: 'vue',
    author_name: '张三',
    status: 'published',
    read_time: 10,
    views: 2567,
    likes: 103,
    tags: ['Vue', 'Composition API', 'TypeScript']
  },
  {
    slug: 'nuxt4-performance-optimization',
    title: 'Nuxt 4 性能优化完全指南',
    excerpt: '深入探讨 Nuxt 4 的性能优化技巧，包括代码分割、懒加载等',
    content: '## Nuxt 4 新特性概述\n\nNuxt 4 带来了许多令人兴奋的新特性，特别是在性能方面有了显著提升。\n\n## 优化技巧\n\n### 1. 路由级别代码分割\nNuxt 4 默认对每个页面进行代码分割。',
    image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&h=400&fit=crop',
    category_slug: 'frontend',
    author_name: '李四',
    status: 'published',
    read_time: 8,
    views: 2145,
    likes: 89,
    tags: ['Nuxt', '性能优化', 'SSR']
  },
  {
    slug: 'tailwind-css-v4-features',
    title: 'Tailwind CSS v4 新特性解析',
    excerpt: '探索 Tailwind CSS v4 带来的革命性变化和新功能',
    content: '## Tailwind CSS v4 重大更新\n\nTailwind CSS v4 是一个里程碑式的版本，带来了全新的引擎和众多新特性。\n\n## 新特性详解\n\n### 1. 新的 PostCSS 引擎\nv4 使用全新的引擎，构建速度提升 10 倍。',
    image: 'https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?w=600&h=400&fit=crop',
    category_slug: 'css',
    author_name: '王五',
    status: 'published',
    read_time: 6,
    views: 1892,
    likes: 67,
    tags: ['Tailwind', 'CSS', '前端']
  },
  {
    slug: 'docker-deployment-best-practices',
    title: 'Docker 容器化部署最佳实践',
    excerpt: '学习如何使用 Docker 进行高效的应用部署',
    content: '## Docker 基础\n\nDocker 是现代应用部署的标准工具。\n\n## Dockerfile 最佳实践\n\n### 多阶段构建\n使用多阶段构建可以显著减小镜像体积。',
    image: 'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=400&h=300&fit=crop',
    category_slug: 'devops',
    author_name: '赵六',
    status: 'published',
    read_time: 7,
    views: 1456,
    likes: 52,
    tags: ['Docker', 'DevOps', '部署']
  },
  {
    slug: 'typescript-advanced-types',
    title: 'TypeScript 高级类型系统详解',
    excerpt: '深入理解 TypeScript 的类型系统和高级特性',
    content: '## TypeScript 类型系统\n\nTypeScript 的类型系统是其最强大的特性之一。\n\n## 高级类型\n\n### 泛型\n```typescript\nfunction identity<T>(arg: T): T {\n  return arg\n}\n```',
    image: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=400&h=300&fit=crop',
    category_slug: 'typescript',
    author_name: '李四',
    status: 'published',
    read_time: 12,
    views: 1823,
    likes: 74,
    tags: ['TypeScript', '类型系统', '前端']
  },
  {
    slug: 'vite-build-tool-analysis',
    title: 'Vite 构建工具深度解析',
    excerpt: '了解 Vite 的工作原理和优化技巧',
    content: '## Vite 是什么\n\nVite 是下一代前端构建工具，提供极速的开发体验。\n\n## 核心原理\n\n### 原生 ESM\nVite 利用浏览器原生 ESM 支持，实现按需编译。',
    image: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=300&fit=crop',
    category_slug: 'tools',
    author_name: '王五',
    status: 'published',
    read_time: 9,
    views: 1234,
    likes: 45,
    tags: ['Vite', '构建工具', '前端']
  },
  {
    slug: 'web-performance-optimization',
    title: 'Web 性能优化实战指南',
    excerpt: '从多个维度优化 Web 应用的加载和运行性能',
    content: '## 性能指标\n\n### Core Web Vitals\n- LCP (Largest Contentful Paint)\n- FID (First Input Delay)\n- CLS (Cumulative Layout Shift)\n\n## 优化策略\n\n### 网络优化\n- 资源压缩\n- HTTP/2 多路复用',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop',
    category_slug: 'performance',
    author_name: '赵六',
    status: 'published',
    read_time: 15,
    views: 987,
    likes: 38,
    tags: ['性能优化', 'Web Vitals', '前端']
  },
  {
    slug: 'react-vs-vue-comparison',
    title: 'React vs Vue：2024 年全面对比',
    excerpt: '从多个维度对比 React 和 Vue，帮助你做出正确的技术选型',
    content: '## 框架概述\n\nReact 和 Vue 是目前最流行的两个前端框架，各有优势。\n\n## 学习曲线\n\n### React\n- JSX 语法需要适应\n- 函数式编程思想',
    image: 'https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?w=600&h=400&fit=crop',
    category_slug: 'frontend',
    author_name: '张三',
    status: 'published',
    read_time: 12,
    views: 2890,
    likes: 156,
    tags: ['React', 'Vue', '框架对比']
  },
  {
    slug: 'css-grid-layout-mastery',
    title: 'CSS Grid 布局完全掌握',
    excerpt: '从基础到高级，全面学习 CSS Grid 布局技术',
    content: '## Grid 基础\n\nCSS Grid 是最强大的 CSS 布局系统。\n\n## 核心概念\n\n### 容器属性\n```css\n.container {\n  display: grid;\n  grid-template-columns: repeat(3, 1fr);\n}\n```',
    image: 'https://images.unsplash.com/photo-1523437113738-bbd3cc89fb19?w=600&h=400&fit=crop',
    category_slug: 'css',
    author_name: '王五',
    status: 'published',
    read_time: 10,
    views: 1567,
    likes: 78,
    tags: ['CSS', 'Grid', '布局']
  },
  {
    slug: 'vue-pinia-state-management',
    title: 'Vue 3 状态管理：Pinia 完全指南',
    excerpt: '学习使用 Pinia 进行 Vue 3 应用的状态管理',
    content: '## Pinia 简介\n\nPinia 是 Vue 官方推荐的状态管理库，是 Vuex 的继任者。\n\n## 基本使用\n\n### 定义 Store\n```typescript\nexport const useCounterStore = defineStore("counter", {\n  state: () => ({ count: 0 })\n})\n```',
    image: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=600&h=400&fit=crop',
    category_slug: 'vue',
    author_name: '李四',
    status: 'published',
    read_time: 8,
    views: 1345,
    likes: 62,
    tags: ['Vue', 'Pinia', '状态管理']
  },
  {
    slug: 'kubernetes-introduction',
    title: 'Kubernetes 入门：从零开始',
    excerpt: '了解 Kubernetes 的核心概念和基本操作',
    content: '## 什么是 Kubernetes\n\nKubernetes (K8s) 是容器编排的事实标准。\n\n## 核心概念\n\n### Pod\n最小的部署单元，包含一个或多个容器。',
    image: 'https://images.unsplash.com/photo-1667372393086-9d4001d51cf1?w=600&h=400&fit=crop',
    category_slug: 'devops',
    author_name: '赵六',
    status: 'published',
    read_time: 14,
    views: 1123,
    likes: 48,
    tags: ['Kubernetes', 'DevOps', '容器编排']
  },
  {
    slug: 'typescript-utility-types',
    title: 'TypeScript 实用工具类型详解',
    excerpt: '掌握 TypeScript 内置的实用工具类型',
    content: '## 工具类型概述\n\nTypeScript 提供了许多内置的工具类型。\n\n## 常用工具类型\n\n### Partial<T>\n```typescript\ntype PartialUser = Partial<User>\n```',
    image: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=600&h=400&fit=crop',
    category_slug: 'typescript',
    author_name: '李四',
    status: 'published',
    read_time: 9,
    views: 1678,
    likes: 85,
    tags: ['TypeScript', '工具类型', '类型编程']
  },
  {
    slug: 'frontend-testing-strategies',
    title: '前端测试策略与实践',
    excerpt: '构建可靠的前端测试体系，提升代码质量',
    content: '## 测试金字塔\n\n### 单元测试\n测试独立的函数和组件。\n\n### 集成测试\n测试组件之间的交互。',
    image: 'https://images.unsplash.com/photo-1576444356170-66073046b1bc?w=600&h=400&fit=crop',
    category_slug: 'tools',
    author_name: '张三',
    status: 'published',
    read_time: 11,
    views: 892,
    likes: 41,
    tags: ['测试', 'Vitest', '前端']
  },
  {
    slug: 'web-accessibility-guide',
    title: 'Web 无障碍开发指南',
    excerpt: '让你的网站对所有用户都友好',
    content: '## 什么是无障碍\n\nWeb 无障碍确保残障人士也能使用网站。\n\n## WCAG 标准\n\n### 可感知\n- 提供文本替代\n- 确保足够的颜色对比度',
    image: 'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=600&h=400&fit=crop',
    category_slug: 'frontend',
    author_name: '王五',
    status: 'published',
    read_time: 10,
    views: 756,
    likes: 35,
    tags: ['无障碍', 'WCAG', 'HTML']
  },
  {
    slug: 'css-animation-techniques',
    title: 'CSS 动画技巧与性能优化',
    excerpt: '创建流畅的 CSS 动画，提升用户体验',
    content: '## CSS 动画基础\n\n### Transition\n```css\n.button {\n  transition: transform 0.3s ease;\n}\n```\n\n### Animation\n使用 @keyframes 创建复杂动画。',
    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&h=400&fit=crop',
    category_slug: 'css',
    author_name: '王五',
    status: 'published',
    read_time: 8,
    views: 1234,
    likes: 56,
    tags: ['CSS', '动画', '性能']
  }
]

const getCategoryId = (slug: string) => {
  const cat = db.prepare('SELECT id FROM categories WHERE slug = ?').get(slug) as { id: number } | undefined
  return cat?.id
}

const getAuthorId = (name: string) => {
  const author = db.prepare('SELECT id FROM authors WHERE name = ?').get(name) as { id: number } | undefined
  return author?.id
}

const postStmt = db.prepare(`
  INSERT INTO posts (slug, title, excerpt, content, image, category_id, author_id, status, read_time, views, likes)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`)

const tagStmt = db.prepare('INSERT OR IGNORE INTO tags (name) VALUES (?)')
const postTagStmt = db.prepare('INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?)')
const getTagId = db.prepare('SELECT id FROM tags WHERE name = ?')

for (const post of posts) {
  const categoryId = getCategoryId(post.category_slug)
  const authorId = getAuthorId(post.author_name)
  
  const result = postStmt.run(
    post.slug, post.title, post.excerpt, post.content, post.image,
    categoryId, authorId, post.status, post.read_time, post.views, post.likes
  )
  
  const postId = result.lastInsertRowid as number
  for (const tagName of post.tags) {
    tagStmt.run(tagName)
    const tag = getTagId.get(tagName) as { id: number }
    postTagStmt.run(postId, tag.id)
  }
}

console.log('Database seeded successfully!')
console.log(`- ${authors.length} authors`)
console.log(`- ${categories.length} categories`)
console.log(`- ${posts.length} posts`)
