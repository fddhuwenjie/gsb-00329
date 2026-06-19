import { ref } from 'vue'

const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:3002/api'

export type PostStatus = 'draft' | 'published' | 'archived'

export interface Post {
  id: number
  slug: string
  title: string
  excerpt: string | null
  content: string | null
  image: string | null
  category_id: number | null
  author_id: number | null
  status: PostStatus
  read_time: number
  views: number
  likes: number
  created_at: string
  updated_at: string
  category?: string
  category_slug?: string
  category_color?: string
  author_name?: string
  author_avatar?: string
  author_bio?: string
  tags?: string[]
}

export interface PaginatedPosts {
  data: Post[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface Category {
  id: number
  name: string
  slug: string
  icon: string
  color: string
  description: string | null
  count: number
}

export interface Author {
  id: number
  name: string
  avatar: string | null
  bio: string | null
}

export interface Stats {
  total_posts: number
  published_posts: number
  draft_posts: number
  archived_posts: number
  total_views: number
  total_likes: number
  total_categories: number
  total_authors: number
}

export interface UploadResult {
  url: string
  filename: string
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers
    }
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }))
    console.error('API Error:', endpoint, error)
    throw new Error(error.error || error.errors?.[0]?.msg || 'Request failed')
  }
  if (response.status === 204) {
    return undefined as T
  }
  return response.json()
}

export const useApi = () => {
  const loading = ref(false)
  const error = ref<string | null>(null)

  const getAllPosts = async (options?: { status?: PostStatus | PostStatus[], page?: number, limit?: number, search?: string }) => {
    loading.value = true
    error.value = null
    try {
      const params = new URLSearchParams()
      if (options?.status) {
        if (Array.isArray(options.status)) {
          options.status.forEach(s => params.append('status', s))
        } else {
          params.append('status', options.status)
        }
      }
      if (options?.page) params.append('page', options.page.toString())
      if (options?.limit) params.append('limit', options.limit.toString())
      if (options?.search) params.append('search', options.search)
      const queryString = params.toString()
      const url = queryString ? `/posts?${queryString}` : '/posts'
      return await fetchApi<PaginatedPosts>(url)
    } catch (e) {
      error.value = (e as Error).message
      return { data: [], total: 0, page: 1, limit: 20, totalPages: 0 }
    } finally {
      loading.value = false
    }
  }

  const getPostById = async (id: number) => {
    loading.value = true
    error.value = null
    try {
      return await fetchApi<Post>(`/posts/${id}`)
    } catch (e) {
      error.value = (e as Error).message
      return null
    } finally {
      loading.value = false
    }
  }

  const createPost = async (post: Partial<Post>) => {
    loading.value = true
    error.value = null
    console.log('Creating post:', post)
    try {
      const body = JSON.stringify(post)
      console.log('Request body:', body)
      const result = await fetchApi<Post>('/posts', {
        method: 'POST',
        body
      })
      console.log('Post created:', result)
      return result
    } catch (e) {
      console.error('Create post error:', e)
      error.value = (e as Error).message
      throw e
    } finally {
      loading.value = false
    }
  }

  const updatePost = async (id: number, post: Partial<Post>) => {
    loading.value = true
    error.value = null
    try {
      return await fetchApi<Post>(`/posts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(post)
      })
    } catch (e) {
      error.value = (e as Error).message
      throw e
    } finally {
      loading.value = false
    }
  }

  const updatePostStatus = async (id: number, status: PostStatus) => {
    return updatePost(id, { status })
  }

  const batchUpdateStatus = async (ids: number[], status: PostStatus) => {
    loading.value = true
    error.value = null
    try {
      return await fetchApi<{ updated: number }>('/posts/batch-status', {
        method: 'POST',
        body: JSON.stringify({ ids, status })
      })
    } catch (e) {
      error.value = (e as Error).message
      throw e
    } finally {
      loading.value = false
    }
  }

  const deletePost = async (id: number) => {
    loading.value = true
    error.value = null
    try {
      await fetchApi(`/posts/${id}`, { method: 'DELETE' })
      return true
    } catch (e) {
      error.value = (e as Error).message
      return false
    } finally {
      loading.value = false
    }
  }

  const getAllCategories = async () => {
    loading.value = true
    error.value = null
    try {
      return await fetchApi<Category[]>('/categories')
    } catch (e) {
      error.value = (e as Error).message
      return []
    } finally {
      loading.value = false
    }
  }

  const getCategoryById = async (id: number) => {
    loading.value = true
    error.value = null
    try {
      return await fetchApi<Category>(`/categories/${id}`)
    } catch (e) {
      error.value = (e as Error).message
      return null
    } finally {
      loading.value = false
    }
  }

  const createCategory = async (category: Partial<Category>) => {
    loading.value = true
    error.value = null
    try {
      return await fetchApi<Category>('/categories', {
        method: 'POST',
        body: JSON.stringify(category)
      })
    } catch (e) {
      error.value = (e as Error).message
      throw e
    } finally {
      loading.value = false
    }
  }

  const updateCategory = async (id: number, category: Partial<Category>) => {
    loading.value = true
    error.value = null
    try {
      return await fetchApi<Category>(`/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(category)
      })
    } catch (e) {
      error.value = (e as Error).message
      throw e
    } finally {
      loading.value = false
    }
  }

  const deleteCategory = async (id: number) => {
    loading.value = true
    error.value = null
    try {
      await fetchApi(`/categories/${id}`, { method: 'DELETE' })
      return true
    } catch (e) {
      error.value = (e as Error).message
      return false
    } finally {
      loading.value = false
    }
  }

  const getAllAuthors = async () => {
    loading.value = true
    error.value = null
    try {
      return await fetchApi<Author[]>('/authors')
    } catch (e) {
      error.value = (e as Error).message
      return []
    } finally {
      loading.value = false
    }
  }

  const getStats = async () => {
    loading.value = true
    error.value = null
    try {
      return await fetchApi<Stats>('/stats')
    } catch (e) {
      error.value = (e as Error).message
      return null
    } finally {
      loading.value = false
    }
  }

  const uploadImage = async (file: File): Promise<UploadResult | null> => {
    loading.value = true
    error.value = null
    try {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = async () => {
          try {
            const result = await fetchApi<UploadResult>('/upload/image', {
              method: 'POST',
              body: JSON.stringify({
                data: reader.result,
                filename: file.name,
                type: file.type
              })
            })
            resolve(result)
          } catch (e) {
            reject(e)
          }
        }
        reader.onerror = () => reject(new Error('Failed to read file'))
        reader.readAsDataURL(file)
      })
    } catch (e) {
      error.value = (e as Error).message
      return null
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    getAllPosts,
    getPostById,
    createPost,
    updatePost,
    updatePostStatus,
    batchUpdateStatus,
    deletePost,
    getAllCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
    getAllAuthors,
    getStats,
    uploadImage
  }
}
