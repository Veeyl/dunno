<script setup>
import { computed } from 'vue'
import { useSettingsStore } from '@/stores/useSettingsStore'

/** Colored pill describing a product's stock level. */
const props = defineProps({
  stock: { type: Number, required: true },
  compact: { type: Boolean, default: false },
})
const settings = useSettingsStore()

const level = computed(() => {
  if (props.stock <= 0) return 'out'
  if (props.stock <= settings.lowStockThreshold) return 'low'
  return 'ok'
})

const label = computed(() => {
  if (level.value === 'out') return 'Out of stock'
  if (level.value === 'low') return props.compact ? `${props.stock} left` : `Low · ${props.stock} left`
  return props.compact ? `${props.stock} in stock` : `In stock · ${props.stock}`
})

const CLASSES = {
  ok: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/30',
  low: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/30',
  out: 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/30',
}
</script>

<template>
  <span
    class="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset"
    :class="CLASSES[level]"
  >
    <span v-if="level !== 'ok'" aria-hidden="true">{{ level === 'low' ? '⚠' : '✕' }}</span>
    {{ label }}
  </span>
</template>

