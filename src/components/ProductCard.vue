<script setup>
import { computed } from 'vue'
import StockBadge from './StockBadge.vue'
import { useCurrency } from '@/composables/useCurrency'

/** A tappable product tile on the POS grid. Emits `add` when clicked. */
const props = defineProps({
  product: { type: Object, required: true },
  inCart: { type: Number, default: 0 },
})
const emit = defineEmits(['add'])
const { formatCurrency } = useCurrency()

const isOutOfStock = computed(() => props.product.stock <= 0)

const ariaLabel = computed(() => {
  const { name, price, stock } = props.product
  const stockText = isOutOfStock.value ? 'Out of stock' : `${stock} in stock`
  const cartText = props.inCart ? `, ${props.inCart} in cart` : ''
  return `Add ${name}, ${formatCurrency(price)}, ${stockText}${cartText}`
})
</script>

<template>
  <button
    type="button"
    class="group relative flex h-full w-full flex-col rounded-2xl border bg-white p-3 text-left shadow-sm transition-all duration-200 dark:bg-slate-900 sm:p-4"
    :class="
      isOutOfStock
        ? 'cursor-not-allowed border-slate-200 opacity-55 grayscale dark:border-slate-800'
        : 'border-slate-200 hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-lg hover:shadow-primary-500/10 active:translate-y-0 active:scale-[0.98] dark:border-slate-800 dark:hover:border-primary-500/50'
    "
    :disabled="isOutOfStock"
    :aria-label="ariaLabel"
    @click="emit('add', product)"
  >
    <!-- Quantity already in cart -->
    <Transition name="fade">
      <span
        v-if="inCart"
        class="absolute right-2 top-2 z-10 flex h-7 min-w-[1.75rem] items-center justify-center rounded-full bg-primary-600 px-2 text-xs font-bold text-white shadow-md"
        aria-hidden="true"
      >
        {{ inCart }}
      </span>
    </Transition>

    <span
      class="mb-3 flex aspect-[4/3] w-full items-center justify-center rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-800/50"
      aria-hidden="true"
    >
      <span class="text-5xl transition-transform duration-200 group-hover:scale-110 sm:text-6xl">{{ product.emoji }}</span>
    </span>

    <span class="line-clamp-2 font-semibold leading-snug" aria-hidden="true">{{ product.name }}</span>

    <span class="mt-auto flex flex-wrap items-center justify-between gap-x-2 gap-y-1 pt-2" aria-hidden="true">
      <span class="text-lg font-bold text-primary-600 dark:text-primary-400">{{ formatCurrency(product.price) }}</span>
      <StockBadge :stock="product.stock" compact />
    </span>
  </button>
</template>

