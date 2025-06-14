<template>
  <Teleport to="body">
    <div class="toast-container">
      <TransitionGroup name="toast" tag="div">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          :class="['toast', `toast-${toast.type}`]"
          @click="removeToast(toast.id)"
        >
          <div class="toast-icon">
            <component :is="getIcon(toast.type)" />
          </div>
          <div class="toast-message">{{ toast.message }}</div>
          <button 
            class="toast-close"
            @click.stop="removeToast(toast.id)"
            aria-label="Close notification"
          >
            ×
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useToast } from '@/composables/useToast'

const { toasts, removeToast } = useToast()

const getIcon = (type: string) => {
  const icons = {
    success: () => '✓',
    error: () => '✕',
    warning: () => '⚠',
    info: () => 'ℹ'
  }
  return icons[type as keyof typeof icons] || icons.info
}
</script>

<style scoped lang="scss">
.toast-container {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-width: 400px;
  
  @media (max-width: 640px) {
    top: 0.5rem;
    right: 0.5rem;
    left: 0.5rem;
    max-width: none;
  }
}

.toast {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: var(--surface);
  border-radius: var(--radius);
  box-shadow: var(--shadow-lg);
  border-left: 4px solid;
  cursor: pointer;
  transition: all var(--transition-fast);
  
  &:hover {
    transform: translateX(-4px);
    box-shadow: var(--shadow-xl);
  }
  
  &-success {
    border-left-color: var(--success);
    
    .toast-icon {
      color: var(--success);
    }
  }
  
  &-error {
    border-left-color: var(--danger);
    
    .toast-icon {
      color: var(--danger);
    }
  }
  
  &-warning {
    border-left-color: var(--warning);
    
    .toast-icon {
      color: var(--warning);
    }
  }
  
  &-info {
    border-left-color: var(--primary);
    
    .toast-icon {
      color: var(--primary);
    }
  }
}

.toast-icon {
  font-size: 1.2rem;
  font-weight: bold;
  flex-shrink: 0;
}

.toast-message {
  flex: 1;
  color: var(--text-primary);
  font-size: var(--font-size-sm);
  line-height: 1.4;
}

.toast-close {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 1.5rem;
  line-height: 1;
  padding: 0;
  width: 1.5rem;
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all var(--transition-fast);
  
  &:hover {
    background: var(--bg-secondary);
    color: var(--text-primary);
  }
}

// Toast animations
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.toast-move {
  transition: transform 0.3s ease;
}
</style>
