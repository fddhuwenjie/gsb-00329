import { ref } from 'vue'

export type ToastType = 'info' | 'success' | 'error' | 'warning'

const toastVisible = ref(false)
const toastTitle = ref('')
const toastMessage = ref('')
const toastType = ref<ToastType>('info')

export const useToast = () => {
  const showToast = (title: string, message?: string, type: ToastType = 'info') => {
    toastTitle.value = title
    toastMessage.value = message || ''
    toastType.value = type
    toastVisible.value = true
  }

  const showError = (message: string, title = '错误') => {
    showToast(title, message, 'error')
  }

  const showSuccess = (message: string, title = '成功') => {
    showToast(title, message, 'success')
  }

  const showWarning = (message: string, title = '警告') => {
    showToast(title, message, 'warning')
  }

  const showInfo = (message: string, title = '提示') => {
    showToast(title, message, 'info')
  }

  const hideToast = () => {
    toastVisible.value = false
  }

  return {
    toastVisible,
    toastTitle,
    toastMessage,
    toastType,
    showToast,
    showError,
    showSuccess,
    showWarning,
    showInfo,
    hideToast
  }
}
