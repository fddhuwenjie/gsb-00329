<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-slate-900">分类管理</h1>
        <p class="text-slate-600 mt-1">管理文章分类</p>
      </div>
      <button @click="openModal()" class="px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        新建分类
      </button>
    </div>

    <!-- Categories Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="category in categories"
        :key="category.id"
        class="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow"
      >
        <div class="flex items-start justify-between mb-4">
          <div class="text-4xl">{{ category.icon }}</div>
          <div class="flex gap-2">
            <button @click="openModal(category)" class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button @click="handleDelete(category.id)" class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
        <h3 class="text-xl font-bold text-slate-900 mb-2">{{ category.name }}</h3>
        <p class="text-slate-600 text-sm mb-4 line-clamp-2">{{ category.description }}</p>
        <div class="flex items-center justify-between text-sm">
          <span class="text-slate-500">{{ category.count }} 篇文章</span>
          <span class="text-slate-400">/{{ category.slug }}</span>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="showModal = false">
      <div class="bg-white rounded-xl p-6 w-full max-w-md">
        <h2 class="text-xl font-bold text-slate-900 mb-6">{{ editingCategory ? '编辑分类' : '新建分类' }}</h2>
        <form @submit.prevent="handleSave" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-900 mb-2">名称</label>
            <input
              v-model="form.name"
              type="text"
              required
              class="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="分类名称"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-900 mb-2">Slug</label>
            <input
              v-model="form.slug"
              type="text"
              required
              class="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="url-slug"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-900 mb-2">图标 (Emoji)</label>
            <input
              v-model="form.icon"
              type="text"
              class="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="💻"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-900 mb-2">描述</label>
            <textarea
              v-model="form.description"
              rows="3"
              class="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              placeholder="分类描述"
            ></textarea>
          </div>
          <div class="flex gap-3 pt-4">
            <button type="button" @click="showModal = false" class="flex-1 px-4 py-3 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-colors">
              取消
            </button>
            <button type="submit" class="flex-1 px-4 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors">
              保存
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <ConfirmModal
      :show="showDeleteModal"
      title="删除分类"
      message="确定要删除这个分类吗？此操作无法撤销。"
      type="danger"
      confirm-text="删除"
      cancel-text="取消"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useApi, type Category } from '../composables/useApi'
import { useToast } from '../composables/useToast'
import ConfirmModal from '../components/ConfirmModal.vue'

const { getAllCategories, createCategory, updateCategory, deleteCategory } = useApi()
const { showError, showSuccess } = useToast()

const showDeleteModal = ref(false)
const deleteTargetId = ref<number | null>(null)

const categories = ref<Category[]>([])
const showModal = ref(false)
const editingCategory = ref<Category | null>(null)

const form = ref({
  name: '',
  slug: '',
  icon: '📁',
  description: ''
})

const openModal = (category?: Category) => {
  if (category) {
    editingCategory.value = category
    form.value = {
      name: category.name,
      slug: category.slug,
      icon: category.icon,
      description: category.description || ''
    }
  } else {
    editingCategory.value = null
    form.value = { name: '', slug: '', icon: '📁', description: '' }
  }
  showModal.value = true
}

const handleSave = async () => {
  try {
    if (editingCategory.value) {
      await updateCategory(editingCategory.value.id, form.value)
      showSuccess('分类更新成功')
    } else {
      await createCategory(form.value)
      showSuccess('分类创建成功')
    }
    categories.value = await getAllCategories()
    showModal.value = false
  } catch (error) {
    showError('保存失败: ' + (error as Error).message)
  }
}

const handleDelete = async (id: number) => {
  deleteTargetId.value = id
  showDeleteModal.value = true
}

const confirmDelete = async () => {
  if (deleteTargetId.value) {
    try {
      const success = await deleteCategory(deleteTargetId.value)
      if (success) {
        categories.value = categories.value.filter(c => c.id !== deleteTargetId.value)
        showSuccess('分类删除成功')
      } else {
        showError('删除失败，请重试')
      }
    } catch (error) {
      showError('删除失败: ' + (error as Error).message)
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
  categories.value = await getAllCategories()
})
</script>
