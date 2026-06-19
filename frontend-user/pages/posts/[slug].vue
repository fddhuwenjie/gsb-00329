<template>
  <div>
    <article class="max-w-4xl mx-auto px-6 py-12">
      <!-- Back Link -->
      <NuxtLink to="/" class="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors mb-8">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        返回首页
      </NuxtLink>

      <!-- Article Header -->
      <header class="mb-8">
        <div class="flex items-center gap-3 mb-4">
          <NuxtLink :to="`/categories/${post.category_slug}`" :class="['px-3 py-1 text-xs font-bold rounded-full', post.category_color]">
            {{ post.category }}
          </NuxtLink>
          <span class="text-sm text-slate-500">{{ formatDate(post.created_at) }}</span>
          <span class="text-sm text-slate-500">·</span>
          <span class="text-sm text-slate-500">{{ post.read_time }} 分钟阅读</span>
        </div>
        <h1 class="text-4xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight">
          {{ post.title }}
        </h1>
        <p class="text-xl text-slate-600 leading-relaxed">
          {{ post.excerpt }}
        </p>
      </header>

      <!-- Author Info -->
      <div class="flex items-center gap-4 p-6 bg-white rounded-xl border border-slate-200 mb-8">
        <img :src="post.author_avatar || ''" :alt="post.author_name || ''" class="w-14 h-14 rounded-full bg-slate-100" />
        <div>
          <h3 class="font-semibold text-slate-900">{{ post.author_name }}</h3>
          <p class="text-sm text-slate-600">{{ post.author_bio }}</p>
        </div>
      </div>

      <!-- Featured Image -->
      <div class="relative aspect-video bg-gradient-to-br from-slate-200 to-slate-100 rounded-2xl overflow-hidden mb-12">
        <img :src="post.image || ''" :alt="post.title" class="w-full h-full object-cover" />
      </div>

      <!-- Article Content -->
      <div class="prose prose-lg prose-slate max-w-none mb-12" v-html="renderedContent"></div>

      <!-- Tags -->
      <div class="flex flex-wrap gap-2 mb-12">
        <span
          v-for="tag in post.tags"
          :key="tag"
          class="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-full hover:bg-slate-200 transition-colors cursor-pointer"
        >
          #{{ tag }}
        </span>
      </div>

      <!-- Article Stats -->
      <div class="flex items-center gap-6 p-6 bg-white rounded-xl border border-slate-200 mb-12">
        <div class="flex items-center gap-2 text-slate-600">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <span>{{ post.views.toLocaleString() }} 次浏览</span>
        </div>
        <button @click="handleLike" class="flex items-center gap-2 text-slate-600 hover:text-red-500 transition-colors">
          <svg class="w-5 h-5 transition-all" :class="isLiked ? 'text-red-500 scale-110' : ''" :fill="isLiked ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span :class="isLiked ? 'text-red-500' : ''">{{ post.likes }} 人喜欢</span>
        </button>
      </div>

      <!-- Related Posts -->
      <section v-if="relatedPosts.length > 0">
        <h2 class="text-2xl font-bold text-slate-900 mb-6">相关文章</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <NuxtLink
            v-for="relatedPost in relatedPosts"
            :key="relatedPost.id"
            :to="`/posts/${relatedPost.slug}`"
            class="group bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-xl hover:border-slate-300 transition-all"
          >
            <div class="relative aspect-video bg-gradient-to-br from-slate-200 to-slate-100 overflow-hidden">
              <img :src="relatedPost.image || ''" :alt="relatedPost.title" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
            <div class="p-5">
              <div class="flex items-center gap-2 text-xs text-slate-500 mb-2">
                <span>{{ formatDate(relatedPost.created_at) }}</span>
                <span>·</span>
                <span>{{ relatedPost.read_time }} 分钟</span>
              </div>
              <h3 class="font-bold text-slate-900 group-hover:text-emerald-600 transition-colors line-clamp-2">
                {{ relatedPost.title }}
              </h3>
            </div>
          </NuxtLink>
        </div>
      </section>
    </article>
  </div>
</template>

<script setup lang="ts">
import { useApi, type Post } from '~/composables/useApi'

const route = useRoute()
const { getPostBySlug, getRelatedPosts, incrementViews, incrementLikes, formatDate } = useApi()

const slug = route.params.slug as string
const postData = await getPostBySlug(slug)

if (!postData) {
  throw createError({
    statusCode: 404,
    statusMessage: '文章不存在或已下线',
    fatal: true
  })
}

const post = ref<Post>(postData)
const relatedPosts = await getRelatedPosts(post.value.id, 3)

// Increment views on page load
if (post.value) {
  incrementViews(post.value.id)
}

// SEO
useHead({
  title: post.value ? `${post.value.title} - TechBlog` : '文章不存在 - TechBlog',
  meta: post.value ? [
    { name: 'description', content: post.value.excerpt || '' },
    { name: 'keywords', content: (post.value.tags || []).join(', ') },
    { property: 'og:title', content: post.value.title },
    { property: 'og:description', content: post.value.excerpt || '' },
    { property: 'og:image', content: post.value.image || '' }
  ] : []
})

// Render markdown content (simplified)
const renderedContent = computed(() => {
  if (!post.value) return ''
  return (post.value.content || '')
    .replace(/## (.*)/g, '<h2 class="text-2xl font-bold text-slate-900 mt-8 mb-4">$1</h2>')
    .replace(/### (.*)/g, '<h3 class="text-xl font-bold text-slate-900 mt-6 mb-3">$1</h3>')
    .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto my-4"><code>$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code class="bg-slate-100 text-slate-800 px-2 py-1 rounded text-sm">$1</code>')
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
    .replace(/- (.*)/g, '<li class="ml-4">$1</li>')
    .replace(/\n\n/g, '</p><p class="text-slate-700 leading-relaxed mb-4">')
})

// Like state (stored in localStorage)
const isLiked = ref(false)
const likeStorageKey = computed(() => `post_liked_${post.value.id}`)

// Check if already liked
onMounted(() => {
  if (post.value && typeof localStorage !== 'undefined') {
    isLiked.value = localStorage.getItem(likeStorageKey.value) === 'true'
  }
})

const handleLike = async () => {
  if (post.value) {
    if (isLiked.value) {
      // Unlike
      isLiked.value = false
      post.value.likes = Math.max(0, post.value.likes - 1)
      localStorage.removeItem(likeStorageKey.value)
    } else {
      // Like
      const success = await incrementLikes(post.value.id)
      if (success) {
        isLiked.value = true
        post.value.likes += 1
        localStorage.setItem(likeStorageKey.value, 'true')
      }
    }
  }
}
</script>

<style scoped>
.prose :deep(pre) {
  background-color: #0f172a;
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
}

.prose :deep(code) {
  font-family: 'Fira Code', monospace;
  font-size: 0.875rem;
}
</style>
