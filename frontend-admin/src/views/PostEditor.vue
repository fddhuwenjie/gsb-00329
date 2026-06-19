<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <router-link to="/posts" class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </router-link>
        <div>
          <h1 class="text-3xl font-bold text-slate-900">{{ isNew ? '新建文章' : '编辑文章' }}</h1>
          <p class="text-slate-600 mt-1">{{ isNew ? '创建一篇新的博客文章' : '修改文章内容' }}</p>
        </div>
      </div>
      <div class="flex items-center gap-3" v-if="isNew">
        <button @click="handleSave('draft')" :disabled="saving" class="px-4 py-2 bg-white text-slate-700 font-medium rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-50">
          {{ saving ? '保存中...' : '保存草稿' }}
        </button>
        <button @click="handleSave('published')" :disabled="saving" class="px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50">
          {{ saving ? '保存中...' : '发布文章' }}
        </button>
      </div>
      <div class="flex items-center gap-3" v-else>
        <span v-if="form.status" :class="['px-3 py-1 text-sm font-medium rounded', getStatusClass(form.status)]">
          当前状态: {{ getStatusLabel(form.status) }}
        </span>
        <button @click="handleSave('draft')" :disabled="saving" class="px-4 py-2 bg-white text-slate-700 font-medium rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-50">
          {{ saving ? '保存中...' : '保存草稿' }}
        </button>
        <button v-if="form.status !== 'published'" @click="handleSave('published')" :disabled="saving" class="px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50">
          {{ saving ? '保存中...' : '发布文章' }}
        </button>
        <button v-if="form.status === 'published'" @click="handleSave('archived')" :disabled="saving" class="px-4 py-2 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50">
          {{ saving ? '保存中...' : '下线文章' }}
        </button>
        <button v-if="form.status === 'archived'" @click="handleSave('published')" :disabled="saving" class="px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50">
          {{ saving ? '保存中...' : '重新发布' }}
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loadingPost" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
    </div>

    <!-- Editor Form -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Main Content -->
      <div class="lg:col-span-2 space-y-6">
        <div class="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
          <div>
            <label class="block text-sm font-medium text-slate-900 mb-2">标题</label>
            <input
              v-model="form.title"
              type="text"
              class="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="输入文章标题"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-900 mb-2">Slug</label>
            <input
              v-model="form.slug"
              type="text"
              class="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="url-friendly-slug"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-900 mb-2">摘要</label>
            <textarea
              v-model="form.excerpt"
              rows="3"
              class="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
              placeholder="简短描述文章内容"
            ></textarea>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-900 mb-2">内容 (Markdown)</label>
            <textarea
              v-model="form.content"
              rows="20"
              class="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono text-sm"
              placeholder="使用 Markdown 格式编写文章内容..."
            ></textarea>
          </div>
        </div>
      </div>

      <!-- Sidebar -->
      <div class="space-y-6">
        <div class="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
          <div>
            <label class="block text-sm font-medium text-slate-900 mb-2">分类</label>
            <select
              v-model="form.category_id"
              class="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option :value="null">选择分类</option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                {{ cat.name }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-900 mb-2">作者</label>
            <select
              v-model="form.author_id"
              class="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option :value="null">选择作者</option>
              <option v-for="author in authors" :key="author.id" :value="author.id">
                {{ author.name }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-900 mb-2">封面图片</label>
            
            <!-- Upload Area -->
            <div
              @click="triggerFileInput"
              @dragover.prevent="isDragging = true"
              @dragleave.prevent="isDragging = false"
              @drop.prevent="handleDrop"
              :class="['relative border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors', isDragging ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-slate-300']"
            >
              <input
                ref="fileInput"
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                class="hidden"
                @change="handleFileSelect"
              />
              <div v-if="uploading" class="py-4">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
                <p class="text-sm text-slate-500 mt-2">上传中...</p>
              </div>
              <div v-else class="py-4">
                <svg class="w-8 h-8 text-slate-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p class="text-sm text-slate-500 mt-2">点击或拖拽上传图片</p>
                <p class="text-xs text-slate-400 mt-1">支持 JPG, PNG, GIF, WebP (最大 5MB)</p>
              </div>
            </div>

            <!-- URL Input -->
            <div class="mt-3">
              <div class="flex items-center gap-2 text-xs text-slate-400 mb-2">
                <span class="flex-1 border-t border-slate-200"></span>
                <span>或输入图片 URL</span>
                <span class="flex-1 border-t border-slate-200"></span>
              </div>
              <input
                v-model="form.image"
                type="text"
                class="w-full px-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="https://..."
              />
            </div>

            <!-- Preview -->
            <div v-if="imagePreview" class="mt-3 relative">
              <div class="aspect-video bg-slate-100 rounded-lg overflow-hidden">
                <img :src="imagePreview" alt="Preview" class="w-full h-full object-cover" />
              </div>
              <button
                @click="clearImage"
                class="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-900 mb-2">阅读时间 (分钟)</label>
            <input
              v-model.number="form.read_time"
              type="number"
              min="1"
              class="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-900 mb-2">标签 (逗号分隔)</label>
            <input
              v-model="tagsInput"
              type="text"
              class="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="Vue, TypeScript, 前端"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useApi, type Category, type Author, type PostStatus } from '../composables/useApi'
import { useToast } from '../composables/useToast'

const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:3002/api'
const { showError, showSuccess } = useToast()

const route = useRoute()
const router = useRouter()
const { getPostById, createPost, updatePost, getAllCategories, getAllAuthors, uploadImage } = useApi()

const isNew = computed(() => route.params.id === 'new' || route.params.id === undefined)
const postId = computed(() => isNew.value ? null : parseInt(route.params.id as string))

const categories = ref<Category[]>([])
const authors = ref<Author[]>([])
const tagsInput = ref('')
const loadingPost = ref(false)
const saving = ref(false)
const uploading = ref(false)
const isDragging = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

const form = ref({
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  image: '',
  category_id: null as number | null,
  author_id: null as number | null,
  read_time: 5,
  status: 'draft' as PostStatus
})

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

const imagePreview = computed(() => {
  if (!form.value.image) return ''
  if (form.value.image.startsWith('http') || form.value.image.startsWith('data:')) {
    return form.value.image
  }
  if (form.value.image.startsWith('/uploads')) {
    return `${API_BASE.replace('/api', '')}${form.value.image}`
  }
  return form.value.image
})

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    await uploadFile(file)
  }
}

