import { ref, computed } from 'vue'

interface User {
  id: number
  username: string
  name: string
  avatar: string
  role: 'admin' | 'editor'
}

const currentUser = ref<User | null>(null)

export const useAuthStore = () => {
  const isAuthenticated = computed(() => currentUser.value !== null)

  const login = (username: string, password: string): boolean => {
    // Mock authentication
    if (username === 'admin' && password === 'admin123') {
      currentUser.value = {
        id: 1,
        username: 'admin',
        name: '管理员',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
        role: 'admin'
      }
      // Store in localStorage
      localStorage.setItem('user', JSON.stringify(currentUser.value))
      return true
    }
    return false
  }

  const logout = () => {
    currentUser.value = null
    localStorage.removeItem('user')
  }

  const checkAuth = (): boolean => {
    const stored = localStorage.getItem('user')
    if (stored) {
      try {
        currentUser.value = JSON.parse(stored)
        return true
      } catch {
        localStorage.removeItem('user')
      }
    }
    return false
  }

  return {
    currentUser,
    isAuthenticated,
    login,
    logout,
    checkAuth
  }
}
