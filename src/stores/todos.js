import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/utils/api'
import dayjs from 'dayjs'

export const useTodosStore = defineStore('todos', () => {
  // State
  const todos = ref([])
  const isLoading = ref(false)
  const selectedDate = ref(dayjs().format('YYYY-MM-DD'))

  // Getters
  const todosForSelectedDate = computed(() => {
    return todos.value.filter(todo => 
      todo.due_date === selectedDate.value
    ).sort((a, b) => {
      // Sort by priority first, then by time
      const priorityOrder = { '非常紧急': 3, '紧急': 2, '一般': 1 }
      const aPriority = priorityOrder[a.priority] || 1
      const bPriority = priorityOrder[b.priority] || 1
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority
      }
      
      // Sort by time if same priority
      if (a.due_time && b.due_time) {
        return a.due_time.localeCompare(b.due_time)
      }
      
      return 0
    })
  })

  const todosCountByDate = computed(() => {
    const countMap = {}
    todos.value.forEach(todo => {
      if (todo.due_date) {
        countMap[todo.due_date] = (countMap[todo.due_date] || 0) + 1
      }
    })
    return countMap
  })

  const todosByDate = computed(() => {
    const todosMap = {}
    todos.value.forEach(todo => {
      if (todo.due_date) {
        if (!todosMap[todo.due_date]) {
          todosMap[todo.due_date] = []
        }
        todosMap[todo.due_date].push(todo)
      }
    })
    return todosMap
  })

  // Actions
  async function fetchTodos(date = null) {
    isLoading.value = true
    try {
      const params = {}
      if (date) {
        params.date = date
      }
      
      const response = await api.get('/todos', { params })
      
      if (response.success) {
        todos.value = response.todos
      } else {
        throw new Error(response.error || '获取待办事项失败')
      }
    } catch (error) {
      console.error('Fetch todos error:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  async function createTodo(todoData) {
    isLoading.value = true
    try {
      const response = await api.post('/todos', todoData)
      
      if (response.success) {
        todos.value.push(response.todo)
        return response.todo
      } else {
        throw new Error(response.error || '创建待办事项失败')
      }
    } catch (error) {
      console.error('Create todo error:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  async function updateTodo(todoId, updateData) {
    isLoading.value = true
    try {
      const response = await api.put(`/todos/${todoId}`, updateData)
      
      if (response.success) {
        const index = todos.value.findIndex(t => t.id === todoId)
        if (index !== -1) {
          todos.value[index] = response.todo
        }
        return response.todo
      } else {
        throw new Error(response.error || '更新待办事项失败')
      }
    } catch (error) {
      console.error('Update todo error:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  async function deleteTodo(todoId) {
    isLoading.value = true
    try {
      const response = await api.delete(`/todos/${todoId}`)
      
      if (response.success) {
        todos.value = todos.value.filter(t => t.id !== todoId)
        return true
      } else {
        throw new Error(response.error || '删除待办事项失败')
      }
    } catch (error) {
      console.error('Delete todo error:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  async function toggleTodoComplete(todoId) {
    const todo = todos.value.find(t => t.id === todoId)
    if (!todo) return
    
    await updateTodo(todoId, { completed: !todo.completed })
  }

  function setSelectedDate(date) {
    selectedDate.value = date
  }

  return {
    // State
    todos,
    isLoading,
    selectedDate,
    
    // Getters
    todosForSelectedDate,
    todosCountByDate,
    todosByDate,
    
    // Actions
    fetchTodos,
    createTodo,
    updateTodo,
    deleteTodo,
    toggleTodoComplete,
    setSelectedDate
  }
}) 