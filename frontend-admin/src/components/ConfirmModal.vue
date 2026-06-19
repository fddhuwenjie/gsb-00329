<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="show" class="fixed inset-0 z-[9999] overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4">
          <!-- Backdrop -->
          <div class="fixed inset-0 bg-black/50 transition-opacity" @click="handleCancel"></div>
          
          <!-- Modal -->
          <Transition
            enter-active-class="transition ease-out duration-200"
            enter-from-class="opacity-0 scale-95"
            enter-to-class="opacity-100 scale-100"
            leave-active-class="transition ease-in duration-150"
            leave-from-class="opacity-100 scale-100"
            leave-to-class="opacity-0 scale-95"
          >
            <div v-if="show" class="relative bg-white rounded-xl shadow-2xl max-w-md w-full p-6 transform">
              <div class="flex items-start gap-4">
                <!-- Icon -->
                <div :class="['flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center', iconBgClass]">
                  <svg v-if="type === 'danger'" class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <svg v-else-if="type === 'warning'" class="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <svg v-else class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                
                <!-- Content -->
                <div class="flex-1">
                  <h3 class="text-lg font-semibold text-slate-900">{{ title }}</h3>
                  <p class="mt-2 text-sm text-slate-600">{{ message }}</p>
                </div>
              </div>
              
              <!-- Actions -->
              <div class="mt-6 flex gap-3 justify-end">
                <button
                  @click="handleCancel"
                  class="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  {{ cancelText }}
                </button>
                <button
                  @click="handleConfirm"
                  :class="['px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors', confirmBtnClass]"
                >
                  {{ confirmText }}
                </button>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  show: boolean
  title?: string
  message?: string
  type?: 'danger' | 'info' | 'warning'
  confirmText?: string
  cancelText?: string
}>(), {
  title: '确认操作',
  message: '确定要执行此操作吗？',
  type: 'info',
  confirmText: '确定',
  cancelText: '取消'
})

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const iconBgClass = computed(() => {
  if (props.type === 'danger') return 'bg-red-100'
  if (props.type === 'warning') return 'bg-amber-100'
  return 'bg-blue-100'
})

const confirmBtnClass = computed(() => {
  if (props.type === 'danger') return 'bg-red-600 hover:bg-red-700'
  if (props.type === 'warning') return 'bg-amber-600 hover:bg-amber-700'
  return 'bg-emerald-600 hover:bg-emerald-700'
})

const handleConfirm = () => {
  emit('confirm')
}

const handleCancel = () => {
  emit('cancel')
}
</script>
