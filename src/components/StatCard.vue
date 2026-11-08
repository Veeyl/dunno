<script setup>
import AppIcon from './AppIcon.vue'

/** KPI tile for the dashboard. */
defineProps({
  label: { type: String, required: true },
  value: { type: String, required: true },
  icon: { type: String, required: true },
  hint: { type: String, default: '' },
  // Optional % change, e.g. 12.5 or -3.2
  trend: { type: Number, default: null },
  tone: { type: String, default: 'primary' }, // 'primary' | 'emerald' | 'amber' | 'sky'
})

const TONES = {
  primary: 'bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400',
  emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
  sky: 'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400',
}
</script>

<template>
  <div class="card flex items-start gap-4 p-5 transition hover:shadow-md">
    <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl" :class="TONES[tone]">
      <AppIcon :name="icon" :size="24" />
    </div>
    <div class="min-w-0">
      <p class="text-sm font-medium text-slate-500 dark:text-slate-400">{{ label }}</p>
      <p class="mt-0.5 truncate text-2xl font-extrabold tabular-nums">{{ value }}</p>
      <p v-if="trend !== null" class="mt-1 flex items-center gap-1 text-xs font-medium" :class="trend >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'">
        <AppIcon :name="trend >= 0 ? 'trending-up' : 'trending-down'" :size="14" />
        {{ trend >= 0 ? '+' : '' }}{{ trend.toFixed(1) }}% vs yesterday
      </p>
      <p v-else-if="hint" class="mt-1 text-xs text-slate-500 dark:text-slate-400">{{ hint }}</p>
    </div>
  </div>
</template>

