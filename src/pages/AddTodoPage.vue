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
          用自然语言描述您的待办事项，或上传包含日程、预约等信息的图片，AI将自动提取时间、优先级等信息
        </p>

        <!-- Input Method Tabs -->
        <div class="flex space-x-2 mb-4">
          <button
            @click="inputMode = 'text'"
            :class="[
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              inputMode === 'text' 
                ? 'bg-primary-100 text-primary-700 border border-primary-200' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            ]"
          >
            <svg class="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
            </svg>
            文字输入
          </button>
          <button
            @click="inputMode = 'image'"
            :class="[
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              inputMode === 'image'
                ? 'bg-primary-100 text-primary-700 border border-primary-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            ]"
          >
            <svg class="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
            图片识别
          </button>
        </div>

        <!-- Text Input Area -->
        <div v-if="inputMode === 'text'" class="relative">
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

        <!-- Image Upload Area -->
        <div v-if="inputMode === 'image'" class="space-y-4">
          <!-- Upload Area -->
          <div 
            @click="triggerImageUpload"
            @dragover.prevent
            @drop.prevent="handleImageDrop"
            class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-colors"
          >
            <input
              ref="imageInput"
              type="file"
              accept="image/*"
              @change="handleImageSelect"
              class="hidden"
            />
            
            <div v-if="!selectedImage">
              <svg class="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
              <p class="text-lg font-medium text-gray-700 mb-2">上传图片进行识别</p>
              <p class="text-sm text-gray-500 mb-4">支持预约单、通知、票据等包含日程信息的图片</p>
              <div class="flex flex-col sm:flex-row gap-2 justify-center">
                <button
                  @click.stop="triggerImageUpload"
                  class="btn-secondary inline-flex items-center px-4 py-2"
                >
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
                  </svg>
                  选择图片
                </button>
                <button
                  @click.stop="triggerCamera"
                  class="btn-secondary inline-flex items-center px-4 py-2"
                >
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  </svg>
                  拍照
                </button>
              </div>
              <p class="text-xs text-gray-400 mt-2">支持 JPG, PNG, WEBP 格式</p>
            </div>
            
            <!-- Selected Image Preview -->
            <div v-if="selectedImage" class="relative">
              <img 
                :src="selectedImage.preview" 
                :alt="selectedImage.name"
                class="max-w-full max-h-64 mx-auto rounded-lg shadow-md"
              />
              <div class="mt-3 flex items-center justify-center space-x-2">
                <span class="text-sm text-gray-600">{{ selectedImage.name }}</span>
                <button
                  @click.stop="removeSelectedImage"
                  class="text-red-500 hover:text-red-700"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>
          
          <!-- Process Image Button -->
          <button
            @click="processImageWithAI"
            :disabled="!selectedImage || isProcessing"
            class="w-full btn-primary py-3"
          >
            <svg v-if="isProcessing" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ isProcessing ? '识别中...' : '开始识别' }}
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
          
          <!-- Skip button for multiple items -->
          <button
            v-if="allExtractedItems.length > 1"
            @click="skipCurrentTodo"
            class="btn-secondary"
          >
            跳过这个
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
import { ref, reactive, onMounted } from 'vue'
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
const inputMode = ref('text')
const selectedImage = ref(null)
const imageInput = ref(null)
const allExtractedItems = ref([])
const currentItemIndex = ref(0)

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

function skipCurrentTodo() {
  // Check if there are more items to process
  if (allExtractedItems.value.length > 1 && currentItemIndex.value < allExtractedItems.value.length - 1) {
    // Move to next item
    currentItemIndex.value++
    const nextItem = allExtractedItems.value[currentItemIndex.value]
    
    extractedData.value = {
      title: nextItem.title || '',
      description: nextItem.description || '',
      due_date: nextItem.date || dayjs().format('YYYY-MM-DD'),
      due_time: nextItem.time || '',
      priority: nextItem.priority || '一般',
      tags: nextItem.category ? [nextItem.category] : [],
      reminder_enabled: nextItem.reminder_enabled !== false,
      reminder_method: nextItem.reminder_method || '系统通知'
    }
    
    // Update UI to show progress
    aiQuestions.value = [
      `已跳过第 ${currentItemIndex.value} 个待办事项，现在处理第 ${currentItemIndex.value + 1} 个（共 ${allExtractedItems.value.length} 个）`
    ]
  } else {
    // All items processed, go back to calendar
    router.push('/calendar')
  }
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
    
    // Check if there are more items to process
    if (allExtractedItems.value.length > 1 && currentItemIndex.value < allExtractedItems.value.length - 1) {
      // Move to next item
      currentItemIndex.value++
      const nextItem = allExtractedItems.value[currentItemIndex.value]
      
      extractedData.value = {
        title: nextItem.title || '',
        description: nextItem.description || '',
        due_date: nextItem.date || dayjs().format('YYYY-MM-DD'),
        due_time: nextItem.time || '',
        priority: nextItem.priority || '一般',
        tags: nextItem.category ? [nextItem.category] : [],
        reminder_enabled: nextItem.reminder_enabled !== false,
        reminder_method: nextItem.reminder_method || '系统通知'
      }
      
      // Update UI to show progress
      aiQuestions.value = [
        `已创建第 ${currentItemIndex.value} 个待办事项，现在处理第 ${currentItemIndex.value + 1} 个（共 ${allExtractedItems.value.length} 个）`
      ]
    } else {
      // All items processed, go back to calendar
      router.push('/calendar')
    }
  } catch (error) {
    console.error('Create todo error:', error)
    errorMessage.value = error.message || '创建待办事项失败'
  } finally {
    isCreating.value = false
  }
}