const handleDrop = async (event: DragEvent) => {
  isDragging.value = false
  const file = event.dataTransfer?.files?.[0]
  if (file && file.type.startsWith('image/')) {
    await uploadFile(file)
  }
}

const uploadFile = async (file: File) => {
  if (file.size > 5 * 1024 * 1024) {
    showError('文件大小不能超过 5MB')
    return
  }

  uploading.value = true
  try {
    const result = await uploadImage(file)
    if (result) {
      form.value.image = result.url
    }
  } catch (error) {
    showError('上传失败: ' + (error as Error).message)
  } finally {
    uploading.value = false
  }
}

const clearImage = () => {
  form.value.image = ''
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const handleSave = async (status: PostStatus) => {
  // Validate required fields
  if (!form.value.title.trim()) {
    showError('请输入文章标题')
    return
  }

  const tags = tagsInput.value.split(',').map(t => t.trim()).filter(Boolean)
  
  // Generate slug from title if empty - use timestamp for Chinese titles
  if (!form.value.slug && form.value.title) {
    // Remove Chinese characters and special chars, keep only alphanumeric
    let slug = form.value.title
      .toLowerCase()
      .replace(/[\u4e00-\u9fa5]/g, '') // Remove Chinese characters
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    
    // If slug is empty (all Chinese title), use timestamp
    if (!slug) {
      slug = `post-${Date.now()}`
    }
    form.value.slug = slug
  }
  
  const data = {
    title: form.value.title,
    slug: form.value.slug,
    excerpt: form.value.excerpt || undefined,
    content: form.value.content || undefined,
    image: form.value.image || undefined,
    category_id: form.value.category_id !== null ? form.value.category_id : undefined,
    author_id: form.value.author_id !== null ? form.value.author_id : undefined,
    read_time: form.value.read_time,
    status,
    tags
  }

  console.log('Saving post data:', data)

  saving.value = true
  console.log('Starting save...')
  try {
    if (isNew.value) {
      console.log('Calling createPost...')
      const result = await createPost(data)
      console.log('createPost result:', result)
      showSuccess('文章发布成功')
    } else if (postId.value) {
      await updatePost(postId.value, data)
      showSuccess('文章更新成功')
    }
    console.log('Navigating to /posts...')
    router.push('/posts')
  } catch (error) {
    console.error('Save error:', error)
    showError('保存失败: ' + (error as Error).message)
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  loadingPost.value = true
  try {
    categories.value = await getAllCategories()
    authors.value = await getAllAuthors()

    if (!isNew.value && postId.value) {
      const post = await getPostById(postId.value)
      if (post) {
        form.value = {
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt || '',
          content: post.content || '',
          image: post.image || '',
          category_id: post.category_id,
          author_id: post.author_id,
          read_time: post.read_time,
          status: post.status
        }
        tagsInput.value = (post.tags || []).join(', ')
      }
    }
  } finally {
    loadingPost.value = false
  }
})
</script>
