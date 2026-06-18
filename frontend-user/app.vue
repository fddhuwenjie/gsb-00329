<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
useHead({
  titleTemplate: '%s - TechBlog',
  meta: [
    { name: 'description', content: '一个现代化的博客平台，分享技术与生活' }
  ]
})
</script>