// Image handling functions
function triggerImageUpload() {
  imageInput.value?.click()
}

function triggerCamera() {
  if (imageInput.value) {
    imageInput.value.setAttribute('capture', 'camera')
    imageInput.value.click()
    imageInput.value.removeAttribute('capture')
  }
}

function handleImageSelect(event) {
  const file = event.target.files[0]
  if (file) {
    processImageFile(file)
  }
}

function handleImageDrop(event) {
  const file = event.dataTransfer.files[0]
  if (file && file.type.startsWith('image/')) {
    processImageFile(file)
  }
}

function processImageFile(file) {
  // Validate file size (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    errorMessage.value = '图片文件过大，请选择小于10MB的图片'
    return
  }
  
  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
  if (!allowedTypes.includes(file.type)) {
    errorMessage.value = '不支持的图片格式，请选择 JPG、PNG、WEBP 格式的图片'
    return
  }
  
  // Create preview
  const reader = new FileReader()
  reader.onload = (e) => {
    selectedImage.value = {
      file: file,
      name: file.name,
      preview: e.target.result,
      type: file.type
    }
    errorMessage.value = ''
  }
  reader.readAsDataURL(file)
}

function removeSelectedImage() {
  selectedImage.value = null
  if (imageInput.value) {
    imageInput.value.value = ''
  }
}

async function processImageWithAI() {
  if (!selectedImage.value) return
  
  isProcessing.value = true
  errorMessage.value = ''
  
  try {
    // Create FormData for image upload
    const formData = new FormData()
    formData.append('image', selectedImage.value.file)
    if (conversationId.value) {
      formData.append('conversation_id', conversationId.value)
    }
    
    const response = await api.postFormData('/image-parser', formData)
    
    if (response.success) {
      conversationId.value = response.conversation_id
      
      // Process extracted data - handle both single item and array
      if (response.extracted) {
        let extractedItems = Array.isArray(response.extracted) ? response.extracted : [response.extracted]
        
        if (extractedItems.length > 0) {
          // Store all items and reset index
          allExtractedItems.value = extractedItems
          currentItemIndex.value = 0
          
          // Use the first item for the form
          const firstItem = extractedItems[0]
          extractedData.value = {
            title: firstItem.title || '',
            description: firstItem.description || '',
            due_date: firstItem.date || dayjs().format('YYYY-MM-DD'),
            due_time: firstItem.time || '',
            priority: firstItem.priority || '一般',
            tags: firstItem.category ? [firstItem.category] : [],
            reminder_enabled: firstItem.reminder_enabled !== false,
            reminder_method: firstItem.reminder_method || '系统通知'
          }
          
          // If multiple items were extracted, show progress info
          if (extractedItems.length > 1) {
            aiQuestions.value = [
              ...response.questions || [],
              `识别出 ${extractedItems.length} 个待办事项，正在处理第 1 个。创建完成后将自动进入下一个。`
            ]
          } else {
            aiQuestions.value = response.questions || []
          }
        }
      } else {
        aiQuestions.value = response.questions || ['未能从图片中识别出待办事项信息，请确认图片包含日期、时间、事件等相关信息。']
      }
    } else {
      throw new Error(response.error || '图片识别失败')
    }
  } catch (error) {
    console.error('Image processing error:', error)
    errorMessage.value = error.message || '图片识别失败，请重试'
  } finally {
    isProcessing.value = false
  }
}

function resetForm() {
  userInput.value = ''
  aiResponse.value = ''
  extractedData.value = null
  aiQuestions.value = []
  conversationId.value = null
  newTag.value = ''
  selectedImage.value = null
  inputMode.value = 'text'
  errorMessage.value = ''
  allExtractedItems.value = []
  currentItemIndex.value = 0
  if (imageInput.value) {
    imageInput.value.value = ''
  }
}


</script> 