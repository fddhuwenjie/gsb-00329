<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-slate-900">文章管理</h1>
        <p class="text-slate-600 mt-1">管理所有博客文章</p>
      </div>
      <router-link to="/posts/new" class="px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        新建文章
      </router-link>
    </div>

    <!-- Search and Filters -->
    <div class="flex flex-col sm:flex-row gap-4">
      <div class="flex-1">
        <div class="relative">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            v-model="searchQuery"
            @input="debouncedSearch"
            type="text"
            placeholder="搜索文章标题或摘要..."
            class="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
      </div>
      <div class="flex gap-2">
        <button
          v-for="filter in filters"
          :key="filter.value"
          @click="handleFilterChange(filter.value)"
          :class="['px-4 py-2 text-sm font-medium rounded-lg transition-colors', currentFilter === filter.value ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50']"
        >
          {{ filter.label }}
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
    </div>

    <!-- Posts Table -->
    <div v-else class="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <table class="w-full">
        <thead class="bg-slate-50 border-b border-slate-200">
          <tr>
            <th class="text-left px-6 py-4 text-sm font-semibold text-slate-900">文章</th>
            <th class="text-left px-6 py-4 text-sm font-semibold text-slate-900">分类</th>
            <th class="text-left px-6 py-4 text-sm font-semibold text-slate-900">状态</th>
            <th class="text-left px-6 py-4 text-sm font-semibold text-slate-900">浏览</th>
            <th class="text-left px-6 py-4 text-sm font-semibold text-slate-900">日期</th>
            <th class="text-right px-6 py-4 text-sm font-semibold text-slate-900">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-200">
          <tr v-for="post in posts" :key="post.id" class="hover:bg-slate-50">
            <td class="px-6 py-4">
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                  <img v-if="post.image" :src="getImageUrl(post.image)" :alt="post.title" class="w-full h-full object-cover" />
                  <div v-else class="w-full h-full flex items-center justify-center text-slate-400">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <div class="min-w-0">
                  <h3 class="font-semibold text-slate-900 truncate max-w-xs">{{ post.title }}</h3>
                  <p class="text-sm text-slate-500 truncate max-w-xs">{{ post.excerpt || '暂无摘要' }}</p>
                </div>
              </div>
            </td>
            <td class="px-6 py-4">
              <span class="text-sm text-slate-600">{{ post.category || '-' }}</span>
            </td>
            <td class="px-6 py-4">
              <span :class="['px-2 py-1 text-xs font-medium rounded', post.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700']">
                {{ post.status === 'published' ? '已发布' : '草稿' }}
              </span>
            </td>
            <td class="px-6 py-4">
              <span class="text-sm text-slate-600">{{ post.views }}</span>
            </td>
            <td class="px-6 py-4">
              <span class="text-sm text-slate-600">{{ formatDate(post.created_at) }}</span>
            </td>
            <td class="px-6 py-4 text-right">
              <div class="flex items-center justify-end gap-2">
                <router-link :to="`/posts/${post.id}`" class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </router-link>
                <button @click="handleDelete(post.id)" class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="posts.length === 0">
            <td colspan="6" class="px-6 py-12 text-center text-slate-500">
              {{ searchQuery ? '未找到匹配的文章' : '暂无文章' }}
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex items-center justify-between px-6 py-4 border-t border-slate-200">
        <div class="text-sm text-slate-600">
          共 {{ total }} 篇文章，第 {{ currentPage }} / {{ totalPages }} 页
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="handlePageChange(currentPage - 1)"
            :disabled="currentPage <= 1"
            :class="['px-3 py-1 text-sm rounded-lg transition-colors', currentPage <= 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-100']"
          >
            上一页
          </button>
          <button
            v-for="page in visiblePages"
            :key="page"
            @click="typeof page === 'number' && handlePageChange(page)"
            :class="['px-3 py-1 text-sm rounded-lg transition-colors', typeof page === 'number' ? (currentPage === page ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100') : 'text-slate-400 cursor-default']"
          >
            {{ page }}
          </button>
          <button
            @click="handlePageChange(currentPage + 1)"
            :disabled="currentPage >= totalPages"
            :class="['px-3 py-1 text-sm rounded-lg transition-colors', currentPage >= totalPages ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-100']"
          >
            下一页
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <ConfirmModal
      :show="showDeleteModal"
      title="删除文章"
      message="确定要删除这篇文章吗？此操作无法撤销。"
      type="danger"
      confirm-text="删除"
      cancel-text="取消"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useApi, type Post } from '../composables/useApi'
import ConfirmModal from '../components/ConfirmModal.vue'

const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:3002/api'

const { getAllPosts, deletePost, loading } = useApi()

const showDeleteModal = ref(false)
const deleteTargetId = ref<number | null>(null)

const posts = ref<Post[]>([])
const currentFilter = ref<'all' | 'published' | 'draft'>('all')
const searchQuery = ref('')
const currentPage = ref(1)
const total = ref(0)
const totalPages = ref(0)
const limit = 5

let searchTimeout: ReturnType<typeof setTimeout> | null = null

const filters = [
  { label: '全部', value: 'all' as const },
  { label: '已发布', value: 'published' as const },
  { label: '草稿', value: 'draft' as const }
]

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

const getImageUrl = (image: string) => {
  if (image.startsWith('http') || image.startsWith('data:')) return image
  if (image.startsWith('/uploads')) return `${API_BASE.replace('/api', '')}${image}`
  return image
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' })
}

const fetchPosts = async () => {
  const status = currentFilter.value === 'all' ? undefined : currentFilter.value
  const result = await getAllPosts({
    status,
    page: currentPage.value,
    limit,
    search: searchQuery.value || undefined
  })
  posts.value = result.data
  total.value = result.total
  totalPages.value = result.totalPages
}

const debouncedSearch = () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    fetchPosts()
  }, 300)
}

const handleFilterChange = (filter: 'all' | 'published' | 'draft') => {
  currentFilter.value = filter
  currentPage.value = 1
  fetchPosts()
}

const handlePageChange = (page: number) => {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
  fetchPosts()
}

const handleDelete = async (id: number) => {
  deleteTargetId.value = id
  showDeleteModal.value = true
}

const confirmDelete = async () => {
  if (deleteTargetId.value) {
    const success = await deletePost(deleteTargetId.value)
    if (success) {
      fetchPosts()
    }
  }
  showDeleteModal.value = false
  deleteTargetId.value = null
}

const cancelDelete = () => {
  showDeleteModal.value = false
  deleteTargetId.value = null
}

onMounted(fetchPosts)
</script>
