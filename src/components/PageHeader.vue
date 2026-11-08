<script setup>
/** Consistent page title bar with an optional actions slot. */
defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
})
</script>

<template>
  <header class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <h1 class="text-2xl font-bold tracking-tight sm:text-3xl">{{ title }}</h1>
      <p v-if="subtitle" class="mt-1 text-slate-500 dark:text-slate-400">{{ subtitle }}</p>
    </div>
    <div v-if="$slots.default" class="flex flex-wrap items-center gap-2">
      <slot />
    </div>
  </header>
</template>

