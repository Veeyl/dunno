<script setup>
/** Friendly placeholder for empty lists and "no results" states. */
defineProps({
  emoji: { type: String, default: '📭' },
  title: { type: String, required: true },
  description: { type: String, default: '' },
})
</script>

<template>
  <div class="flex flex-col items-center justify-center px-6 py-12 text-center" role="status">
    <div
      class="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-4xl dark:bg-slate-800"
      aria-hidden="true"
    >
      {{ emoji }}
    </div>
    <p class="text-base font-semibold">{{ title }}</p>
    <p v-if="description" class="mt-1 max-w-xs text-sm text-slate-500 dark:text-slate-400">{{ description }}</p>
    <div v-if="$slots.default" class="mt-4">
      <slot />
    </div>
  </div>
</template>

