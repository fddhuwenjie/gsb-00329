import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    // 串行执行，避免多个 worker 同时往同一 sqlite 文件写造成误判。
    fileParallelism: false,
    testTimeout: 20000,
  },
})
