<template>
  <div v-if="show" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg w-full max-w-md">
      <!-- Header -->
      <div class="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 class="text-lg font-semibold text-gray-900">分享待办事项</h3>
        <button
          @click="$emit('close')"
          class="p-1 text-gray-400 hover:text-gray-600"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div class="p-4">
        <!-- Todo Info -->
        <div class="mb-4 p-3 bg-gray-50 rounded-lg">
          <h4 class="font-medium text-gray-900 mb-1">{{ todo.title }}</h4>
          <p v-if="todo.description" class="text-sm text-gray-600">{{ todo.description }}</p>
        </div>

        <!-- User Search -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            搜索用户（输入手机号）
          </label>
          <input
            v-model="searchQuery"
            @input="searchUsers"
            type="text"
            placeholder="输入手机号搜索用户..."
            class="input-field"
            :disabled="isSearching"
          />
          
          <!-- Search Results -->
          <div v-if="searchResults.length > 0" class="mt-2 border border-gray-200 rounded-lg max-h-40 overflow-y-auto">
            <button
              v-for="user in searchResults"
              :key="user.id"
              @click="selectUser(user)"
              class="w-full px-3 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
            >
              <div class="font-medium text-gray-900">{{ user.phone }}</div>
              <div v-if="user.name" class="text-sm text-gray-500">{{ user.name }}</div>
            </button>
          </div>
        </div>

        <!-- Selected User -->
        <div v-if="selectedUser" class="mb-4 p-3 bg-blue-50 rounded-lg">
          <div class="flex items-center justify-between">
            <div>
              <div class="font-medium text-blue-900">{{ selectedUser.phone }}</div>
              <div v-if="selectedUser.name" class="text-sm text-blue-600">{{ selectedUser.name }}</div>
            </div>
            <button
              @click="selectedUser = null"
              class="text-blue-600 hover:text-blue-800"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>

        <!-- Permission Selection -->
        <div v-if="selectedUser" class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            权限设置
          </label>
          <div class="space-y-2">
            <label class="flex items-center">
              <input
                v-model="permission"
                type="radio"
                value="read"
                class="text-primary-600 focus:ring-primary-500"
              />
              <span class="ml-2 text-sm text-gray-700">只读 - 可查看待办事项</span>
            </label>
            <label class="flex items-center">
              <input
                v-model="permission"
                type="radio"
                value="write"
                class="text-primary-600 focus:ring-primary-500"
              />
              <span class="ml-2 text-sm text-gray-700">编辑 - 可修改待办事项</span>
            </label>
          </div>
        </div>

        <!-- Error Message -->
        <div v-if="errorMessage" class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p class="text-sm text-red-600">{{ errorMessage }}</p>
        </div>
      </div>

      <!-- Footer -->
      <div class="p-4 border-t border-gray-200 flex space-x-3">
        <button
          @click="$emit('close')"
          class="btn-secondary flex-1"
        >
          取消
        </button>
        <button
          @click="shareTodo"
          :disabled="!selectedUser || isSharing"
          class="btn-primary flex-1"
        >
          <svg v-if="isSharing" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {{ isSharing ? '分享中...' : '确认分享' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { api } from '@/utils/api'

const props = defineProps({
  show: Boolean,
  todo: Object
})

const emit = defineEmits(['close', 'shared'])

// State
const searchQuery = ref('')
const searchResults = ref([])
const selectedUser = ref(null)
const permission = ref('read')
const isSearching = ref(false)
const isSharing = ref(false)
const errorMessage = ref('')

let searchTimeout = null

// Methods
async function searchUsers() {
  if (searchQuery.value.length < 3) {
    searchResults.value = []
    return
  }
  
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(async () => {
    isSearching.value = true
    errorMessage.value = ''
    
    try {
      const response = await api.get('/users', {
        params: { q: searchQuery.value }
      })
      
      if (response.success) {
        searchResults.value = response.users
      } else {
        throw new Error(response.error)
      }
    } catch (error) {
      console.error('Search users error:', error)
      errorMessage.value = error.message || '搜索用户失败'
    } finally {
      isSearching.value = false
    }
  }, 300)
}

function selectUser(user) {
  selectedUser.value = user
  searchResults.value = []
  searchQuery.value = user.phone
}

async function shareTodo() {
  if (!selectedUser.value || !props.todo) return
  
  isSharing.value = true
  errorMessage.value = ''
  
  try {
    const response = await api.post('/share', {
      todo_id: props.todo.id,
      user_id: selectedUser.value.id,
      permission: permission.value
    })
    
    if (response.success) {
      emit('shared', {
        user: selectedUser.value,
        permission: permission.value,
        message: response.message
      })
      emit('close')
      resetForm()
    } else {
      throw new Error(response.error)
    }
  } catch (error) {
    console.error('Share todo error:', error)
    errorMessage.value = error.message || '分享失败'
  } finally {
    isSharing.value = false
  }
}

function resetForm() {
  searchQuery.value = ''
  searchResults.value = []
  selectedUser.value = null
  permission.value = 'read'
  errorMessage.value = ''
}

// Watch for modal show/hide
watch(() => props.show, (show) => {
  if (show) {
    resetForm()
  }
})
</script> 