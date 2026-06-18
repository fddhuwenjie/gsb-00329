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
                <svg class="h-6 w-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div class="ml-3 w-0 flex-1 pt-0.5">
                <p class="text-sm font-medium text-slate-900">{{ title }}</p>
                <p class="mt-1 text-sm text-slate-600">{{ message }}</p>
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
import { ref, watch } from 'vue'

const props = defineProps<{
  show: boolean
  title?: string
  message?: string
}>()

const emit = defineEmits<{
  close: []
}>()

const show = ref(props.show)

watch(() => props.show, (newVal) => {
  show.value = newVal
  if (newVal) {
    setTimeout(() => {
      close()
    }, 3000)
  }
})

const close = () => {
  show.value = false
  emit('close')
}
</script>
