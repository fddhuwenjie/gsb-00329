// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  future: {
    compatibilityVersion: 4
  },
  
  modules: [
    '@nuxt/ui',
    '@vueuse/nuxt',
    '@nuxt/eslint'
  ],

  css: ['~/assets/css/main.css'],

  // Runtime config for API
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:3002/api'
    }
  },

  // SEO 优化配置
  app: {
    head: {
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      title: '博客主站',
      meta: [
        { name: 'description', content: '一个现代化的博客平台' }
      ]
    }
  },

  // 生产环境配置
  nitro: {
    preset: 'node-server',
    compressPublicAssets: true
  },

  // Tailwind CSS v4 配置
  postcss: {
    plugins: {
      '@tailwindcss/postcss': {}
    }
  },

  // 禁用字体提供器以避免网络问题
  fonts: {
    providers: {
      google: false,
      googleicons: false
    }
  }
})
