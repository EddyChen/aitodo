import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/utils/api'

export const useAuthStore = defineStore('auth', () => {
  // State
  const token = ref(null)
  const user = ref(null)
  const isLoading = ref(false)

  // Getters
  const isAuthenticated = computed(() => !!token.value)

  // Actions
  function initFromStorage() {
    const savedToken = localStorage.getItem('auth_token')
    const savedUser = localStorage.getItem('auth_user')
    
    if (savedToken && savedUser) {
      token.value = savedToken
      user.value = JSON.parse(savedUser)
      api.setAuthToken(savedToken)
    }
  }

  async function sendVerificationCode(phone) {
    isLoading.value = true
    try {
      const response = await api.post('/auth', {
        phone,
        action: 'login'
      })
      
      if (response.success) {
        return { success: true, code: response.debug_code }
      } else {
        throw new Error(response.error || '发送验证码失败')
      }
    } catch (error) {
      console.error('Send verification code error:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  async function verifyAndLogin(phone, code) {
    isLoading.value = true
    try {
      // For demo purposes, we'll skip code verification
      const response = await api.post('/auth', {
        phone,
        action: 'verify'
      })
      
      if (response.success) {
        token.value = response.token
        user.value = response.user
        
        // Save to localStorage
        localStorage.setItem('auth_token', response.token)
        localStorage.setItem('auth_user', JSON.stringify(response.user))
        
        // Set API auth token
        api.setAuthToken(response.token)
        
        return { success: true }
      } else {
        throw new Error(response.error || '登录失败')
      }
    } catch (error) {
      console.error('Login error:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  function logout() {
    token.value = null
    user.value = null
    
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    
    api.setAuthToken(null)
  }

  return {
    // State
    token,
    user,
    isLoading,
    
    // Getters
    isAuthenticated,
    
    // Actions
    initFromStorage,
    sendVerificationCode,
    verifyAndLogin,
    logout
  }
}) 