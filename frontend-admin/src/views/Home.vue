<template>
  <div class="space-y-8">
    <div>
      <h1 class="text-3xl font-bold text-slate-900">仪表盘</h1>
      <p class="text-slate-600 mt-1">欢迎回来，查看博客的最新数据</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      <div class="bg-white rounded-xl border border-slate-200 p-6">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <p class="text-sm text-slate-600">文章总数</p>
            <p class="text-2xl font-bold text-slate-900">{{ stats?.total_posts || 0 }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl border border-slate-200 p-6">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
            <svg class="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p class="text-sm text-slate-600">已发布</p>
            <p class="text-2xl font-bold text-slate-900">{{ stats?.published_posts || 0 }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl border border-slate-200 p-6">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
            <svg class="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <div>
            <p class="text-sm text-slate-600">草稿</p>
            <p class="text-2xl font-bold text-slate-900">{{ stats?.draft_posts || 0 }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl border border-slate-200 p-6">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
            <svg class="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <div>
            <p class="text-sm text-slate-600">已下线</p>
            <p class="text-2xl font-bold text-slate-900">{{ stats?.archived_posts || 0 }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl border border-slate-200 p-6">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
            <svg class="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
          <div>
            <p class="text-sm text-slate-600">总浏览</p>
            <p class="text-2xl font-bold text-slate-900">{{ formatNumber(stats?.total_views || 0) }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-xl border border-slate-200">
      <div class="p-6 border-b border-slate-200">
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-bold text-slate-900">最近文章</h2>
          <router-link to="/posts" class="text-sm font-medium text-emerald-600 hover:text-emerald-700">
            查看全部 →
          </router-link>
        </div>
      </div>
      <div class="divide-y divide-slate-200">
        <div v-for="post in recentPosts" :key="post.id" class="p-6 flex items-center gap-4">
          <div class="w-16 h-16 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
            <img v-if="post.image" :src="getImageUrl(post.image)" :alt="post.title" class="w-full h-full object-cover" />
            <div v-else class="w-full h-full flex items-center justify-center text-slate-400">
              <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="font-semibold text-slate-900 truncate">{{ post.title }}</h3>
            <p class="text-sm text-slate-600">{{ post.category || '未分类' }} · {{ formatDate(post.created_at) }}</p>
          </div>
          <div class="flex items-center gap-4 text-sm text-slate-500">
            <span class="flex items-center gap-1">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {{ post.views }}
            </span>
            <span :class="['px-2 py-1 text-xs font-medium rounded', getStatusClass(post.status)]">
              {{ getStatusLabel(post.status) }}
            </span>
          </div>
        </div>
        <div v-if="recentPosts.length === 0" class="p-12 text-center text-slate-500">
          暂无文章
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <router-link to="/posts/new" class="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-6 text-white hover:from-emerald-600 hover:to-emerald-700 transition-all">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <div>
            <h3 class="font-bold text-lg">创建新文章</h3>
            <p class="text-emerald-100 text-sm">开始撰写新的博客文章</p>
          </div>
        </div>
      </router-link>

      <router-link to="/categories" class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white hover:from-blue-600 hover:to-blue-700 transition-all">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          </div>
          <div>
            <h3 class="font-bold text-lg">管理分类</h3>
            <p class="text-blue-100 text-sm">添加或编辑文章分类</p>
          </div>
        </div>
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useApi, type Post, type Stats, type PostStatus } from '../composables/useApi'

const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:3002/api'

const { getAllPosts, getStats } = useApi()

const stats = ref<Stats | null>(null)
const recentPosts = ref<Post[]>([])

const formatNumber = (num: number) => {
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`
  }
  return num.toString()
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

const getImageUrl = (image: string | null) => {
  if (!image) return ''
  if (image.startsWith('http') || image.startsWith('data:')) return image
  if (image.startsWith('/uploads')) return `${API_BASE.replace('/api', '')}${image}`
  return image
}

const getStatusLabel = (status: PostStatus) => {
  switch (status) {
    case 'published': return '已发布'
    case 'draft': return '草稿'
    case 'archived': return '已下线'
  }
}

const getStatusClass = (status: PostStatus) => {
  switch (status) {
    case 'published': return 'bg-emerald-100 text-emerald-700'
    case 'draft': return 'bg-slate-100 text-slate-700'
    case 'archived': return 'bg-amber-100 text-amber-700'
  }
}

onMounted(async () => {
  stats.value = await getStats()
  const result = await getAllPosts({ limit: 5 })
  recentPosts.value = result.data
})
</script>
