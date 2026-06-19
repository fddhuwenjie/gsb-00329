<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-slate-900">文章管理</h1>
        <p class="text-slate-600 mt-1">管理所有博客文章（草稿、已发布、已下线）</p>
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
      <div class="flex gap-2 flex-wrap">
        <button
          v-for="filter in filters"
          :key="filter.value"
          @click="handleFilterChange(filter.value)"
          :class="['px-4 py-2 text-sm font-medium rounded-lg transition-colors', currentFilter === filter.value ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50']"
        >
          {{ filter.label }}
          <span v-if="filter.count !== undefined" class="ml-1 text-xs opacity-75">({{ filter.count }})</span>
        </button>
      </div>
    </div>

    <!-- Batch Actions Bar -->
    <div v-if="selectedIds.length > 0" class="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <span class="text-blue-700 font-medium">已选择 {{ selectedIds.length }} 篇文章</span>
      </div>
      <div class="flex items-center gap-2">
        <button
          @click="handleBatchStatus('published')"
          class="px-3 py-1.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
        >
          批量发布
        </button>
        <button
          @click="handleBatchStatus('draft')"
          class="px-3 py-1.5 bg-slate-600 text-white text-sm font-medium rounded-lg hover:bg-slate-700 transition-colors"
        >
          批量设为草稿
        </button>
        <button
          @click="handleBatchStatus('archived')"
          class="px-3 py-1.5 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors"
        >
          批量下线
        </button>
        <button
          @click="selectedIds = []"
          class="px-3 py-1.5 text-slate-600 text-sm font-medium hover:bg-blue-100 rounded-lg transition-colors"
        >
          取消选择
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
            <th class="text-left px-4 py-4 w-12">
              <input
                type="checkbox"
                :checked="allSelected"
                @change="toggleSelectAll"
                class="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
            </th>
            <th class="text-left px-4 py-4 text-sm font-semibold text-slate-900">文章</th>
            <th class="text-left px-4 py-4 text-sm font-semibold text-slate-900">分类</th>
            <th class="text-left px-4 py-4 text-sm font-semibold text-slate-900">状态</th>
            <th class="text-left px-4 py-4 text-sm font-semibold text-slate-900">浏览</th>
            <th class="text-left px-4 py-4 text-sm font-semibold text-slate-900">日期</th>
            <th class="text-right px-6 py-4 text-sm font-semibold text-slate-900">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-200">
          <tr v-for="post in posts" :key="post.id" class="hover:bg-slate-50">
            <td class="px-4 py-4">
              <input
                type="checkbox"
                :checked="selectedIds.includes(post.id)"
                @change="toggleSelect(post.id)"
                class="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
            </td>
            <td class="px-4 py-4">
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
            <td class="px-4 py-4">
              <span class="text-sm text-slate-600">{{ post.category || '-' }}</span>
            </td>
            <td class="px-4 py-4">
              <span :class="['px-2 py-1 text-xs font-medium rounded', getStatusClass(post.status)]">
                {{ getStatusLabel(post.status) }}
              </span>
            </td>
            <td class="px-4 py-4">
              <span class="text-sm text-slate-600">{{ post.views }}</span>
            </td>
            <td class="px-4 py-4">
              <span class="text-sm text-slate-600">{{ formatDate(post.created_at) }}</span>
            </td>
            <td class="px-6 py-4 text-right">
              <div class="flex items-center justify-end gap-1">
                <router-link :to="`/posts/${post.id}`" class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors" title="编辑">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </router-link>
                
                <button
                  v-if="post.status === 'published'"
                  @click="handleQuickStatus(post.id, 'archived')"
                  class="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                  title="下线"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                </button>
                <button
                  v-else-if="post.status === 'draft' || post.status === 'archived'"
                  @click="handleQuickStatus(post.id, 'published')"
                  class="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                  title="发布"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </button>
                
                <button
                  @click="handleDelete(post.id)"
                  class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="删除"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="posts.length === 0">
            <td colspan="7" class="px-6 py-12 text-center text-slate-500">
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

    <!-- Status Change Confirmation Modal -->
    <ConfirmModal
      :show="showStatusModal"
      :title="statusModalTitle"
      :message="statusModalMessage"
      :type="statusModalType"
      :confirm-text="statusModalConfirmText"
      cancel-text="取消"
      @confirm="confirmStatusChange"
      @cancel="cancelStatusChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useApi, type Post, type PostStatus } from '../composables/useApi'
import { useToast } from '../composables/useToast'
import ConfirmModal from '../components/ConfirmModal.vue'

const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:3002/api'

const { getAllPosts, updatePostStatus, batchUpdateStatus, deletePost, getStats, loading } = useApi()
const { showSuccess, showError } = useToast()

const showDeleteModal = ref(false)
const deleteTargetId = ref<number | null>(null)
const showStatusModal = ref(false)
const statusTargetIds = ref<number[]>([])
const statusTargetValue = ref<PostStatus>('published')
const isBatchStatus = ref(false)

