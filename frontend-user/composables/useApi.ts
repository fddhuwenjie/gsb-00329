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
  total_views: number
  total_likes: number
  total_categories: number
  total_authors: number
}

export interface PaginatedPosts {
  data: Post[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// Color mapping for categories
const categoryColorMap: Record<string, string> = {
  frontend: 'bg-blue-500 text-white',
  css: 'bg-pink-500 text-white',
  vue: 'bg-emerald-500 text-white',
  devops: 'bg-orange-500 text-white',
  typescript: 'bg-indigo-500 text-white',
  tools: 'bg-purple-500 text-white',
  performance: 'bg-red-500 text-white'
}

function getCategoryColor(slug: string | undefined): string {
  return categoryColorMap[slug || ''] || 'bg-slate-500 text-white'
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
}

function getImageUrl(image: string | null, apiBase: string): string | null {
  if (!image) return null
  if (image.startsWith('http') || image.startsWith('data:')) return image
  if (image.startsWith('/uploads')) {
    // Remove /api from apiBase to get the server base URL
    const serverBase = apiBase.replace('/api', '')
    return `${serverBase}${image}`
  }
  return image
}

function transformPost(post: Post, apiBase: string): Post {
  return {
    ...post,
    image: getImageUrl(post.image, apiBase),
    category_color: getCategoryColor(post.category_slug)
  }
}

export const useApi = () => {
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBase

  // Posts - use $fetch for fresh data
  const getAllPosts = async (status?: 'draft' | 'published') => {
    try {
      const url = status ? `${apiBase}/posts?status=${status}` : `${apiBase}/posts`
      const response = await $fetch<{ data: Post[] } | Post[]>(url)
      // Handle both paginated and non-paginated responses
      const data = Array.isArray(response) ? response : response.data
      return (data || []).map(p => transformPost(p, apiBase))
    } catch (e) {
      console.error('Failed to fetch posts:', e)
      return []
    }
  }

  // Posts with pagination
  const getAllPostsPaginated = async (options?: { status?: 'draft' | 'published', page?: number, limit?: number }) => {
    try {
      const params = new URLSearchParams()
      if (options?.status) params.append('status', options.status)
      if (options?.page) params.append('page', options.page.toString())
      if (options?.limit) params.append('limit', options.limit.toString())
      const queryString = params.toString()
      const url = queryString ? `${apiBase}/posts?${queryString}` : `${apiBase}/posts`
      const response = await $fetch<PaginatedPosts>(url)
      return {
        ...response,
        data: (response.data || []).map(p => transformPost(p, apiBase))
      }
    } catch (e) {
      console.error('Failed to fetch posts:', e)
      return { data: [], total: 0, page: 1, limit: 20, totalPages: 0 }
    }
  }

  const getPostBySlug = async (slug: string) => {
    try {
      const data = await $fetch<Post>(`${apiBase}/posts/slug/${slug}`)
      return data ? transformPost(data, apiBase) : null
    } catch (e) {
      console.error('Failed to fetch post:', e)
      return null
    }
  }

  const getPostsByCategory = async (categorySlug: string) => {
    try {
      const data = await $fetch<Post[]>(`${apiBase}/posts/category/${categorySlug}`)
      return (data || []).map(p => transformPost(p, apiBase))
    } catch (e) {
      console.error('Failed to fetch posts by category:', e)
      return []
    }
  }

  const searchPosts = async (query: string) => {
    try {
      const data = await $fetch<Post[]>(`${apiBase}/posts/search?q=${encodeURIComponent(query)}`)
      return (data || []).map(p => transformPost(p, apiBase))
    } catch (e) {
      console.error('Failed to search posts:', e)
      return []
    }
  }

  const getRelatedPosts = async (postId: number, limit = 3) => {
    try {
      const data = await $fetch<Post[]>(`${apiBase}/posts/${postId}/related?limit=${limit}`)
      return (data || []).map(p => transformPost(p, apiBase))
    } catch (e) {
      console.error('Failed to fetch related posts:', e)
      return []
    }
  }

  const incrementViews = async (postId: number) => {
    try {
      await $fetch(`${apiBase}/posts/${postId}/view`, { method: 'POST' })
    } catch (e) {
      console.error('Failed to increment views:', e)
    }
  }

  const incrementLikes = async (postId: number) => {
    try {
      await $fetch(`${apiBase}/posts/${postId}/like`, { method: 'POST' })
      return true
    } catch (e) {
      console.error('Failed to increment likes:', e)
      return false
    }
  }

  // Categories - use $fetch for fresh data
  const getAllCategories = async () => {
    try {
      const data = await $fetch<Category[]>(`${apiBase}/categories`)
      return data || []
    } catch (e) {
      console.error('Failed to fetch categories:', e)
      return []
    }
  }

  const getCategoryBySlug = async (slug: string) => {
    try {
      const data = await $fetch<Category>(`${apiBase}/categories/slug/${slug}`)
      return data
    } catch (e) {
      console.error('Failed to fetch category:', e)
      return null
    }
  }

  // Stats
  const getStats = async () => {
    try {
      const data = await $fetch<Stats>(`${apiBase}/stats`)
      return data
    } catch (e) {
      console.error('Failed to fetch stats:', e)
      return null
    }
  }

  return {
    getAllPosts,
    getAllPostsPaginated,
    getPostBySlug,
    getPostsByCategory,
    searchPosts,
    getRelatedPosts,
    incrementViews,
    incrementLikes,
    getAllCategories,
    getCategoryBySlug,
    getStats,
    formatDate,
    getCategoryColor
  }
}
