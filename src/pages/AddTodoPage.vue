<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm sticky top-0 z-10">
      <div class="px-4 py-3 flex items-center">
        <button
          @click="goBack"
          class="mr-3 p-2 text-gray-500 hover:text-gray-700"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
          </svg>
        </button>
        <h1 class="text-xl font-bold text-gray-900">新建待办事项</h1>
      </div>
    </header>

    <div class="p-4">
      <!-- AI Input Section -->
      <div class="card p-6 mb-6">
        <div class="flex items-center mb-4">
          <div class="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mr-3">
            <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
            </svg>
          </div>
          <h2 class="text-lg font-semibold text-gray-900">AI智能助手</h2>
        </div>
        
        <p class="text-sm text-gray-600 mb-4">
          用自然语言描述您的待办事项，AI将自动提取时间、优先级等信息
        </p>

        <!-- Input Area -->
        <div class="relative">
          <textarea
            v-model="userInput"
            placeholder="例如：明天下午3点和张总开会讨论项目进度，提醒我提前准备会议材料..."
            class="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            :disabled="isProcessing"
          ></textarea>
          
          <button
            @click="processWithAI"
            :disabled="!userInput.trim() || isProcessing"
            class="absolute bottom-3 right-3 btn-primary px-4 py-2 text-sm"
          >
            <svg v-if="isProcessing" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ isProcessing ? '处理中...' : 'AI解析' }}
          </button>
        </div>

        <!-- AI Questions -->
        <div v-if="aiQuestions.length > 0" class="mt-4 p-4 bg-blue-50 rounded-lg">
          <h3 class="text-sm font-medium text-blue-900 mb-2">AI助手需要确认：</h3>
          <div class="space-y-2">
            <p v-for="question in aiQuestions" :key="question" class="text-sm text-blue-800">
              • {{ question }}
            </p>
          </div>
          
          <div class="mt-3">
            <textarea
              v-model="aiResponse"
              placeholder="请回答上述问题..."
              class="w-full h-20 px-3 py-2 text-sm border border-blue-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              :disabled="isProcessing"
            ></textarea>
            
            <div class="flex space-x-2 mt-2">
              <button
                @click="continueAIConversation"
                :disabled="!aiResponse.trim() || isProcessing"
                class="btn-primary text-sm px-4 py-2"
              >
                继续解析
              </button>
              <button
                @click="skipAIQuestions"
                class="btn-secondary text-sm px-4 py-2"
              >
                跳过询问
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Extracted Information -->
      <div v-if="extractedData" class="card p-6 mb-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">提取的信息</h3>
        
        <div class="space-y-4">
          <!-- Title -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">标题 *</label>
            <input
              v-model="extractedData.title"
              type="text"
              class="input-field"
              placeholder="待办事项标题"
            />
          </div>

          <!-- Description -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">描述</label>
            <textarea
              v-model="extractedData.description"
              class="input-field h-20 resize-none"
              placeholder="详细描述"
            ></textarea>
          </div>

          <!-- Date and Time -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">日期</label>
              <input
                v-model="extractedData.due_date"
                type="date"
                class="input-field"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">时间</label>
              <input
                v-model="extractedData.due_time"
                type="time"
                class="input-field"
              />
            </div>
          </div>

          <!-- Priority -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">紧急程度</label>
            <select v-model="extractedData.priority" class="input-field">
              <option value="一般">一般</option>
              <option value="紧急">紧急</option>
              <option value="非常紧急">非常紧急</option>
            </select>
          </div>

          <!-- Tags -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">标签</label>
            <div class="flex flex-wrap gap-2 mb-2">
              <span
                v-for="(tag, index) in extractedData.tags"
                :key="index"
                class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800"
              >
                {{ tag }}
                <button
                  @click="removeTag(index)"
                  class="ml-2 text-primary-600 hover:text-primary-800"
                >
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </span>
            </div>
            <input
              v-model="newTag"
              @keyup.enter="addTag"
              type="text"
              class="input-field"
              placeholder="添加标签，按Enter确认"
            />
          </div>

          <!-- Reminder -->
          <div>
            <label class="flex items-center">
              <input
                v-model="extractedData.reminder_enabled"
                type="checkbox"
                class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span class="ml-2 text-sm text-gray-700">启用提醒</span>
            </label>
            
            <div v-if="extractedData.reminder_enabled" class="mt-2">
              <select v-model="extractedData.reminder_method" class="input-field">
                <option value="系统通知">系统通知</option>
                <option value="短信">短信</option>
                <option value="邮件">邮件</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex space-x-3 mt-6">
          <button
            @click="createTodo"
            :disabled="!extractedData.title?.trim() || isCreating"
            class="btn-primary flex-1"
          >
            <svg v-if="isCreating" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ isCreating ? '创建中...' : '创建待办事项' }}
          </button>
          <button
            @click="resetForm"
            class="btn-secondary"
          >
            重新开始
          </button>
        </div>
      </div>

      <!-- Error Message -->
      <div v-if="errorMessage" class="card p-4 bg-red-50 border-red-200">
        <p class="text-sm text-red-600">{{ errorMessage }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useTodosStore } from '@/stores/todos'
