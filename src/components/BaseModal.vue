<script setup>
import { nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'
import AppIcon from './AppIcon.vue'

/**
 * Accessible modal dialog used by every modal in the app.
 * - Teleported to <body>, animated with <Transition name="modal">
 * - Closes on Escape and backdrop click
 * - Traps Tab focus inside, restores focus to the trigger on close
 * - Focuses the first `[data-autofocus]` element (or first focusable) on open
 */
const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  size: { type: String, default: 'md' }, // 'sm' | 'md' | 'lg'
})
const emit = defineEmits(['close'])

const panel = ref(null)
const titleId = useId()
const descriptionId = useId()
let previouslyFocused = null

const SIZES = { sm: 'sm:max-w-md', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl' }
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

function focusableElements() {
  return panel.value ? [...panel.value.querySelectorAll(FOCUSABLE)] : []
}

watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen) {
      previouslyFocused = document.activeElement
      document.body.style.overflow = 'hidden'
      await nextTick()
      const target = panel.value?.querySelector('[data-autofocus]') ?? focusableElements()[0]
      target?.focus()
    } else {
      document.body.style.overflow = ''
      // Only restore focus if the trigger is still in the DOM
      if (previouslyFocused?.isConnected) previouslyFocused.focus()
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  document.body.style.overflow = ''
})

function onKeydown(event) {
  if (event.key === 'Escape') {
    event.stopPropagation()
    emit('close')
    return
  }
  // Simple focus trap
  if (event.key === 'Tab') {
    const elements = focusableElements()
    if (!elements.length) return
    const first = elements[0]
    const last = elements[elements.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="open"
        class="modal-root fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
        @keydown="onKeydown"
      >
        <!-- Backdrop -->
        <div
          class="no-print absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          aria-hidden="true"
          @click="emit('close')"
        />

        <!-- Dialog panel -->
        <div
          ref="panel"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titleId"
          :aria-describedby="description ? descriptionId : undefined"
          class="modal-panel relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:rounded-3xl"
          :class="SIZES[size]"
        >
          <header
            class="no-print flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-4 dark:border-slate-800"
          >
            <div>
              <h2 :id="titleId" class="text-lg font-bold">{{ title }}</h2>
              <p v-if="description" :id="descriptionId" class="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                {{ description }}
              </p>
            </div>
            <button type="button" class="btn btn-ghost btn-icon -mr-2" aria-label="Close dialog" @click="emit('close')">
              <AppIcon name="x" />
            </button>
          </header>

          <div class="modal-body scrollbar-thin flex-1 overflow-y-auto px-6 py-5">
            <slot />
          </div>

          <footer
            v-if="$slots.footer"
            class="no-print flex flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/60 sm:flex-row sm:justify-end"
          >
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

