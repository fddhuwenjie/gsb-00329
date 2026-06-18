# TechBlog - 全栈博客系统

一个现代化的全栈博客系统，包含用户前端、管理后台和后端 API 服务。

## 技术栈

### 前端用户端 (frontend-user)
- **Nuxt 4** - Vue.js 全栈框架
- **Vue 3** - 渐进式 JavaScript 框架
- **Tailwind CSS v4** - 原子化 CSS 框架
- **TypeScript** - 类型安全

### 管理后台 (frontend-admin)
- **Vue 3** + **Vite** - 快速开发体验
- **Vue Router** - 路由管理
- **Tailwind CSS v4** - 样式框架
- **TypeScript** - 类型安全

### 后端服务 (backend)
- **Node.js** + **Express** - Web 服务框架
- **SQLite** + **better-sqlite3** - 轻量级数据库
- **TypeScript** - 类型安全
- **express-validator** - 请求验证
- **helmet** - 安全头
- **express-rate-limit** - 请求限流

## 项目结构

```
├── backend/                 # 后端 API 服务
│   ├── src/
│   │   ├── db.ts           # 数据库初始化
│   │   ├── index.ts        # 服务入口
│   │   ├── seed.ts         # 数据库种子
│   │   ├── types.ts        # 类型定义
│   │   ├── repositories/   # 数据访问层
│   │   └── routes/         # API 路由
│   └── data/               # SQLite 数据库文件 + 上传文件
├── frontend-user/          # 用户前端
│   ├── pages/              # 页面组件
│   ├── composables/        # 组合式函数
│   ├── components/         # 通用组件
│   └── layouts/            # 布局组件
├── frontend-admin/         # 管理后台
│   └── src/
│       ├── views/          # 页面视图
│       ├── composables/    # 组合式函数
│       └── router/         # 路由配置
├── docker-compose.yml      # Docker 编排配置
└── .env.example            # 环境变量示例
```

## 快速开始

### 开发环境

1. 启动后端服务：
```bash
cd backend
npm install
npm run db:seed  # 初始化数据库
npm run dev
```

2. 启动用户前端：
```bash
cd frontend-user
npm install
npm run dev
```

3. 启动管理后台：
```bash
cd frontend-admin
npm install
npm run dev
```

### Docker 部署

1. 复制环境变量配置文件：
```bash
cp .env.example .env
```

2. 根据需要修改 `.env` 文件中的配置：
```bash
# 后端 API 端口 (宿主机)
BACKEND_PORT=3002

# 用户前端端口 (宿主机)
FRONTEND_USER_PORT=8091

# 管理后台端口 (宿主机)
FRONTEND_ADMIN_PORT=8092

# API 基础地址 (浏览器访问地址)
API_BASE_URL=http://localhost:3002/api
```

3. 构建并启动服务：
```bash
docker-compose up -d --build
```

4. 停止服务：
```bash
docker-compose down
```

默认服务端口：
- 后端 API: http://localhost:3002
- 用户前端: http://localhost:8091
- 管理后台: http://localhost:8092

### 生产环境部署

在生产环境中，需要修改 `API_BASE_URL` 为实际的服务器地址：

```bash
# .env
API_BASE_URL=https://api.yourdomain.com/api
```

## 环境变量说明

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `BACKEND_PORT` | 后端 API 宿主机端口 | `3002` |
| `FRONTEND_USER_PORT` | 用户前端宿主机端口 | `8091` |
| `FRONTEND_ADMIN_PORT` | 管理后台宿主机端口 | `8092` |
| `API_BASE_URL` | 浏览器访问后端 API 的地址 | `http://localhost:3002/api` |

## API 接口

### 文章 (Posts)
- `GET /api/posts` - 获取所有文章（支持分页和搜索）
  - 参数: `page`, `limit`, `status`, `search`
- `GET /api/posts/:id` - 获取单篇文章
- `GET /api/posts/slug/:slug` - 根据 slug 获取文章
- `GET /api/posts/category/:slug` - 获取分类下的文章
- `GET /api/posts/search?q=keyword` - 搜索文章
- `GET /api/posts/:id/related` - 获取相关文章
- `POST /api/posts` - 创建文章
- `PUT /api/posts/:id` - 更新文章
- `DELETE /api/posts/:id` - 删除文章
- `POST /api/posts/:id/view` - 增加浏览量
- `POST /api/posts/:id/like` - 点赞

### 分类 (Categories)
- `GET /api/categories` - 获取所有分类
- `GET /api/categories/:id` - 获取单个分类
- `GET /api/categories/slug/:slug` - 根据 slug 获取分类
- `POST /api/categories` - 创建分类
- `PUT /api/categories/:id` - 更新分类
- `DELETE /api/categories/:id` - 删除分类

### 作者 (Authors)
- `GET /api/authors` - 获取所有作者
- `GET /api/authors/:id` - 获取单个作者
- `POST /api/authors` - 创建作者
- `PUT /api/authors/:id` - 更新作者
- `DELETE /api/authors/:id` - 删除作者

### 上传 (Upload)
- `POST /api/upload/image` - 上传图片（Base64）
  - 支持格式: JPEG, PNG, GIF, WebP
  - 最大大小: 5MB

### 统计 (Stats)
- `GET /api/stats` - 获取统计数据

## 功能特性

### 用户前端
- 响应式设计，支持移动端
- 文章列表、详情、搜索
- 分类浏览
- SEO 优化
- 文章点赞、浏览统计
- 相关文章推荐

### 管理后台
- 仪表盘数据概览
- 文章 CRUD 管理
- 文章分页和搜索
- 分类管理
- Markdown 编辑器
- 封面图片上传（支持拖拽）
- 文章状态管理（草稿/发布）
- 测试账号：admin / admin123

### 后端服务
- RESTful API 设计
- 数据验证 (express-validator)
- 安全头 (helmet)
- 请求限流 (express-rate-limit)
  - API: 100 请求/15分钟
  - 上传: 10 请求/分钟
- 错误处理
- CORS 支持
- 健康检查端点
- 静态文件服务（上传图片）

## 安全特性

- **Helmet**: 设置安全 HTTP 头
- **Rate Limiting**: 防止暴力攻击和 DDoS
- **Input Validation**: 所有输入都经过验证和清理
- **CORS**: 跨域资源共享配置
- **File Upload Validation**: 文件类型和大小限制

## License

MIT
