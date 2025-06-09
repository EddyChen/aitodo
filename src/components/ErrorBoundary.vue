<template>
  <div v-if="hasError" class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div class="text-center">
      <svg class="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.864-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
      </svg>
      <h1 class="text-2xl font-bold text-gray-900 mb-2">出错了</h1>
      <p class="text-gray-600 mb-6">应用遇到了一个错误，请刷新页面重试</p>
      <div class="space-y-3">
        <button
          @click="retry"
          class="btn-primary"
        >
          重新加载
        </button>
        <br />
        <button
          @click="goHome"
          class="btn-secondary"
        >
          返回首页
        </button>
      </div>
      
      <!-- Error Details (for development) -->
      <details v-if="isDevelopment" class="mt-6 text-left">
        <summary class="cursor-pointer text-gray-500 mb-2">查看错误详情</summary>
        <pre class="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">{{ errorInfo }}</pre>
      </details>
    </div>
  </div>
  
  <slot v-else />
</template>

<script setup>
import { ref, onErrorCaptured } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const hasError = ref(false)
const errorInfo = ref('')
const isDevelopment = ref(import.meta.env.DEV)

onErrorCaptured((error, instance, info) => {
  console.error('Error captured by boundary:', error)
  hasError.value = true
  errorInfo.value = `${error.message}\n\nStack trace:\n${error.stack}\n\nComponent info:\n${info}`
  
  // Report error to monitoring service in production
  if (!isDevelopment.value) {
    // reportError(error, instance, info)
  }
  
  return false // Prevent error from propagating
})

function retry() {
  hasError.value = false
  errorInfo.value = ''
  window.location.reload()
}

function goHome() {
  hasError.value = false
  errorInfo.value = ''
  router.push('/')
}
</script> 