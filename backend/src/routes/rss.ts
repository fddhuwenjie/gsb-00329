import { Router } from 'express'
import { postRepository } from '../repositories/postRepository.js'
import { PUBLIC_POST_STATUSES } from '../types.js'

const router = Router()

router.get('/', (req, res) => {
  // RSS 也是公网入口，必须严格走 PUBLIC_POST_STATUSES：
  // 这样「下线后立即不再出现在 RSS 阅读器」是稳定行为。
  const result = postRepository.findAllPaginated({ statuses: PUBLIC_POST_STATUSES, limit: 20 })
  const posts = result.data
  
  const baseUrl = process.env.SITE_URL || 'http://localhost:8091'
  const now = new Date().toUTCString()
  
  const items = posts.map(post => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${baseUrl}/posts/${post.slug}</link>
      <guid isPermaLink="true">${baseUrl}/posts/${post.slug}</guid>
      <description><![CDATA[${post.excerpt || ''}]]></description>
      <pubDate>${new Date(post.created_at).toUTCString()}</pubDate>
      ${post.category ? `<category><![CDATA[${post.category}]]></category>` : ''}
      ${post.author_name ? `<author>${post.author_name}</author>` : ''}
    </item>`).join('')

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>TechBlog</title>
    <link>${baseUrl}</link>
    <description>分享前端技术，探索开发之美</description>
    <language>zh-CN</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${baseUrl}/rss" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`

  res.set('Content-Type', 'application/rss+xml; charset=utf-8')
  res.send(rss)
})

export default router
