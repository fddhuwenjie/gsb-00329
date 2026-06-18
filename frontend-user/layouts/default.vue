<template>
  <div class="min-h-screen flex flex-col bg-slate-50">
    <!-- Header -->
    <header class="bg-white border-b border-slate-200 sticky top-0 z-40 backdrop-blur-sm bg-white/90">
      <nav class="max-w-7xl mx-auto px-6 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-12">
            <NuxtLink to="/" class="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              TechBlog
            </NuxtLink>
            <div class="hidden md:flex items-center gap-8">
              <NuxtLink to="/" class="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors" active-class="!text-slate-900">首页</NuxtLink>
              <NuxtLink to="/posts" class="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors" active-class="!text-slate-900">文章</NuxtLink>
              <NuxtLink to="/categories" class="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors" active-class="!text-slate-900">分类</NuxtLink>
              <NuxtLink to="/about" class="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors" active-class="!text-slate-900">关于</NuxtLink>
            </div>
          </div>
          <div class="flex items-center gap-4">
            <NuxtLink to="/search" class="hidden md:block px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              搜索
            </NuxtLink>
          </div>
        </div>
      </nav>
    </header>

    <!-- Main Content -->
    <main class="flex-1">
      <slot />
    </main>

    <!-- Footer -->
    <footer class="bg-slate-900 text-slate-400 mt-auto">
      <div class="max-w-7xl mx-auto px-6 py-12">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 class="text-white font-bold text-lg mb-4">TechBlog</h3>
            <p class="text-sm leading-relaxed">
              分享前端技术，探索开发之美
            </p>
          </div>
          <div>
            <h4 class="text-white font-semibold mb-4">分类</h4>
            <ul class="space-y-2 text-sm">
              <li><NuxtLink to="/categories/frontend" class="hover:text-white transition-colors">前端开发</NuxtLink></li>
              <li><NuxtLink to="/categories/devops" class="hover:text-white transition-colors">DevOps</NuxtLink></li>
              <li><NuxtLink to="/categories/typescript" class="hover:text-white transition-colors">TypeScript</NuxtLink></li>
            </ul>
          </div>
          <div>
            <h4 class="text-white font-semibold mb-4">关于</h4>
            <ul class="space-y-2 text-sm">
              <li><NuxtLink to="/about#mission" class="hover:text-white transition-colors">关于我们</NuxtLink></li>
              <li><NuxtLink to="/about#contact" class="hover:text-white transition-colors">联系方式</NuxtLink></li>
              <li><NuxtLink to="/about#privacy" class="hover:text-white transition-colors">隐私政策</NuxtLink></li>
            </ul>
          </div>
          <div>
            <h4 class="text-white font-semibold mb-4">关注我们</h4>
            <div class="flex gap-4">
              <a href="https://twitter.com" target="_blank" rel="noopener" class="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors">
                <span class="text-lg">𝕏</span>
              </a>
              <a href="https://github.com" target="_blank" rel="noopener" class="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors">
                <span class="text-lg">G</span>
              </a>
            </div>
          </div>
        </div>
        <div class="pt-8 border-t border-slate-800 text-sm text-center">
          <p>© 2024 TechBlog. 保留所有权利.</p>
        </div>
      </div>
    </footer>
  </div>
</template>