const posts = ref<Post[]>([])
const currentFilter = ref<'all' | PostStatus>('all')
const searchQuery = ref('')
const currentPage = ref(1)
const total = ref(0)
const totalPages = ref(0)
const limit = 10
const stats = ref({ total_posts: 0, published_posts: 0, draft_posts: 0, archived_posts: 0 })
const selectedIds = ref<number[]>([])

let searchTimeout: ReturnType<typeof setTimeout> | null = null

const filters = computed(() => [
  { label: '全部', value: 'all' as const, count: stats.value.total_posts },
  { label: '已发布', value: 'published' as const, count: stats.value.published_posts },
  { label: '草稿', value: 'draft' as const, count: stats.value.draft_posts },
  { label: '已下线', value: 'archived' as const, count: stats.value.archived_posts }
])

const allSelected = computed(() => {
  return posts.value.length > 0 && posts.value.every(p => selectedIds.value.includes(p.id))
})

const statusModalTitle = computed(() => {
  if (isBatchStatus.value) {
    if (statusTargetValue.value === 'published') return '批量发布文章'
    if (statusTargetValue.value === 'archived') return '批量下线文章'
    return '批量设为草稿'
  }
  if (statusTargetValue.value === 'published') return '发布文章'
  if (statusTargetValue.value === 'archived') return '下线文章'
  return '设为草稿'
})

const statusModalMessage = computed(() => {
  const count = statusTargetIds.value.length
  if (isBatchStatus.value) {
    if (statusTargetValue.value === 'published') return `确定要发布选中的 ${count} 篇文章吗？发布后将在前台可见。`
    if (statusTargetValue.value === 'archived') return `确定要下线选中的 ${count} 篇文章吗？下线后前台将无法访问。`
    return `确定要将选中的 ${count} 篇文章设为草稿吗？`
  }
  if (statusTargetValue.value === 'published') return '确定要发布这篇文章吗？发布后将在前台可见。'
  if (statusTargetValue.value === 'archived') return '确定要下线这篇文章吗？下线后前台将无法访问。'
  return '确定要将这篇文章设为草稿吗？'
})

const statusModalType = computed(() => {
  if (statusTargetValue.value === 'archived') return 'warning'
  return 'info'
})

const statusModalConfirmText = computed(() => {
  if (statusTargetValue.value === 'published') return '发布'
  if (statusTargetValue.value === 'archived') return '下线'
  return '确定'
})

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
  selectedIds.value = []
}

const fetchStats = async () => {
  const s = await getStats()
  if (s) {
    stats.value = s
  }
}

const debouncedSearch = () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    fetchPosts()
  }, 300)
}

const handleFilterChange = (filter: 'all' | PostStatus) => {
  currentFilter.value = filter
  currentPage.value = 1
  fetchPosts()
}

const handlePageChange = (page: number) => {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
  fetchPosts()
}

const toggleSelect = (id: number) => {
  const idx = selectedIds.value.indexOf(id)
  if (idx > -1) {
    selectedIds.value.splice(idx, 1)
  } else {
    selectedIds.value.push(id)
  }
}

const toggleSelectAll = () => {
  if (allSelected.value) {
    selectedIds.value = []
  } else {
    selectedIds.value = posts.value.map(p => p.id)
  }
}

const handleQuickStatus = (id: number, status: PostStatus) => {
  statusTargetIds.value = [id]
  statusTargetValue.value = status
  isBatchStatus.value = false
  showStatusModal.value = true
}

const handleBatchStatus = (status: PostStatus) => {
  if (selectedIds.value.length === 0) return
  statusTargetIds.value = [...selectedIds.value]
  statusTargetValue.value = status
  isBatchStatus.value = true
  showStatusModal.value = true
}

const confirmStatusChange = async () => {
  try {
    if (isBatchStatus.value) {
      await batchUpdateStatus(statusTargetIds.value, statusTargetValue.value)
      showSuccess(`已成功更新 ${statusTargetIds.value.length} 篇文章状态`)
    } else {
      await updatePostStatus(statusTargetIds.value[0], statusTargetValue.value)
      showSuccess('文章状态已更新')
    }
    await Promise.all([fetchPosts(), fetchStats()])
  } catch (e) {
    showError('状态更新失败')
  } finally {
    showStatusModal.value = false
    statusTargetIds.value = []
  }
}

const cancelStatusChange = () => {
  showStatusModal.value = false
  statusTargetIds.value = []
}

const handleDelete = async (id: number) => {
  deleteTargetId.value = id
  showDeleteModal.value = true
}

const confirmDelete = async () => {
  if (deleteTargetId.value) {
    const success = await deletePost(deleteTargetId.value)
    if (success) {
      showSuccess('文章已删除')
      await Promise.all([fetchPosts(), fetchStats()])
    } else {
      showError('删除失败')
    }
  }
  showDeleteModal.value = false
  deleteTargetId.value = null
}

const cancelDelete = () => {
  showDeleteModal.value = false
  deleteTargetId.value = null
}

onMounted(async () => {
  await Promise.all([fetchPosts(), fetchStats()])
})
</script>
