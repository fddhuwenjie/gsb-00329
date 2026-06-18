import { ref } from 'vue'

const toastVisible = ref(false)
const toastTitle = ref('')
const toastMessage = ref('')

export const useToast = () => {
  const showToast = (feature: string) => {
    toastTitle.value = '功能开发中'
    toastMessage.value = `${feature}功能正在开发中，敬请期待！`
    toastVisible.value = true
  }

  const hideToast = () => {
    toastVisible.value = false
  }

  return {
    toastVisible,
    toastTitle,
    toastMessage,
    showToast,
    hideToast
  }
}
