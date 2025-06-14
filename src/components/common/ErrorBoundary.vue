<template>
  <div v-if="hasError" class="error-boundary">
    <div class="error-content">
      <div class="error-icon">⚠️</div>
      <h2>Something went wrong</h2>
      <p>{{ errorMessage }}</p>
      <div class="error-actions">
        <button @click="retry" class="btn btn-primary">
          Try Again
        </button>
        <button @click="reload" class="btn btn-secondary">
          Reload Page
        </button>
      </div>
    </div>
  </div>
  <slot v-else />
</template>

<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue'

interface Props {
  fallbackMessage?: string
}

const props = withDefaults(defineProps<Props>(), {
  fallbackMessage: 'An unexpected error occurred. Please try again.'
})

const emit = defineEmits<{
  error: [error: Error]
  retry: []
}>()

const hasError = ref(false)
const errorMessage = ref('')

const handleError = (error: Error) => {
  hasError.value = true
  errorMessage.value = error.message || props.fallbackMessage
  emit('error', error)
  
  // Log error for debugging
  console.error('ErrorBoundary caught error:', error)
}

const retry = () => {
  hasError.value = false
  errorMessage.value = ''
  emit('retry')
}

const reload = () => {
  window.location.reload()
}

onErrorCaptured((error) => {
  handleError(error)
  return false // Prevent error propagation
})
</script>

<style scoped lang="scss">
.error-boundary {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-primary);
  padding: var(--spacing-xl);
}

.error-content {
  text-align: center;
  max-width: 500px;
  background: var(--surface);
  padding: var(--spacing-2xl);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
}

.error-icon {
  font-size: 4rem;
  margin-bottom: var(--spacing-lg);
}

h2 {
  color: var(--text-primary);
  margin: 0 0 var(--spacing-md) 0;
  font-size: var(--font-size-2xl);
  font-weight: var(--font-semibold);
}

p {
  color: var(--text-secondary);
  margin: 0 0 var(--spacing-xl) 0;
  line-height: var(--leading-relaxed);
}

.error-actions {
  display: flex;
  gap: var(--spacing-md);
  justify-content: center;
  flex-wrap: wrap;
}
</style>
