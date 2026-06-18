<template>
  <div>
    <!-- Hero Section -->
    <section class="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
      <div class="absolute inset-0 bg-grid-white/[0.05] bg-[size:32px_32px]"></div>
      <div class="relative max-w-7xl mx-auto px-6 py-20 md:py-28">
        <div class="max-w-3xl mx-auto text-center">
          <h1 class="text-5xl md:text-6xl font-bold mb-6">
            关于 TechBlog
          </h1>
          <p class="text-xl text-slate-300 leading-relaxed">
            一个专注于前端技术的博客平台，分享技术心得、探索最佳实践
          </p>
        </div>
      </div>
    </section>

    <!-- Mission Section -->
    <section id="mission" class="max-w-4xl mx-auto px-6 py-16 scroll-mt-20">
      <div class="prose prose-lg prose-slate max-w-none">
        <h2 class="text-3xl font-bold text-slate-900 mb-6">我们的使命</h2>
        <p class="text-slate-600 leading-relaxed mb-6">
          TechBlog 创立于 2024 年，致力于为中文开发者社区提供高质量的技术内容。我们相信，知识的分享能够推动整个行业的进步。
        </p>
        <p class="text-slate-600 leading-relaxed mb-6">
          在这里，你可以找到关于 Vue、React、TypeScript、CSS、DevOps 等领域的深度文章。我们注重实践，每一篇文章都力求做到理论与实践相结合。
        </p>
      </div>
    </section>

    <!-- Features Section -->
    <section class="bg-white py-16">
      <div class="max-w-7xl mx-auto px-6">
        <h2 class="text-3xl font-bold text-slate-900 mb-12 text-center">为什么选择我们</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div class="text-center p-8">
            <div class="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 class="text-xl font-bold text-slate-900 mb-3">深度内容</h3>
            <p class="text-slate-600">不止于表面，每篇文章都深入探讨技术原理和最佳实践</p>
          </div>
          <div class="text-center p-8">
            <div class="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg class="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 class="text-xl font-bold text-slate-900 mb-3">持续更新</h3>
            <p class="text-slate-600">紧跟技术发展，每周发布新的技术文章和教程</p>
          </div>
          <div class="text-center p-8">
            <div class="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg class="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 class="text-xl font-bold text-slate-900 mb-3">社区驱动</h3>
            <p class="text-slate-600">开放的社区，欢迎投稿、讨论和建议</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Team Section -->
    <section class="max-w-7xl mx-auto px-6 py-16">
      <h2 class="text-3xl font-bold text-slate-900 mb-12 text-center">核心团队</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div v-for="member in teamMembers" :key="member.name" class="bg-white rounded-2xl border border-slate-200 p-8 text-center hover:shadow-xl transition-shadow">
          <img :src="member.avatar" :alt="member.name" class="w-24 h-24 rounded-full mx-auto mb-6 bg-slate-100" />
          <h3 class="text-xl font-bold text-slate-900 mb-1">{{ member.name }}</h3>
          <p class="text-emerald-600 font-medium mb-4">{{ member.role }}</p>
          <p class="text-slate-600 text-sm">{{ member.bio }}</p>
        </div>
      </div>
    </section>

    <!-- Stats Section -->
    <section class="bg-gradient-to-br from-slate-900 to-slate-800 text-white py-16">
      <div class="max-w-7xl mx-auto px-6">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div class="text-5xl font-bold mb-2">{{ stats?.published_posts || 0 }}+</div>
            <div class="text-slate-300">技术文章</div>
          </div>
          <div>
            <div class="text-5xl font-bold mb-2">{{ formatViews(stats?.total_views || 0) }}</div>
            <div class="text-slate-300">总浏览量</div>
          </div>
          <div>
            <div class="text-5xl font-bold mb-2">500+</div>
            <div class="text-slate-300">订阅读者</div>
          </div>
          <div>
            <div class="text-5xl font-bold mb-2">{{ stats?.total_categories || 0 }}</div>
            <div class="text-slate-300">技术分类</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Contact Section -->
    <section id="contact" class="max-w-4xl mx-auto px-6 py-16 scroll-mt-20">
      <div class="bg-white rounded-2xl border border-slate-200 p-8 md:p-12">
        <h2 class="text-3xl font-bold text-slate-900 mb-6 text-center">联系我们</h2>
        <p class="text-slate-600 text-center mb-8">
          有任何问题、建议或合作意向？欢迎与我们联系
        </p>
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-slate-900 mb-2">姓名</label>
              <input
                v-model="contactForm.name"
                type="text"
                required
                class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                placeholder="你的姓名"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-900 mb-2">邮箱</label>
              <input
                v-model="contactForm.email"
                type="email"
                required
                class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                placeholder="your@email.com"
              />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-900 mb-2">消息</label>
            <textarea
              v-model="contactForm.message"
              rows="4"
              required
              class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent resize-none"
              placeholder="你想说的话..."
            ></textarea>
          </div>
          <button
            type="submit"
            class="w-full py-3 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-all"
          >
            发送消息
          </button>
        </form>
      </div>
    </section>

    <!-- Toast -->
    <Toast :show="toastVisible" :title="toastTitle" :message="toastMessage" @close="toastVisible = false" />

    <!-- Privacy Policy Section -->
    <section id="privacy" class="bg-slate-50 py-16 scroll-mt-20">
      <div class="max-w-4xl mx-auto px-6">
        <h2 class="text-3xl font-bold text-slate-900 mb-8 text-center">隐私政策</h2>
        <div class="bg-white rounded-2xl border border-slate-200 p-8 md:p-12 prose prose-slate max-w-none">
          <h3 class="text-xl font-semibold text-slate-900 mb-4">信息收集</h3>
          <p class="text-slate-600 mb-6">
            我们仅收集您主动提供的信息，如联系表单中的姓名和邮箱地址。我们不会在未经您同意的情况下收集任何个人信息。
          </p>
          
          <h3 class="text-xl font-semibold text-slate-900 mb-4">信息使用</h3>
          <p class="text-slate-600 mb-6">
            您提供的信息仅用于回复您的咨询和改善我们的服务。我们不会将您的信息出售或分享给第三方。
          </p>
          
          <h3 class="text-xl font-semibold text-slate-900 mb-4">Cookie 使用</h3>
          <p class="text-slate-600 mb-6">
            我们使用 Cookie 来改善您的浏览体验，包括记住您的偏好设置和分析网站流量。您可以在浏览器设置中禁用 Cookie。
          </p>
          
          <h3 class="text-xl font-semibold text-slate-900 mb-4">数据安全</h3>
          <p class="text-slate-600 mb-6">
            我们采取适当的安全措施来保护您的个人信息，防止未经授权的访问、披露或修改。
          </p>
          
          <h3 class="text-xl font-semibold text-slate-900 mb-4">联系我们</h3>
          <p class="text-slate-600">
            如果您对我们的隐私政策有任何疑问，请通过上方的联系表单与我们联系。
          </p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import Toast from '~/components/Toast.vue'
