<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm sticky top-0 z-10">
      <div class="px-4 py-3 flex items-center justify-between">
        <div>
          <h1 class="text-xl font-bold text-gray-900">待办日历</h1>
          <p class="text-sm text-gray-500">{{ user?.phone }}</p>
        </div>
        <button
          @click="logout"
          class="p-2 text-gray-500 hover:text-gray-700"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
          </svg>
        </button>
      </div>
    </header>

    <!-- Calendar -->
    <div class="p-4">
      <!-- Month Navigation -->
      <div class="flex items-center justify-between mb-4">
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
      <div class="card p-4 mb-4">
        <!-- Weekday Headers -->
        <div class="grid grid-cols-7 gap-1 mb-2">
          <div v-for="day in weekdays" :key="day" class="text-center text-sm font-medium text-gray-500 py-2">
            {{ day }}
          </div>
        </div>
        
        <!-- Calendar Days -->
        <div class="calendar-grid">
          <button
            v-for="date in calendarDays"
            :key="date.date"
            @click="selectDate(date)"
            class="calendar-day"
            :class="{
              'today': date.isToday,
              'selected': date.date === selectedDate,
              'has-todos': todosCountByDate[date.date] > 0,
              'text-gray-400': !date.isCurrentMonth
            }"
            :disabled="!date.isCurrentMonth"
          >
            {{ date.day }}
          </button>
        </div>
      </div>

      <!-- Todo List for Selected Date -->
      <div class="mb-20">
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
            class="card p-4"
          >
            <div class="flex items-start space-x-3">
              <!-- Checkbox -->
              <button
                @click="toggleComplete(todo.id)"
                class="flex-shrink-0 mt-1"
              >
                <div
                  class="w-5 h-5 rounded border-2 flex items-center justify-center transition-colors"
                  :class="todo.completed ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-green-400'"
                >
                  <svg v-if="todo.completed" class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
              </button>

              <!-- Content -->
              <div class="flex-1">
                <h4 class="font-medium text-gray-900 mb-1" :class="{ 'line-through opacity-60': todo.completed }">
                  {{ todo.title }}
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

    <!-- Floating Add Button -->
    <button
      @click="goToAddTodo"
      class="fixed bottom-6 right-6 w-14 h-14 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 transition-colors flex items-center justify-center z-20"
    >
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
      </svg>
    </button>

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
import dayjs from 'dayjs'

const router = useRouter()
const authStore = useAuthStore()
const todosStore = useTodosStore()

const currentDate = ref(dayjs())
const weekdays = ['日', '一', '二', '三', '四', '五', '六']

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

async function toggleComplete(todoId) {
  try {
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

onMounted(async () => {
  try {
    await todosStore.fetchTodos()
  } catch (error) {
    console.error('Initial fetch error:', error)
  }
})
</script> 