<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <!-- Logo and Title -->
      <div class="text-center mb-8">
        <div class="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
          <svg class="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
          </svg>
        </div>
        <h1 class="text-3xl font-bold text-white mb-2">AI智能待办助理</h1>
        <p class="text-blue-100">让AI帮您管理每一个重要任务</p>
      </div>

      <!-- Login Form -->
      <div class="card p-6">
        <form @submit.prevent="handleSubmit">
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              手机号码
            </label>
            <input
              v-model="phone"
              type="tel"
              maxlength="11"
              placeholder="请输入手机号码"
              class="input-field"
              :class="{ 'border-red-500': phoneError }"
              :disabled="isLoading"
            />
            <p v-if="phoneError" class="mt-1 text-sm text-red-600">{{ phoneError }}</p>
          </div>

          <!-- Show verification code input after sending code -->
          <div v-if="codeSent" class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              验证码
            </label>
            <input
              v-model="verificationCode"
              type="text"
              maxlength="6"
              placeholder="请输入验证码"
              class="input-field"
              :class="{ 'border-red-500': codeError }"
              :disabled="isLoading"
            />
            <p v-if="codeError" class="mt-1 text-sm text-red-600">{{ codeError }}</p>
            <p v-if="debugCode" class="mt-1 text-sm text-blue-600">
              调试验证码: {{ debugCode }}
            </p>
          </div>

          <button
            type="submit"
            class="btn-primary w-full"
            :disabled="isLoading"
          >
            <div v-if="isLoading" class="flex items-center justify-center">
              <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ codeSent ? '登录中...' : '发送中...' }}
            </div>
            <span v-else>
              {{ codeSent ? '登录' : '发送验证码' }}
            </span>
          </button>

          <p v-if="errorMessage" class="mt-4 text-sm text-red-600 text-center">
            {{ errorMessage }}
          </p>
        </form>

        <!-- Back button for verification step -->
        <button
          v-if="codeSent && !isLoading"
          @click="resetForm"
          class="mt-4 w-full text-center text-sm text-gray-500 hover:text-gray-700"
        >
          重新发送验证码
        </button>
      </div>

      <!-- Features -->
      <div class="mt-8 text-center">
        <p class="text-blue-100 text-sm mb-4">产品特色</p>
        <div class="flex justify-center space-x-6">
          <div class="text-center">
            <div class="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center mx-auto mb-2">
              <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
            </div>
            <p class="text-xs text-blue-100">AI智能解析</p>
          </div>
          <div class="text-center">
            <div class="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center mx-auto mb-2">
              <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
            </div>
            <p class="text-xs text-blue-100">日历管理</p>
          </div>
          <div class="text-center">
            <div class="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center mx-auto mb-2">
              <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
            </div>
            <p class="text-xs text-blue-100">多人协作</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

// Form state
const phone = ref('')
const verificationCode = ref('')
const codeSent = ref(false)
const debugCode = ref('')
const errorMessage = ref('')
const phoneError = ref('')
const codeError = ref('')

// Phone validation
function validatePhone(phoneNumber) {
  const phoneRegex = /^1[3-9]\d{9}$/
  return phoneRegex.test(phoneNumber)
}

// Reset form
function resetForm() {
  codeSent.value = false
  verificationCode.value = ''
  debugCode.value = ''
  errorMessage.value = ''
  codeError.value = ''
}

// Handle form submission
async function handleSubmit() {
  // Clear errors
  phoneError.value = ''
  codeError.value = ''
  errorMessage.value = ''

  // Validate phone
  if (!validatePhone(phone.value)) {
    phoneError.value = '请输入正确的手机号码'
    return
  }

  try {
    if (!codeSent.value) {
      // Send verification code
      const result = await authStore.sendVerificationCode(phone.value)
      if (result.success) {
        codeSent.value = true
        debugCode.value = result.code // For demo purposes
      }
    } else {
      // Verify code and login
      if (!verificationCode.value || verificationCode.value.length !== 6) {
        codeError.value = '请输入6位验证码'
        return
      }

      const result = await authStore.verifyAndLogin(phone.value, verificationCode.value)
      if (result.success) {
        router.push('/calendar')
      }
    }
  } catch (error) {
    errorMessage.value = error.message || '操作失败，请重试'
  }
}

// Loading state from store
const isLoading = computed(() => authStore.isLoading)
</script> 