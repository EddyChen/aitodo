<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-gradient-to-r from-blue-500 to-blue-600 sticky top-0 z-10">
      <div class="px-4 py-4 flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <!-- User Avatar -->
          <div class="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
            </svg>
          </div>
          <!-- User Info -->
          <div>
            <h1 class="text-lg font-bold text-white">{{ user?.phone || '用户' }}</h1>
            <p class="text-sm text-blue-100">待办日历</p>
          </div>
        </div>
        <button
          @click="logout"
          class="p-2 text-blue-100 hover:text-white"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
          </svg>
        </button>
      </div>
    </header>

    <!-- Calendar -->
    <div class="py-4">
      <!-- Month Navigation -->
      <div class="flex items-center justify-between mb-4 px-4">
        <button
          @click="previousMonth"
          class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
          </svg>
        </button>
        
        <h2 class="text-lg font-semibold text-gray-900">
          {{ currentMonthYear }}
        </h2>
        
        <button
          @click="nextMonth"
          class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </button>
      </div>

      <!-- Calendar Grid -->
      <div class="mb-4">
        <!-- Weekday Headers -->
        <div class="grid grid-cols-7 gap-3 mb-3">
          <div 
            v-for="(day, index) in weekdays" 
            :key="day" 
            class="text-center text-sm font-medium py-2"
            :class="index === 0 || index === 6 ? 'text-red-500' : 'text-gray-500'"
          >
            {{ day }}
          </div>
        </div>
        
        <!-- Calendar Days -->
        <div class="calendar-grid-large">
          <div
            v-for="date in calendarDays"
            :key="date.date"
            @click="selectDate(date)"
            class="calendar-day"
            :class="{
              'today': date.isToday,
              'selected': date.date === selectedDate,
              'has-todos': todosCountByDate[date.date] > 0,
              'text-gray-400': !date.isCurrentMonth,
              'work-day': date.isCurrentMonth && getDateType(date.date) === 'work-day',
              'rest-day': date.isCurrentMonth && getDateType(date.date) === 'rest-day'
            }"
            :disabled="!date.isCurrentMonth"
          >
            <!-- Day number -->
            <div class="calendar-day-content">
              <span class="calendar-day-number">{{ date.day }}</span>
              <span class="calendar-lunar-date">{{ getLunarDate(date.date) }}</span>
              
              <!-- Todo count -->
              <div v-if="todosCountByDate[date.date] > 0" class="calendar-todo-count">
                {{ getUncompletedTodoCount(date.date) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Todo List for Selected Date -->
      <div class="mb-20 px-4">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-lg font-semibold text-gray-900">
            {{ selectedDateFormatted }}
          </h3>
          <span class="text-sm text-gray-500">
            {{ todosForSelectedDate.length }} 项任务
          </span>
        </div>

        <!-- Empty State -->
        <div v-if="todosForSelectedDate.length === 0" class="text-center py-12">
          <svg class="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
          </svg>
          <p class="text-gray-500 mb-4">这一天还没有待办事项</p>
          <button
            @click="goToAddTodo"
            class="btn-primary"
          >
            添加第一个任务
          </button>
        </div>

        <!-- Todo Items -->
        <div v-else class="space-y-3">
          <div
            v-for="todo in todosForSelectedDate"
            :key="todo.id"
            class="card p-4 border-l-4 border-green-500"
          >
            <div class="flex items-start space-x-3">
              <!-- Checkbox or Read-only indicator -->
              <div v-if="canEditTodo(todo)" class="flex-shrink-0 mt-1">
                <button
                  @click="toggleComplete(todo.id)"
                  class="w-5 h-5 rounded border-2 flex items-center justify-center transition-colors"
                  :class="todo.completed ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-green-400'"
                >
                  <svg v-if="todo.completed" class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </button>
              </div>
              <!-- Read-only indicator -->
              <div v-else class="flex-shrink-0 mt-1 w-5 h-5 flex items-center justify-center">
                <svg v-if="todo.completed" class="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <svg v-else class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                </svg>
              </div>

              <!-- Content -->
              <div class="flex-1">
                <h4 class="font-medium text-gray-900 mb-1" :class="{ 'line-through opacity-60': todo.completed }">
                  {{ todo.title }}
                  <!-- Shared from indicator -->
                  <span v-if="todo.user_relation === 'shared'" class="ml-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                    来自 {{ todo.creator_phone }}
                  </span>
                </h4>
                <p v-if="todo.description" class="text-sm text-gray-600 mb-2" :class="{ 'line-through opacity-60': todo.completed }">
                  {{ todo.description }}
                </p>
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-2">
                    <span
                      class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                      :class="getPriorityClass(todo.priority)"
                    >
                      {{ todo.priority }}
                    </span>
                    <span v-if="todo.due_time" class="text-xs text-gray-500">
                      {{ todo.due_time }}
                    </span>
                  </div>
                  
                  <!-- Share button (only for own todos) -->
                  <button
                    v-if="todo.creator_id === user?.id"
                    @click="openShareModal(todo)"
                    class="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"></path>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Floating Action Button -->
    <div class="fixed bottom-6 right-6 z-20">
      <!-- Main Add Button -->
      <button
        @click="goToAddTodo"
        class="w-14 h-14 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 transition-colors flex items-center justify-center"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
        </svg>
      </button>
    </div>

    <!-- Share Modal -->
    <ShareModal
      :show="showShareModal"
      :todo="selectedTodoForShare"
      @close="closeShareModal"
      @shared="onTodoShared"
    />

    <!-- Success Message -->
    <div v-if="successMessage" class="fixed top-4 left-4 right-4 bg-green-500 text-white p-4 rounded-lg shadow-lg z-50">
      <p class="text-center">{{ successMessage }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useTodosStore } from '@/stores/todos'
import ShareModal from '@/components/ShareModal.vue'
import { api } from '@/utils/api'
import dayjs from 'dayjs'

const router = useRouter()
const authStore = useAuthStore()
const todosStore = useTodosStore()

const currentDate = ref(dayjs())
const weekdays = ['日', '一', '二', '三', '四', '五', '六']

// Holiday data
const holidayData = ref({})
const loadingHolidays = ref(false)

// Share modal state
const showShareModal = ref(false)
const selectedTodoForShare = ref(null)
const successMessage = ref('')

const user = computed(() => authStore.user)
const selectedDate = computed(() => todosStore.selectedDate)
const todosForSelectedDate = computed(() => todosStore.todosForSelectedDate)
const todosCountByDate = computed(() => todosStore.todosCountByDate)

const currentMonthYear = computed(() => {
  return currentDate.value.format('YYYY年MM月')
})

const selectedDateFormatted = computed(() => {
  return dayjs(selectedDate.value).format('M月D日 dddd')
})

const calendarDays = computed(() => {
  const startOfMonth = currentDate.value.startOf('month')
  const endOfMonth = currentDate.value.endOf('month')
  const startOfCalendar = startOfMonth.startOf('week')
  const endOfCalendar = endOfMonth.endOf('week')
  
  const days = []
  let day = startOfCalendar
  
  while (day.isBefore(endOfCalendar) || day.isSame(endOfCalendar, 'day')) {
    days.push({
      date: day.format('YYYY-MM-DD'),
      day: day.date(),
      isCurrentMonth: day.isSame(currentDate.value, 'month'),
      isToday: day.isSame(dayjs(), 'day')
    })
    day = day.add(1, 'day')
  }
  
  return days
})

function previousMonth() {
  currentDate.value = currentDate.value.subtract(1, 'month')
}

function nextMonth() {
  currentDate.value = currentDate.value.add(1, 'month')
}

function selectDate(date) {
  if (date.isCurrentMonth) {
    todosStore.setSelectedDate(date.date)
  }
}

function getPriorityClass(priority) {
  switch (priority) {
    case '非常紧急':
      return 'priority-critical'
    case '紧急':
      return 'priority-urgent'
    default:
      return 'priority-normal'
  }
}

function canEditTodo(todo) {
  // Owner can always edit
  if (todo.creator_id === user.value?.id) {
    return true
  }
  // Shared todo with write permission
  if (todo.user_relation === 'shared' && todo.shared_permission === 'write') {
    return true
  }
  return false
}

async function toggleComplete(todoId) {
  try {
    const todo = todosForSelectedDate.value.find(t => t.id === todoId)
    if (!canEditTodo(todo)) {
      console.warn('No permission to edit this todo')
      return
    }
    await todosStore.toggleTodoComplete(todoId)
  } catch (error) {
    console.error('Toggle todo error:', error)
  }
}

function goToAddTodo() {
  router.push('/add-todo')
}

function logout() {
  authStore.logout()
  router.push('/login')
}

function openShareModal(todo) {
  selectedTodoForShare.value = todo
  showShareModal.value = true
}

function closeShareModal() {
  showShareModal.value = false
  selectedTodoForShare.value = null
}

function onTodoShared(shareInfo) {
  successMessage.value = shareInfo.message
  setTimeout(() => {
    successMessage.value = ''
  }, 3000)
}

// Holiday-related functions
async function fetchHolidayData(year, month = null) {
  if (loadingHolidays.value) return
  
  try {
    loadingHolidays.value = true
    const response = await api.getHolidays(year, month)
    
    if (response.holidays) {
      // 直接使用返回的节假日数据
      Object.assign(holidayData.value, response.holidays)
      console.log(`Loaded holiday data for ${response.year}:`, Object.keys(response.holidays).length, 'special dates')
    }
  } catch (error) {
    console.error('Failed to fetch holiday data:', error)
  } finally {
    loadingHolidays.value = false
  }
}

function getDateType(dateStr) {
  const holidayInfo = holidayData.value[dateStr]
  const dayOfWeek = dayjs(dateStr).day()
  
  if (holidayInfo) {
    console.log(`Date ${dateStr}:`, holidayInfo)
    
    // 简化颜色方案：
    // - 休息日：法定节假日 + 双休日 = 蓝色
    // - 工作日：普通工作日 + 调休工作日 = 绿色
    
    if (holidayInfo.isOffDay === true) {
      return 'rest-day'  // 法定节假日 -> 蓝色
    } else if (holidayInfo.isOffDay === false) {
      return 'work-day'  // 调休工作日 -> 绿色
    }
  }
  
  // 没有特殊安排的日期，按自然规律判断
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return 'rest-day'  // 双休日 -> 蓝色
  } else {
    return 'work-day'  // 普通工作日 -> 绿色
  }
}

function getUncompletedTodoCount(dateStr) {
  const todos = todosStore.todosByDate[dateStr] || []
  return todos.filter(todo => !todo.completed).length
}

// 简单的农历转换函数
function getLunarDate(dateStr) {
  const date = dayjs(dateStr)
  const day = date.date()
  
  // 简单的农历显示逻辑（这里只是示例，实际应该使用专门的农历库）
  const lunarNumbers = ['', '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十', 
                       '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
                       '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十']
  
  // 这里使用简化的逻辑，实际应该使用准确的农历转换算法
  // 为了演示，我们基于阳历日期做简单的映射
  const lunarDay = ((day + 10) % 30) + 1
  return lunarNumbers[lunarDay] || '初一'
}

// Watch currentDate changes to fetch holiday data
watch(currentDate, async (newDate) => {
  const year = newDate.year()
  await fetchHolidayData(year)
}, { immediate: false })

onMounted(async () => {
  try {
    await todosStore.fetchTodos()
    // Fetch holiday data for current year
    const year = currentDate.value.year()
    await fetchHolidayData(year)
  } catch (error) {
    console.error('Initial fetch error:', error)
  }
})


</script> 