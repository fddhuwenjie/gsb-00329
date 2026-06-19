<template>
  <div>
    <!-- Hero Section -->
    <section class="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
      <div class="absolute inset-0 bg-grid-white/[0.05] bg-[size:32px_32px]"></div>
      <div class="relative max-w-7xl mx-auto px-6 py-16 md:py-20">
        <div class="max-w-2xl">
          <h1 class="text-4xl md:text-5xl font-bold mb-4">所有文章</h1>
          <p class="text-xl text-slate-300 leading-relaxed">
            浏览我们的所有技术文章，发现有价值的内容
          </p>
        </div>
      </div>
    </section>

    <!-- Loading State -->
    <div v-if="loading" class="max-w-7xl mx-auto px-6 py-16">
      <div class="flex items-center justify-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    </div>

    <template v-else>
      <!-- Posts Grid -->
      <section class="max-w-7xl mx-auto px-6 py-16">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <NuxtLink
            v-for="post in posts"
            :key="post.id"
            :to="`/posts/${post.slug}`"
            class="group bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-xl hover:border-slate-300 transition-all"
          >
            <div class="relative aspect-video bg-gradient-to-br from-slate-200 to-slate-100 overflow-hidden">
              <img 
                v-if="post.image"
                :src="post.image" 
                :alt="post.title"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div v-else class="w-full h-full flex items-center justify-center text-slate-400">
                <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div class="absolute top-4 left-4">
                <span :class="['px-3 py-1 text-xs font-bold rounded-full', post.category_color]">
                  {{ post.category }}
                </span>
              </div>
            </div>
            <div class="p-6">
              <div class="flex items-center gap-2 text-sm text-slate-500 mb-3">
                <span>{{ formatDate(post.created_at) }}</span>
                <span>·</span>
                <span>{{ post.read_time }} 分钟</span>
              </div>
              <h3 class="text-xl font-bold text-slate-900 mb-2 group-hover:text-emerald-600 transition-colors line-clamp-2">
                {{ post.title }}
              </h3>
              <p class="text-slate-600 leading-relaxed line-clamp-2">
                {{ post.excerpt }}
              </p>
            </div>
          </NuxtLink>
        </div>

        <!-- Empty State -->
        <div v-if="posts.length === 0" class="text-center py-12">
          <div class="text-6xl mb-4">📭</div>
          <h3 class="text-xl font-semibold text-slate-900 mb-2">暂无文章</h3>
          <p class="text-slate-600">敬请期待更多精彩内容</p>
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="flex items-center justify-center gap-2 mt-12">
          <button
            @click="changePage(currentPage - 1)"
            :disabled="currentPage <= 1"
            :class="['px-4 py-2 rounded-lg transition-colors', currentPage <= 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-100']"
          >
            上一页
          </button>
          <button
            v-for="page in visiblePages"
            :key="page"
            @click="typeof page === 'number' && changePage(page)"
            :class="['px-4 py-2 rounded-lg transition-colors', typeof page === 'number' ? (currentPage === page ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100') : 'text-slate-400 cursor-default']"
          >
            {{ page }}
          </button>
          <button
            @click="changePage(currentPage + 1)"
            :disabled="currentPage >= totalPages"
            :class="['px-4 py-2 rounded-lg transition-colors', currentPage >= totalPages ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-100']"
          >
            下一页
          </button>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useApi, type Post } from '~/composables/useApi'

useHead({
  title: '所有文章 - TechBlog'
})

const { getAllPostsPaginated, formatDate } = useApi()

const posts = ref<Post[]>([])
const loading = ref(true)
const currentPage = ref(1)
const totalPages = ref(0)
const limit = 9

const visiblePages = computed(() => {
  const pages: (number | string)[] = []
  const total = totalPages.value
  const current = currentPage.value

  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i)
  } else {
    pages.push(1)
    if (current > 3) pages.push('...')
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
      pages.push(i)
    }
    if (current < total - 2) pages.push('...')
    pages.push(total)
  }
  return pages
})

const fetchPosts = async () => {
  loading.value = true
  try {
    const result = await getAllPostsPaginated({ page: currentPage.value, limit })
    posts.value = result.data
    totalPages.value = result.totalPages
  } finally {
    loading.value = false
  }
}

const changePage = (page: number) => {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
  fetchPosts()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(fetchPosts)
</script>

<style scoped>
.bg-grid-white\/\[0\.05\] {
  background-image: linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
}
</style>
