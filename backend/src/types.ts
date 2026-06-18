export interface Category {
  id: number
  name: string
  slug: string
  icon: string
  color: string
  description: string | null
  created_at: string
  count?: number
}

export interface Author {
  id: number
  name: string
  avatar: string | null
  bio: string | null
  created_at: string
}

export interface Post {
  id: number
  slug: string
  title: string
  excerpt: string | null
  content: string | null
  image: string | null
  category_id: number | null
  author_id: number | null
  status: 'draft' | 'published'
  read_time: number
  views: number
  likes: number
  created_at: string
  updated_at: string
  // Joined fields
  category?: string
  category_slug?: string
  category_color?: string
  author_name?: string
  author_avatar?: string
  author_bio?: string
  tags?: string[]
}

export interface Tag {
  id: number
  name: string
}

export interface CreatePostInput {
  title: string
  slug: string
  excerpt?: string
  content?: string
  image?: string
  category_id?: number
  author_id?: number
  status?: 'draft' | 'published'
  read_time?: number
  tags?: string[]
}

export interface UpdatePostInput {
  title?: string
  slug?: string
  excerpt?: string
  content?: string
  image?: string
  category_id?: number
  author_id?: number
  status?: 'draft' | 'published'
  read_time?: number
  tags?: string[]
}

export interface CreateCategoryInput {
  name: string
  slug: string
  icon?: string
  color?: string
  description?: string
}

export interface UpdateCategoryInput {
  name?: string
  slug?: string
  icon?: string
  color?: string
  description?: string
}
