<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition ease-out duration-300"
      enter-from-class="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
      enter-to-class="opacity-100 translate-y-0 sm:scale-100"
      leave-active-class="transition ease-in duration-200"
      leave-from-class="opacity-100 translate-y-0 sm:scale-100"
      leave-to-class="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
    >
      <div
        v-if="show"
        class="fixed inset-0 z-[9999] flex items-end justify-center px-4 py-6 pointer-events-none sm:items-start sm:justify-end sm:p-6"
      >
        <div class="max-w-sm w-full bg-white rounded-lg shadow-2xl pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden">
          <div class="p-4">
            <div class="flex items-start">
              <div class="flex-shrink-0">
                <!-- Error icon -->
                <svg v-if="type === 'error'" class="h-6 w-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <!-- Success icon -->
                <svg v-else-if="type === 'success'" class="h-6 w-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <!-- Warning icon -->
                <svg v-else-if="type === 'warning'" class="h-6 w-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <!-- Info icon (default) -->
                <svg v-else class="h-6 w-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div class="ml-3 w-0 flex-1 pt-0.5">
                <p class="text-sm font-medium text-slate-900">{{ title }}</p>
                <p v-if="message" class="mt-1 text-sm text-slate-600">{{ message }}</p>
              </div>
              <div class="ml-4 flex-shrink-0 flex">
                <button
                  @click="close"
                  class="bg-white rounded-md inline-flex text-slate-400 hover:text-slate-500 focus:outline-none"
                >
                  <span class="sr-only">关闭</span>
                  <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { watch } from 'vue'

const props = withDefaults(defineProps<{
  show: boolean
  title?: string
  message?: string
  type?: 'info' | 'success' | 'error' | 'warning'
}>(), {
  title: '',
  message: '',
  type: 'info'
})

const emit = defineEmits<{
  close: []
}>()

let timer: ReturnType<typeof setTimeout> | null = null

watch(() => props.show, (newVal) => {
  if (timer) clearTimeout(timer)
  if (newVal) {
    timer = setTimeout(() => {
      close()
    }, 3000)
  }
})

const close = () => {
  emit('close')
}
</script>