import { useApi } from '~/composables/useApi'

const { getStats } = useApi()
const stats = await getStats()

useHead({
  title: '关于我们 - TechBlog',
  meta: [
    { name: 'description', content: '了解 TechBlog - 一个专注于前端技术的博客平台' }
  ]
})

const teamMembers = [
  {
    name: '张三',
    role: '创始人 & 主编',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangsan',
    bio: '10年前端开发经验，专注于 Web 性能优化和架构设计'
  },
  {
    name: '李四',
    role: '技术编辑',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lisi',
    bio: '全栈开发者，Vue.js 和 Nuxt.js 核心贡献者'
  },
  {
    name: '王五',
    role: '设计负责人',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wangwu',
    bio: 'UI/UX 设计师，热爱用设计解决问题'
  }
]

const formatViews = (views: number) => {
  if (views >= 1000) {
    return `${(views / 1000).toFixed(1)}K+`
  }
  return `${views}+`
}

const contactForm = ref({
  name: '',
  email: '',
  message: ''
})

const toastVisible = ref(false)
const toastTitle = ref('')
const toastMessage = ref('')

const handleSubmit = () => {
  toastTitle.value = '发送成功！'
  toastMessage.value = '感谢您的留言，我们会尽快回复您'
  toastVisible.value = true
  contactForm.value = { name: '', email: '', message: '' }
}
</script>

<style scoped>
.bg-grid-white\/\[0\.05\] {
  background-image: linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
}
</style>
