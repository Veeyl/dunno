import { ref } from 'vue'

/**
 * Global toast notifications.
 *
 * State lives at module level so every component calling `useToast()` shares
 * the same queue, and <ToastContainer> renders it.
 */
const toasts = ref([])
let nextId = 1
const MAX_VISIBLE = 5

export function useToast() {
  function dismiss(id) {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  /**
   * @param {string} message
   * @param {{ type?: 'success'|'error'|'warning'|'info', title?: string, duration?: number }} options
   */
  function show(message, { type = 'info', title = '', duration = 3000 } = {}) {
    const id = nextId++
    toasts.value.push({ id, message, type, title })
    if (toasts.value.length > MAX_VISIBLE) toasts.value.shift()
    if (duration > 0) setTimeout(() => dismiss(id), duration)
    return id
  }

  return {
    toasts,
    show,
    dismiss,
    success: (message, options) => show(message, { ...options, type: 'success' }),
    error: (message, options) => show(message, { duration: 4000, ...options, type: 'error' }),
    warning: (message, options) => show(message, { duration: 5000, ...options, type: 'warning' }),
    info: (message, options) => show(message, { ...options, type: 'info' }),
  }
}

