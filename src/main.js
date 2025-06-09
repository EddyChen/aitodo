import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'

import App from './App.vue'
import './style.css'

// Import stores
import { useAuthStore } from './stores/auth'

// Import components
import LoginPage from './pages/LoginPage.vue'
import CalendarPage from './pages/CalendarPage.vue'
import AddTodoPage from './pages/AddTodoPage.vue'

// Router configuration
const routes = [
  { 
    path: '/', 
    redirect: '/calendar' 
  },
  { 
    path: '/login', 
    component: LoginPage, 
    name: 'login' 
  },
  { 
    path: '/calendar', 
    component: CalendarPage, 
    name: 'calendar',
    meta: { requiresAuth: true }
  },
  { 
    path: '/add-todo', 
    component: AddTodoPage, 
    name: 'add-todo',
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guard for authentication
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else if (to.path === '/login' && authStore.isAuthenticated) {
    next('/calendar')
  } else {
    next()
  }
})

// Create app
const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Initialize auth state from localStorage
const authStore = useAuthStore()
authStore.initFromStorage()

// Hide loading screen
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    const loading = document.getElementById('loading')
    if (loading) {
      loading.style.display = 'none'
    }
  }, 500)
})

app.mount('#app') 