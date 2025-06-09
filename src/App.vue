<template>
  <div id="app" class="mobile-container">
    <ErrorBoundary>
      <router-view />
    </ErrorBoundary>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from './stores/auth'
import ErrorBoundary from './components/ErrorBoundary.vue'

const authStore = useAuthStore()

onMounted(() => {
  // Hide loading screen when Vue app is ready
  const loading = document.getElementById('loading')
  if (loading) {
    setTimeout(() => {
      loading.style.display = 'none'
    }, 100)
  }
})
</script>

<style scoped>
#app {
  min-height: 100vh;
}
</style> 