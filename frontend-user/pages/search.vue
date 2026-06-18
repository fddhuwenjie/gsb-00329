<template>
  <div>
    <!-- Search Section -->
    <section class="max-w-4xl mx-auto px-6 py-12">
      <h1 class="text-4xl font-bold text-slate-900 mb-8 text-center">搜索文章</h1>
      
      <!-- Search Input -->
      <div class="relative mb-8">
        <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <svg class="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索文章标题、内容或标签..."
          class="w-full pl-14 pr-4 py-4 text-lg bg-white border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
          @input="handleSearch"
        />
        <button
          v-if="searchQuery"
          @click="clearSearch"
          class="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Popular Tags -->
      <div class="mb-12">
        <h3 class="text-sm font-medium text-slate-500 mb-3">热门标签</h3>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="tag in popularTags"
            :key="tag"
            @click="searchQuery = tag; handleSearch()"
            class="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-full hover:bg-slate-50 hover:border-slate-300 transition-colors"
          >
            #{{ tag }}
          </button>
        </div>
      </div>

      <!-- Search Results -->
      <div v-if="searchQuery">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-semibold text-slate-900">
            {{ searchResults.length > 0 ? `找到 ${searchResults.length} 篇相关文章` : '未找到相关文章' }}
          </h2>
        </div>

        <div v-if="searchResults.length > 0" class="space-y-6">
          <NuxtLink
            v-for="post in searchResults"
            :key="post.id"
            :to="`/posts/${post.slug}`"
            class="group flex gap-6 bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg hover:border-slate-300 transition-all"
          >
            <div class="w-48 h-32 flex-shrink-0 bg-gradient-to-br from-slate-200 to-slate-100 rounded-lg overflow-hidden">
              <img :src="post.image || ''" :alt="post.title" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-2">
                <span :class="['px-2 py-1 text-xs font-bold rounded', post.category_color]">
                  {{ post.category }}
                </span>
                <span class="text-sm text-slate-500">{{ formatDate(post.created_at) }}</span>
              </div>
              <h3 class="text-xl font-bold text-slate-900 mb-2 group-hover:text-emerald-600 transition-colors line-clamp-1">
                {{ post.title }}
              </h3>
              <p class="text-slate-600 line-clamp-2 mb-3">
                {{ post.excerpt }}
              </p>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="tag in (post.tags || []).slice(0, 3)"
                  :key="tag"
                  class="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded"
                >
                  #{{ tag }}
                </span>
              </div>
            </div>
          </NuxtLink>
        </div>

        <!-- No Results -->
        <div v-else class="text-center py-16">
          <div class="text-6xl mb-4">🔍</div>
          <h3 class="text-xl font-semibold text-slate-900 mb-2">未找到相关文章</h3>
          <p class="text-slate-600">尝试使用其他关键词搜索</p>
        </div>
      </div>

      <!-- Initial State -->
      <div v-else class="text-center py-16">
        <div class="text-6xl mb-4">📚</div>
        <h3 class="text-xl font-semibold text-slate-900 mb-2">开始搜索</h3>
        <p class="text-slate-600">输入关键词搜索你感兴趣的文章</p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useApi, type Post } from '~/composables/useApi'

const { searchPosts, formatDate } = useApi()

const searchQuery = ref('')
const searchResults = ref<Post[]>([])

const popularTags = ['Vue', 'Nuxt', 'TypeScript', 'CSS', 'Docker', '性能优化']

const handleSearch = async () => {
  if (searchQuery.value.trim()) {
    searchResults.value = await searchPosts(searchQuery.value.trim())
  } else {
    searchResults.value = []
  }
}

const clearSearch = () => {
  searchQuery.value = ''
  searchResults.value = []
}

useHead({
  title: '搜索 - TechBlog',
  meta: [
    { name: 'description', content: '搜索 TechBlog 上的技术文章' }
  ]
})
</script>
