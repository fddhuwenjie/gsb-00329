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

// Initialize database
initDatabase()

// Clear existing data
db.exec('DELETE FROM post_tags')
db.exec('DELETE FROM tags')
db.exec('DELETE FROM posts')
db.exec('DELETE FROM categories')
db.exec('DELETE FROM authors')

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

// Seed posts
const posts = [
  {
    slug: 'modern-web-app-complete-guide',
    title: '构建高性能的现代 Web 应用：完整指南',
    excerpt: '从架构设计到性能优化，全面解析如何使用最新技术栈构建企业级 Web 应用',
    content: `## 前言

在当今快速发展的技术环境中，构建高性能的 Web 应用变得越来越重要。本文将从多个维度详细介绍如何使用现代技术栈构建企业级应用。

## 技术栈选型

### 前端框架
Vue 3 和 Nuxt 4 的组合提供了出色的开发体验和性能表现。Composition API 让代码更加模块化和可复用。

\`\`\`typescript
// 使用 Composition API
const { data, pending, error } = await useFetch('/api/posts')
\`\`\`

### 样式方案
Tailwind CSS v4 带来了革命性的变化：
- **原子化 CSS** - 更小的包体积
- **JIT 编译** - 按需生成样式
- **暗色模式** - 原生支持

## 性能优化策略

### 1. 代码分割
合理使用动态导入减少首屏加载时间：

\`\`\`typescript
const HeavyComponent = defineAsyncComponent(() => 
  import('./HeavyComponent.vue')
)
\`\`\`

### 2. 图片优化
- 使用 WebP 格式
- 实现懒加载
- 响应式图片

### 3. 缓存策略
- Service Worker 离线缓存
- HTTP 缓存头优化
- CDN 加速

## 总结

构建高性能 Web 应用需要从多个维度考虑，包括框架选型、代码架构、性能优化等。希望本文能为你提供有价值的参考。`,
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
    slug: 'nuxt4-performance-optimization',
    title: 'Nuxt 4 性能优化完全指南',
    excerpt: '深入探讨 Nuxt 4 的性能优化技巧，包括代码分割、懒加载等',
    content: `## Nuxt 4 新特性概述

Nuxt 4 带来了许多令人兴奋的新特性，特别是在性能方面有了显著提升。

## 优化技巧

### 1. 路由级别代码分割
Nuxt 4 默认对每个页面进行代码分割，确保用户只加载需要的代码。

### 2. 组件懒加载
\`\`\`vue
<template>
  <LazyHeavyComponent v-if="showComponent" />
</template>
\`\`\`

### 3. 数据预取优化
使用 \`useFetch\` 和 \`useAsyncData\` 实现智能数据预取。

## 实战案例

本文将通过一个实际项目演示如何将页面加载时间从 3s 优化到 0.8s。`,
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
    content: `## Tailwind CSS v4 重大更新

Tailwind CSS v4 是一个里程碑式的版本，带来了全新的引擎和众多新特性。

## 新特性详解

### 1. 新的 PostCSS 引擎
v4 使用全新的引擎，构建速度提升 10 倍。

### 2. CSS 变量优先
所有颜色和间距现在都基于 CSS 变量：
\`\`\`css
:root {
  --color-primary: oklch(0.7 0.15 200);
}
\`\`\`

### 3. 容器查询原生支持
\`\`\`html
<div class="@container">
  <div class="@lg:grid-cols-2">...</div>
</div>
\`\`\`

## 迁移指南

从 v3 迁移到 v4 的步骤和注意事项。`,
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
    slug: 'vue3-composition-api-practice',
    title: 'Vue 3 组合式 API 实战',
    excerpt: '通过实际案例学习 Vue 3 组合式 API 的最佳实践',
    content: `## 组合式 API 介绍

Vue 3 的组合式 API 提供了一种更灵活的代码组织方式。

## 核心概念

### reactive 和 ref
\`\`\`typescript
const count = ref(0)
const state = reactive({ name: 'Vue', version: 3 })
\`\`\`

### computed 和 watch
\`\`\`typescript
const doubleCount = computed(() => count.value * 2)
watch(count, (newVal, oldVal) => {
  console.log(\`count changed from \${oldVal} to \${newVal}\`)
})
\`\`\`

## 实战案例

构建一个完整的购物车功能，演示组合式 API 的威力。`,
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
    slug: 'docker-deployment-best-practices',
    title: 'Docker 容器化部署最佳实践',
    excerpt: '学习如何使用 Docker 进行高效的应用部署',
    content: `## Docker 基础

Docker 是现代应用部署的标准工具。

## Dockerfile 最佳实践

### 多阶段构建
\`\`\`dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
COPY --from=builder /app/.output /app
CMD ["node", "/app/server/index.mjs"]
\`\`\`

### 镜像优化
- 使用 Alpine 基础镜像
- 合理利用缓存层
- 清理不必要的文件

## Docker Compose

使用 Docker Compose 编排多服务应用。`,
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
    content: `## TypeScript 类型系统

TypeScript 的类型系统是其最强大的特性之一。

## 高级类型

### 泛型
\`\`\`typescript
function identity<T>(arg: T): T {
  return arg
}
\`\`\`

### 条件类型
\`\`\`typescript
type IsString<T> = T extends string ? true : false
\`\`\`

### 映射类型
\`\`\`typescript
type Readonly<T> = {
  readonly [P in keyof T]: T[P]
}
\`\`\`

## 实用技巧

类型体操的实际应用场景。`,
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
    content: `## Vite 是什么

Vite 是下一代前端构建工具，提供极速的开发体验。

## 核心原理

### 原生 ESM
Vite 利用浏览器原生 ESM 支持，实现按需编译。

### 预构建优化
使用 esbuild 预构建依赖，提升冷启动速度。

## 配置优化

\`\`\`typescript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'vue-router']
        }
      }
    }
  }
})
\`\`\`

## 插件开发

如何开发自定义 Vite 插件。`,
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
    content: `## 性能指标

### Core Web Vitals
- LCP (Largest Contentful Paint)
- FID (First Input Delay)
- CLS (Cumulative Layout Shift)

## 优化策略

### 网络优化
- 资源压缩
- HTTP/2 多路复用
- 预加载关键资源

### 渲染优化
- 避免布局抖动
- 使用 CSS containment
- 虚拟滚动长列表

## 监控与度量

使用 Lighthouse 和 Web Vitals 库进行性能监控。`,
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop',
    category_slug: 'performance',
    author_name: '赵六',
    status: 'published',
    read_time: 15,
    views: 987,
    likes: 38,
    tags: ['性能优化', 'Web Vitals', '前端']
  }
]