import { api } from '@/utils/api'
import dayjs from 'dayjs'

const router = useRouter()
const todosStore = useTodosStore()

// Form state
const userInput = ref('')
const aiResponse = ref('')
const extractedData = ref(null)
const aiQuestions = ref([])
const conversationId = ref(null)
const newTag = ref('')

// Loading states
const isProcessing = ref(false)
const isCreating = ref(false)
const errorMessage = ref('')

// Methods
function goBack() {
  router.back()
}

async function processWithAI() {
  if (!userInput.value.trim()) return
  
  isProcessing.value = true
  errorMessage.value = ''
  
  try {
    const response = await api.post('/ai-parser', {
      text: userInput.value,
      conversation_id: conversationId.value
    })
    
    if (response.success) {
      conversationId.value = response.conversation_id
      
      if (response.extracted) {
        extractedData.value = {
          title: response.extracted.title || '',
          description: response.extracted.description || '',
          due_date: response.extracted.due_date || dayjs().format('YYYY-MM-DD'),
          due_time: response.extracted.due_time || '',
          priority: response.extracted.priority || '一般',
          tags: response.extracted.tags || [],
          reminder_enabled: response.extracted.reminder_enabled || false,
          reminder_method: response.extracted.reminder_method || '系统通知'
        }
      }
      
      aiQuestions.value = response.questions || []
    } else {
      throw new Error(response.error || 'AI解析失败')
    }
  } catch (error) {
    console.error('AI processing error:', error)
    errorMessage.value = error.message || 'AI解析失败，请重试'
  } finally {
    isProcessing.value = false
  }
}

async function continueAIConversation() {
  if (!aiResponse.value.trim()) return
  
  isProcessing.value = true
  errorMessage.value = ''
  
  try {
    const response = await api.post('/ai-parser', {
      text: aiResponse.value,
      conversation_id: conversationId.value
    })
    
    if (response.success) {
      if (response.extracted) {
        // Update extracted data
        Object.assign(extractedData.value, response.extracted)
      }
      
      aiQuestions.value = response.questions || []
      aiResponse.value = ''
    } else {
      throw new Error(response.error || 'AI解析失败')
    }
  } catch (error) {
    console.error('AI conversation error:', error)
    errorMessage.value = error.message || 'AI对话失败，请重试'
  } finally {
    isProcessing.value = false
  }
}

function skipAIQuestions() {
  aiQuestions.value = []
  aiResponse.value = ''
}

function addTag() {
  if (newTag.value.trim() && !extractedData.value.tags.includes(newTag.value.trim())) {
    extractedData.value.tags.push(newTag.value.trim())
    newTag.value = ''
  }
}

function removeTag(index) {
  extractedData.value.tags.splice(index, 1)
}

async function createTodo() {
  if (!extractedData.value?.title?.trim()) return
  
  isCreating.value = true
  errorMessage.value = ''
  
  try {
    await todosStore.createTodo(extractedData.value)
    router.push('/calendar')
  } catch (error) {
    console.error('Create todo error:', error)
    errorMessage.value = error.message || '创建待办事项失败'
  } finally {
    isCreating.value = false
  }
}

function resetForm() {
  userInput.value = ''
  aiResponse.value = ''
  extractedData.value = null
  aiQuestions.value = []
  conversationId.value = null
  newTag.value = ''
  errorMessage.value = ''
}
</script> 