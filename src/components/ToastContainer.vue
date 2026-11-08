<script setup>
import AppIcon from './AppIcon.vue'
import { useToast } from '@/composables/useToast'

/** Renders the global toast queue (see useToast). */
const { toasts, dismiss } = useToast()

const STYLES = {
  success: { icon: 'check-circle', accent: 'text-emerald-500', bar: 'bg-emerald-500' },
  error: { icon: 'x-circle', accent: 'text-red-500', bar: 'bg-red-500' },
  warning: { icon: 'exclamation-triangle', accent: 'text-amber-500', bar: 'bg-amber-500' },
  info: { icon: 'information-circle', accent: 'text-primary-500', bar: 'bg-primary-500' },
}
</script>

<template>
  <!-- Polite live region so screen readers announce new toasts -->
  <div
    class="no-print pointer-events-none fixed inset-x-0 top-0 z-[60] flex justify-center p-4 sm:inset-x-auto sm:right-0 sm:justify-end"
    aria-live="polite"
    aria-atomic="false"
  >
    <TransitionGroup tag="ul" name="toast" class="relative flex w-full max-w-sm flex-col gap-2">
      <li
        v-for="toast in toasts"
        :key="toast.id"
        class="pointer-events-auto relative flex items-start gap-3 overflow-hidden rounded-2xl border border-slate-200 bg-white/95 p-4 pl-5 shadow-lg backdrop-blur dark:border-slate-700 dark:bg-slate-800/95"
        :role="toast.type === 'error' ? 'alert' : 'status'"
      >
        <span class="absolute inset-y-0 left-0 w-1.5" :class="STYLES[toast.type].bar" aria-hidden="true" />
        <AppIcon :name="STYLES[toast.type].icon" :size="22" :class="STYLES[toast.type].accent" />
        <div class="min-w-0 flex-1 text-sm">
          <p v-if="toast.title" class="font-semibold">{{ toast.title }}</p>
          <p class="text-slate-700 dark:text-slate-200">{{ toast.message }}</p>
        </div>
        <button
          type="button"
          class="-m-1 rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-white"
          aria-label="Dismiss notification"
          @click="dismiss(toast.id)"
        >
          <AppIcon name="x" :size="16" />
        </button>
      </li>
    </TransitionGroup>
  </div>
</template>

