<template>
  <div>
    <!-- Hero Section -->
    <section class="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
      <div class="absolute inset-0 bg-grid-white/[0.05] bg-[size:32px_32px]"></div>
      <div class="relative max-w-7xl mx-auto px-6 py-24 md:py-32">
        <div class="max-w-3xl">
          <div class="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full mb-6">
            <span class="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
            <span class="text-sm font-medium">每周更新</span>
          </div>
          <h2 class="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            探索前端技术<br />
            <span class="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              分享开发经验
            </span>
          </h2>
          <p class="text-xl text-slate-300 leading-relaxed mb-8">
            深入浅出的技术文章，涵盖前端开发、架构设计、性能优化等多个领域
          </p>
          <div class="flex flex-wrap gap-4">
            <NuxtLink to="/categories" class="px-6 py-3 bg-white text-slate-900 font-medium rounded-lg hover:bg-slate-100 transition-all">
              开始阅读
            </NuxtLink>
            <NuxtLink to="/categories" class="px-6 py-3 bg-white/10 backdrop-blur-sm text-white font-medium rounded-lg hover:bg-white/20 transition-all">
              浏览分类
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!-- Loading State -->
    <div v-if="loading" class="max-w-7xl mx-auto px-6 py-16">
      <div class="flex items-center justify-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    </div>

    <!-- Content -->
    <template v-else>
      <!-- Featured Posts -->
      <section class="max-w-7xl mx-auto px-6 py-16">
        <div class="flex items-center justify-between mb-8">
          <h2 class="text-3xl font-bold text-slate-900">精选文章</h2>
          <NuxtLink to="/categories" class="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
            查看全部 →
          </NuxtLink>
        </div>

        <div v-if="posts.length > 0" class="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8">
          <!-- Main Featured -->
          <NuxtLink :to="`/posts/${posts[0].slug}`" class="group cursor-pointer lg:col-span-2 block">
            <div class="relative aspect-[16/9] sm:aspect-[21/9] bg-gradient-to-br from-slate-900 to-slate-700 rounded-xl sm:rounded-2xl overflow-hidden mb-4 sm:mb-6">
              <img 
                :src="posts[0].image || ''" 
                :alt="posts[0].title"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div class="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent"></div>
              <div class="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-8">
                <div class="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <span class="px-2 sm:px-3 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full">特色</span>
                  <span class="text-xs sm:text-sm text-white/80">{{ formatDate(posts[0].created_at) }}</span>
                </div>
                <h3 class="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2 sm:mb-3 group-hover:text-emerald-400 transition-colors">
                  {{ posts[0].title }}
                </h3>
                <p class="text-sm sm:text-base md:text-lg text-white/90 leading-relaxed line-clamp-2">
                  {{ posts[0].excerpt }}
                </p>
              </div>
            </div>
          </NuxtLink>
        </div>

        <!-- Featured Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <NuxtLink
            v-for="post in posts.slice(1, 4)"
            :key="post.id"
            :to="`/posts/${post.slug}`"
            class="group cursor-pointer bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-xl hover:border-slate-300 transition-all"
          >
            <div class="relative aspect-video bg-gradient-to-br from-slate-200 to-slate-100 overflow-hidden">
              <img 
                :src="post.image || ''" 
                :alt="post.title"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div class="absolute top-3 sm:top-4 left-3 sm:left-4">
                <span :class="['px-2 sm:px-3 py-1 text-xs font-bold rounded-full', post.category_color]">
                  {{ post.category }}
                </span>
              </div>
            </div>
            <div class="p-4 sm:p-6">
              <div class="flex items-center gap-2 text-xs sm:text-sm text-slate-500 mb-2 sm:mb-3">
                <span>{{ formatDate(post.created_at) }}</span>
                <span>·</span>
                <span>{{ post.read_time }} 分钟</span>
              </div>
              <h3 class="text-base sm:text-lg md:text-xl font-bold text-slate-900 mb-2 group-hover:text-emerald-600 transition-colors line-clamp-2">
                {{ post.title }}
              </h3>
              <p class="text-sm sm:text-base text-slate-600 leading-relaxed line-clamp-2">
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
      </section>

      <!-- Latest Posts -->
      <section v-if="posts.length > 0" class="bg-white py-16">
        <div class="max-w-7xl mx-auto px-6">
          <h2 class="text-3xl font-bold text-slate-900 mb-8">最新文章</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <NuxtLink
              v-for="post in posts.slice(0, 4)"
              :key="post.id"
              :to="`/posts/${post.slug}`"
              class="group cursor-pointer flex gap-6"
            >
              <div class="w-48 h-32 flex-shrink-0 bg-gradient-to-br from-slate-200 to-slate-100 rounded-xl overflow-hidden">
                <img 
                  :src="post.image || ''" 
                  :alt="post.title"
                  class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-2">
                  <span :class="['px-2 py-1 text-xs font-bold rounded', post.category_color]">
                    {{ post.category }}
                  </span>
                </div>
                <h3 class="text-lg font-bold text-slate-900 mb-2 group-hover:text-emerald-600 transition-colors line-clamp-2">
                  {{ post.title }}
                </h3>
                <p class="text-sm text-slate-600 mb-3 line-clamp-2">
                  {{ post.excerpt }}
                </p>
                <div class="flex items-center gap-3 text-sm text-slate-500">
                  <span>{{ formatDate(post.created_at) }}</span>
                  <span>·</span>
                  <span>{{ post.read_time }} 分钟</span>
                </div>
              </div>
            </NuxtLink>
          </div>
        </div>
      </section>

      <!-- Categories -->
      <section v-if="categories.length > 0" class="max-w-7xl mx-auto px-6 py-16">
        <h2 class="text-3xl font-bold text-slate-900 mb-8">热门分类</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <NuxtLink
            v-for="category in categories.slice(0, 4)"
            :key="category.slug"
            :to="`/categories/${category.slug}`"
            :class="['group p-6 rounded-xl border-2 transition-all', category.color]"
          >
            <div class="text-3xl mb-3">{{ category.icon }}</div>
            <h3 class="text-lg font-bold text-slate-900 mb-1">{{ category.name }}</h3>
            <p class="text-sm text-slate-600">{{ category.count }} 篇文章</p>
          </NuxtLink>
        </div>
      </section>
    </template>

    <!-- Newsletter -->
    <section class="bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      <div class="max-w-4xl mx-auto px-6 py-16 text-center">
        <h2 class="text-4xl font-bold mb-4">订阅我们的周刊</h2>
        <p class="text-xl text-slate-300 mb-8">
          每周获取最新的技术文章和开发资源
        </p>
        <form @submit.prevent="handleSubscribe" class="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
          <input
            v-model="subscribeEmail"
            type="email"
            required
            placeholder="输入你的邮箱"
            class="flex-1 px-4 py-3 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button type="submit" class="px-6 py-3 bg-emerald-500 text-white font-medium rounded-lg hover:bg-emerald-600 transition-all">
            订阅
          </button>
        </form>
      </div>
    </section>

    <!-- Toast Component -->
    <Toast
      :show="toastVisible"
      :title="toastTitle"
      :message="toastMessage"
      @close="toastVisible = false"
    />
  </div>
</template>

<script setup lang="ts">
import Toast from '~/components/Toast.vue'
import { useApi, type Post, type Category } from '~/composables/useApi'

useHead({
  title: '首页 - TechBlog'
})

const { getAllPosts, getAllCategories, formatDate } = useApi()

// Reactive data
const posts = ref<Post[]>([])
const categories = ref<Category[]>([])
const loading = ref(true)

// Fetch data on mount
onMounted(async () => {
  loading.value = true
  try {
    const [postsData, categoriesData] = await Promise.all([
      getAllPosts('published'),
      getAllCategories()
    ])
    posts.value = postsData
    categories.value = categoriesData
  } finally {
    loading.value = false
  }
})

// Toast state
const toastVisible = ref(false)
const toastTitle = ref('')
const toastMessage = ref('')

// Subscribe form
const subscribeEmail = ref('')

const handleSubscribe = () => {
  if (subscribeEmail.value) {
    toastTitle.value = '订阅成功！'
    toastMessage.value = `${subscribeEmail.value} 已成功订阅我们的周刊`
    toastVisible.value = true
    subscribeEmail.value = ''
  }
}
</script>

<style scoped>
.bg-grid-white\/\[0\.05\] {
  background-image: linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
}
</style>
