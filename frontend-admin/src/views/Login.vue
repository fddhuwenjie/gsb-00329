<template>
  <div class="min-h-screen flex">
    <!-- Left Side - Login Form -->
    <div class="flex-1 flex items-center justify-center px-6 py-12 bg-white">
      <div class="w-full max-w-md">
        <div class="mb-8">
          <h1 class="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-2">
            TechBlog 管理
          </h1>
          <p class="text-slate-600">登录以管理你的博客内容</p>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-6">
          <div>
            <label for="username" class="block text-sm font-medium text-slate-900 mb-2">
              用户名
            </label>
            <input
              id="username"
              v-model="form.username"
              type="text"
              required
              class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
              placeholder="输入用户名"
            />
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-slate-900 mb-2">
              密码
            </label>
            <div class="relative">
              <input
                id="password"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                required
                class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                placeholder="输入密码"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <svg v-if="showPassword" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
                <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
            </div>
          </div>

          <div v-if="error" class="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p class="text-sm text-red-600 flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {{ error }}
            </p>
          </div>

          <button
            type="submit"
            :disabled="isLoading"
            class="w-full py-3 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <svg v-if="isLoading" class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ isLoading ? '登录中...' : '登录' }}
          </button>
        </form>


      </div>
    </div>

    <!-- Right Side - Hero -->
    <div class="hidden lg:flex flex-1 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-12 items-center justify-center relative overflow-hidden">
      <div class="absolute inset-0 bg-grid-white/[0.05] bg-[size:32px_32px]"></div>
      <div class="relative z-10 max-w-lg text-white">
        <div class="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full mb-6">
          <span class="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
          <span class="text-sm font-medium">管理后台</span>
        </div>
        <h2 class="text-4xl font-bold mb-6 leading-tight">
          强大的内容<br />
          <span class="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            管理系统
          </span>
        </h2>
        <p class="text-xl text-slate-300 leading-relaxed mb-8">
          轻松管理你的博客文章、分类和用户，打造专业的内容平台
        </p>
        <div class="grid grid-cols-2 gap-4">
          <div class="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div class="text-3xl font-bold mb-1">50+</div>
            <div class="text-sm text-slate-300">文章管理</div>
          </div>
          <div class="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div class="text-3xl font-bold mb-1">12K+</div>
            <div class="text-sm text-slate-300">总浏览量</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/useAuthStore'

const router = useRouter()
const { login, checkAuth } = useAuthStore()

const form = ref({
  username: '',
  password: ''
})

const error = ref('')
const isLoading = ref(false)
const showPassword = ref(false)

onMounted(() => {
  // If already authenticated, redirect to home
  if (checkAuth()) {
    router.push('/')
  }
})

const handleLogin = async () => {
  error.value = ''
  isLoading.value = true

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500))

  if (login(form.value.username, form.value.password)) {
    router.push('/')
  } else {
    error.value = '用户名或密码错误'
  }

  isLoading.value = false
}
</script>

<style scoped>
.bg-grid-white\/\[0\.05\] {
  background-image: linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
}
</style>
