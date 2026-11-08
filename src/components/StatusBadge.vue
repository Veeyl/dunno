<script setup>
/** Status pill for orders. */
defineProps({
  status: { type: String, required: true }, // 'completed' | 'refunded'
})

const CLASSES = {
  completed:
    'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/30',
  refunded: 'bg-slate-100 text-slate-600 ring-slate-500/20 dark:bg-slate-700/50 dark:text-slate-300 dark:ring-slate-500/30',
}
const DOTS = { completed: 'bg-emerald-500', refunded: 'bg-slate-400' }
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ring-1 ring-inset"
    :class="CLASSES[status]"
  >
    <span class="h-1.5 w-1.5 rounded-full" :class="DOTS[status]" aria-hidden="true" />
    {{ status }}
  </span>
</template>