// Get category and author IDs
const getCategoryId = (slug: string) => {
  const cat = db.prepare('SELECT id FROM categories WHERE slug = ?').get(slug) as { id: number } | undefined
  return cat?.id
}

const getAuthorId = (name: string) => {
  const author = db.prepare('SELECT id FROM authors WHERE name = ?').get(name) as { id: number } | undefined
  return author?.id
}

// Insert posts
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
    post.slug,
    post.title,
    post.excerpt,
    post.content,
    post.image,
    categoryId,
    authorId,
    post.status,
    post.read_time,
    post.views,
    post.likes
  )
  
  const postId = result.lastInsertRowid as number
  
  // Insert tags
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


// Additional posts for richer content
const additionalPosts = [
  {
    slug: 'react-vs-vue-comparison',
    title: 'React vs Vue：2024 年全面对比',
    excerpt: '从多个维度对比 React 和 Vue，帮助你做出正确的技术选型',
    content: `## 框架概述

React 和 Vue 是目前最流行的两个前端框架，各有优势。

## 学习曲线

### React
- JSX 语法需要适应
- 函数式编程思想
- 生态系统庞大

### Vue
- 模板语法直观
- 渐进式框架
- 官方工具链完善

## 性能对比

两者在性能上差异不大，关键在于使用方式。

## 生态系统

### React 生态
- Next.js
- Redux / Zustand
- React Query

### Vue 生态
- Nuxt
- Pinia
- VueUse

## 总结

选择哪个框架取决于团队背景和项目需求。`,
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
    content: `## Grid 基础

CSS Grid 是最强大的 CSS 布局系统。

## 核心概念

### 容器属性
\`\`\`css
.container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}
\`\`\`

### 项目属性
\`\`\`css
.item {
  grid-column: span 2;
  grid-row: 1 / 3;
}
\`\`\`

## 实战案例

### 响应式画廊
\`\`\`css
.gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
}
\`\`\`

## 与 Flexbox 配合

Grid 和 Flexbox 各有所长，合理搭配使用。`,
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
    content: `## Pinia 简介

Pinia 是 Vue 官方推荐的状态管理库，是 Vuex 的继任者。

## 基本使用

### 定义 Store
\`\`\`typescript
export const useCounterStore = defineStore('counter', {
  state: () => ({ count: 0 }),
  getters: {
    doubleCount: (state) => state.count * 2
  },
  actions: {
    increment() {
      this.count++
    }
  }
})
\`\`\`

### 组合式 API 风格
\`\`\`typescript
export const useCounterStore = defineStore('counter', () => {
  const count = ref(0)
  const doubleCount = computed(() => count.value * 2)
  function increment() {
    count.value++
  }
  return { count, doubleCount, increment }
})
\`\`\`

## 最佳实践

- 按功能模块划分 Store
- 使用 TypeScript 获得类型提示
- 合理使用 getters 缓存计算结果`,
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
    content: `## 什么是 Kubernetes

Kubernetes (K8s) 是容器编排的事实标准。

## 核心概念

### Pod
最小的部署单元，包含一个或多个容器。

### Service
为 Pod 提供稳定的网络访问入口。

### Deployment
管理 Pod 的副本数量和更新策略。

## 基本操作

### 部署应用
\`\`\`yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
      - name: my-app
        image: my-app:latest
        ports:
        - containerPort: 3000
\`\`\`

## 学习路径

从 Docker 到 K8s 的进阶之路。`,
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
    content: `## 工具类型概述

TypeScript 提供了许多内置的工具类型。

## 常用工具类型

### Partial<T>
\`\`\`typescript
interface User {
  name: string
  age: number
}
type PartialUser = Partial<User>
// { name?: string; age?: number }
\`\`\`

### Required<T>
\`\`\`typescript
type RequiredUser = Required<PartialUser>
// { name: string; age: number }
\`\`\`

### Pick<T, K>
\`\`\`typescript
type UserName = Pick<User, 'name'>
// { name: string }
\`\`\`

### Omit<T, K>
\`\`\`typescript
type UserWithoutAge = Omit<User, 'age'>
// { name: string }
\`\`\`

## 自定义工具类型

学会创建自己的工具类型。`,
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
    content: `## 测试金字塔

### 单元测试
测试独立的函数和组件。

### 集成测试
测试组件之间的交互。

### E2E 测试
测试完整的用户流程。

## 测试工具

### Vitest
\`\`\`typescript
import { describe, it, expect } from 'vitest'

describe('sum', () => {
  it('adds 1 + 2 to equal 3', () => {
    expect(1 + 2).toBe(3)
  })
})
\`\`\`

### Vue Test Utils
\`\`\`typescript
import { mount } from '@vue/test-utils'
import MyComponent from './MyComponent.vue'

test('renders properly', () => {
  const wrapper = mount(MyComponent, {
    props: { msg: 'Hello' }
  })
  expect(wrapper.text()).toContain('Hello')
})
\`\`\`

## 最佳实践

- 测试行为而非实现
- 保持测试简单
- 使用 Mock 隔离依赖`,
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
    content: `## 什么是无障碍

Web 无障碍确保残障人士也能使用网站。

## WCAG 标准

### 可感知
- 提供文本替代
- 提供字幕
- 确保足够的颜色对比度

### 可操作
- 键盘可访问
- 足够的时间
- 避免闪烁内容

### 可理解
- 可读性
- 可预测
- 输入辅助

### 健壮性
- 兼容辅助技术

## 实践技巧

### 语义化 HTML
\`\`\`html
<nav aria-label="主导航">
  <ul>
    <li><a href="/">首页</a></li>
  </ul>
</nav>
\`\`\`

### ARIA 属性
\`\`\`html
<button aria-expanded="false" aria-controls="menu">
  菜单
</button>
\`\`\``,
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
    content: `## CSS 动画基础

### Transition
\`\`\`css
.button {
  transition: transform 0.3s ease, background-color 0.3s ease;
}
.button:hover {
  transform: scale(1.05);
}
\`\`\`

### Animation
\`\`\`css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
.element {
  animation: fadeIn 0.5s ease-out;
}
\`\`\`

## 性能优化

### 使用 transform 和 opacity
这两个属性可以触发 GPU 加速。

### will-change
\`\`\`css
.animated {
  will-change: transform;
}
\`\`\`

### 避免布局抖动
不要在动画中改变会触发重排的属性。

## 实战案例

创建一个流畅的页面切换动画。`,
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

// Insert additional posts
for (const post of additionalPosts) {
  const categoryId = getCategoryId(post.category_slug)
  const authorId = getAuthorId(post.author_name)
  
  const result = postStmt.run(
    post.slug,
    post.title,
    post.excerpt,
    post.content,
    post.image,
    categoryId,
    authorId,
    post.status,
    post.read_time,
    post.views,
    post.likes
  )
  
  const postId = result.lastInsertRowid as number
  
  // Insert tags
  for (const tagName of post.tags) {
    tagStmt.run(tagName)
    const tag = getTagId.get(tagName) as { id: number }
    postTagStmt.run(postId, tag.id)
  }
}

console.log(`- ${additionalPosts.length} additional posts`)
