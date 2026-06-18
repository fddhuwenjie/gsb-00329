<template>
  <div>
    <!-- Hero Section -->
    <section class="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
      <div class="absolute inset-0 bg-grid-white/[0.05] bg-[size:32px_32px]"></div>
      <div class="relative max-w-7xl mx-auto px-6 py-16 md:py-20">
        <div class="max-w-2xl">
          <h1 class="text-4xl md:text-5xl font-bold mb-4">
            文章分类
          </h1>
          <p class="text-xl text-slate-300 leading-relaxed">
            按照技术领域浏览我们的所有文章，找到你感兴趣的内容
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
      <!-- Categories Grid -->
      <section class="max-w-7xl mx-auto px-6 py-16">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <NuxtLink
            v-for="category in categories"
            :key="category.slug"
            :to="`/categories/${category.slug}`"
            class="group bg-white rounded-2xl border-2 border-slate-200 p-8 hover:border-slate-400 hover:shadow-xl transition-all flex flex-col"
          >
            <div class="text-5xl mb-4">{{ category.icon }}</div>
            <h2 class="text-2xl font-bold text-slate-900 mb-2 group-hover:text-emerald-600 transition-colors">
              {{ category.name }}
            </h2>
            <p class="text-slate-600 mb-4 line-clamp-2 flex-1">
              {{ category.description }}
            </p>
            <div class="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
              <span class="text-sm font-medium text-slate-500">{{ category.count }} 篇文章</span>
              <span class="text-sm font-medium text-emerald-600 group-hover:translate-x-1 transition-transform">
                浏览 →
              </span>
            </div>
          </NuxtLink>
        </div>

        <!-- Empty State -->
        <div v-if="categories.length === 0" class="text-center py-12">
          <div class="text-6xl mb-4">📭</div>
          <h3 class="text-xl font-semibold text-slate-900 mb-2">暂无分类</h3>
          <p class="text-slate-600">敬请期待更多内容</p>
        </div>
      </section>

      <!-- Stats Section -->
      <section class="bg-white py-16">
        <div class="max-w-7xl mx-auto px-6">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div class="text-4xl font-bold text-slate-900 mb-2">{{ stats?.published_posts || 0 }}</div>
              <div class="text-slate-600">文章总数</div>
            </div>
            <div>
              <div class="text-4xl font-bold text-slate-900 mb-2">{{ categories.length }}</div>
              <div class="text-slate-600">分类数量</div>
            </div>
            <div>
              <div class="text-4xl font-bold text-slate-900 mb-2">{{ formatViews(stats?.total_views || 0) }}</div>
              <div class="text-slate-600">总浏览量</div>
            </div>
            <div>
              <div class="text-4xl font-bold text-slate-900 mb-2">500+</div>
              <div class="text-slate-600">订阅读者</div>
            </div>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useApi, type Category, type Stats } from '~/composables/useApi'

const { getAllCategories, getStats } = useApi()

const categories = ref<Category[]>([])
const stats = ref<Stats | null>(null)
const loading = ref(true)

const formatViews = (views: number) => {
  if (views >= 1000) {
    return `${(views / 1000).toFixed(1)}K+`
  }
  return views.toString()
}

onMounted(async () => {
  loading.value = true
  try {
    const [categoriesData, statsData] = await Promise.all([
      getAllCategories(),
      getStats()
    ])
    categories.value = categoriesData
    stats.value = statsData
  } finally {
    loading.value = false
  }
})

useHead({
  title: '文章分类 - TechBlog',
  meta: [
    { name: 'description', content: '按照技术领域浏览我们的所有文章' }
  ]
})
</script>

<style scoped>
.bg-grid-white\/\[0\.05\] {
  background-image: linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
}
</style>
