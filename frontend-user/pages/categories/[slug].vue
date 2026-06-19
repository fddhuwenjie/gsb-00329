<template>
  <div>
    <!-- Category Hero -->
    <section class="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
      <div class="absolute inset-0 bg-grid-white/[0.05] bg-[size:32px_32px]"></div>
      <div class="relative max-w-7xl mx-auto px-6 py-16 md:py-20">
        <NuxtLink to="/categories" class="inline-flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-white transition-colors mb-6">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          所有分类
        </NuxtLink>
        <div class="flex items-center gap-6">
          <div class="text-6xl">{{ category.icon }}</div>
          <div>
            <h1 class="text-4xl md:text-5xl font-bold mb-2">{{ category.name }}</h1>
            <p class="text-xl text-slate-300">{{ category.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Posts Grid -->
    <section class="max-w-7xl mx-auto px-6 py-16">
      <div class="flex items-center justify-between mb-8">
        <h2 class="text-2xl font-bold text-slate-900">
          共 {{ posts.length }} 篇文章
        </h2>
        <div class="flex gap-2">
          <button
            :class="['px-4 py-2 text-sm font-medium rounded-lg transition-colors', sortBy === 'latest' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200']"
            @click="sortBy = 'latest'"
          >
            最新发布
          </button>
          <button
            :class="['px-4 py-2 text-sm font-medium rounded-lg transition-colors', sortBy === 'popular' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200']"
            @click="sortBy = 'popular'"
          >
            最多浏览
          </button>
        </div>
      </div>

      <div v-if="posts.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <NuxtLink
          v-for="post in sortedPosts"
          :key="post.id"
          :to="`/posts/${post.slug}`"
          class="group bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-xl hover:border-slate-300 transition-all flex flex-col"
        >
          <div class="relative aspect-video bg-gradient-to-br from-slate-200 to-slate-100 overflow-hidden">
            <img :src="post.image || ''" :alt="post.title" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          </div>
          <div class="p-6 flex flex-col flex-1">
            <div class="flex items-center gap-2 text-sm text-slate-500 mb-3">
              <span>{{ formatDate(post.created_at) }}</span>
              <span>·</span>
              <span>{{ post.read_time }} 分钟阅读</span>
            </div>
            <h3 class="text-xl font-bold text-slate-900 mb-2 group-hover:text-emerald-600 transition-colors line-clamp-2">
              {{ post.title }}
            </h3>
            <p class="text-slate-600 leading-relaxed line-clamp-2 mb-4 flex-1">
              {{ post.excerpt }}
            </p>
            <div class="flex items-center gap-4 text-sm text-slate-500 mt-auto pt-4 border-t border-slate-100">
              <span class="flex items-center gap-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {{ post.views.toLocaleString() }}
              </span>
              <span class="flex items-center gap-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {{ post.likes }}
              </span>
            </div>
          </div>
        </NuxtLink>
      </div>

      <div v-else class="text-center py-16">
        <div class="text-6xl mb-4">📭</div>
        <h3 class="text-xl font-semibold text-slate-900 mb-2">暂无文章</h3>
        <p class="text-slate-600">该分类下还没有发布任何文章</p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useApi, type Category, type Post } from '~/composables/useApi'

const route = useRoute()
const { getCategoryBySlug, getPostsByCategory, formatDate } = useApi()

const slug = route.params.slug as string

const [categoryData, postsData] = await Promise.all([
  getCategoryBySlug(slug),
  getPostsByCategory(slug)
])

if (!categoryData) {
  throw createError({
    statusCode: 404,
    statusMessage: '分类不存在',
    fatal: true
  })
}

const category = ref<Category>(categoryData)
const posts = ref<Post[]>(postsData)
const sortBy = ref<'latest' | 'popular'>('latest')

const sortedPosts = computed(() => {
  const sorted = [...posts.value]
  if (sortBy.value === 'popular') {
    return sorted.sort((a, b) => b.views - a.views)
  }
  return sorted
})

useHead({
  title: computed(() => `${category.value.name} - TechBlog`),
  meta: computed(() => [
    { name: 'description', content: category.value.description || '' }
  ])
})
</script>

<style scoped>
.bg-grid-white\/\[0\.05\] {
  background-image: linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
}
</style>
