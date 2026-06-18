<template>
  <div id="app" class="min-h-screen bg-slate-50">
    <!-- Login page has no layout -->
    <template v-if="route.path === '/login'">
      <RouterView />
    </template>
    
    <!-- Main layout with sidebar -->
    <template v-else>
      <div class="flex">
        <!-- Sidebar -->
        <aside class="w-64 bg-white border-r border-slate-200 min-h-screen fixed left-0 top-0">
          <div class="p-6">
            <h1 class="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              TechBlog 管理
            </h1>
          </div>
          
          <nav class="px-4 space-y-1">
            <RouterLink
              to="/"
              class="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors"
              :class="route.path === '/' ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              仪表盘
            </RouterLink>
            
            <RouterLink
              to="/posts"
              class="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors"
              :class="route.path.startsWith('/posts') ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              文章管理
            </RouterLink>
            
            <RouterLink
              to="/categories"
              class="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors"
              :class="route.path === '/categories' ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              分类管理
            </RouterLink>
          </nav>
          
          <div class="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200">
            <button
              @click="handleLogout"
              class="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-colors"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              退出登录
            </button>
          </div>
        </aside>
        
        <!-- Main content -->
        <main class="flex-1 ml-64 p-8">
          <RouterView />
        </main>
      </div>
    </template>
    
    <!-- Global Toast -->
    <Toast
      :show="toastVisible"
      :title="toastTitle"
      :message="toastMessage"
      :type="toastType"
      @close="hideToast"
    />
  </div>
</template>

<script setup lang="ts">
import { RouterView, RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from './stores/useAuthStore'
import { useToast } from './composables/useToast'
import Toast from './components/Toast.vue'

const route = useRoute()
const router = useRouter()
const { logout } = useAuthStore()
const { toastVisible, toastTitle, toastMessage, toastType, hideToast } = useToast()

const handleLogout = () => {
  logout()
  router.push('/login')
}
</script>
