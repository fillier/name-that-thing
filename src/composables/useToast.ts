import { ref, reactive, readonly } from 'vue'

export interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration?: number
  persistent?: boolean
}

const toasts = reactive<Toast[]>([])
let nextId = 1

export function useToast() {
  const showToast = (
    message: string, 
    type: Toast['type'] = 'info',
    options: { duration?: number; persistent?: boolean } = {}
  ) => {
    const id = `toast-${nextId++}`
    const toast: Toast = {
      id,
      message,
      type,
      duration: options.duration ?? (type === 'error' ? 5000 : 3000),
      persistent: options.persistent ?? false
    }

    toasts.push(toast)

    // Auto-remove toast after duration (unless persistent)
    if (!toast.persistent && toast.duration) {
      setTimeout(() => {
        removeToast(id)
      }, toast.duration)
    }

    return id
  }

  const removeToast = (id: string) => {
    const index = toasts.findIndex(toast => toast.id === id)
    if (index > -1) {
      toasts.splice(index, 1)
    }
  }

  const clearAllToasts = () => {
    toasts.splice(0, toasts.length)
  }

  // Convenience methods
  const success = (message: string, options?: { duration?: number; persistent?: boolean }) => 
    showToast(message, 'success', options)

  const error = (message: string, options?: { duration?: number; persistent?: boolean }) => 
    showToast(message, 'error', options)

  const warning = (message: string, options?: { duration?: number; persistent?: boolean }) => 
    showToast(message, 'warning', options)

  const info = (message: string, options?: { duration?: number; persistent?: boolean }) => 
    showToast(message, 'info', options)

  return {
    toasts: readonly(toasts),
    showToast,
    removeToast,
    clearAllToasts,
    success,
    error,
    warning,
    info
  }
}
