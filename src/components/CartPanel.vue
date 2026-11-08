<script setup>
import AppIcon from './AppIcon.vue'
import EmptyState from './EmptyState.vue'
import { useCartStore } from '@/stores/useCartStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useCurrency } from '@/composables/useCurrency'
import { useToast } from '@/composables/useToast'

/**
 * Current order: line items with quantity controls, discount input,
 * totals breakdown and the Checkout button.
 */
defineProps({
  // Shows a close button (used when the panel is a mobile/tablet drawer)
  closable: { type: Boolean, default: false },
})
const emit = defineEmits(['checkout', 'close'])

const cart = useCartStore()
const settings = useSettingsStore()
const toast = useToast()
const { formatCurrency } = useCurrency()

function increment(line) {
  const result = cart.addItem(line.productId)
  if (!result.ok) toast.warning(`Only ${result.stock} ${line.name} in stock`)
}

function clearCart() {
  cart.clearCart()
  toast.info('Cart cleared')
}
</script>

<template>
  <section class="flex h-full flex-col bg-white dark:bg-slate-900" aria-labelledby="cart-heading">
    <!-- Header -->
    <header class="flex items-center justify-between gap-2 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
      <div>
        <h2 id="cart-heading" class="text-lg font-bold">Current order</h2>
        <p class="text-sm text-slate-500 dark:text-slate-400" aria-live="polite">
          {{ cart.itemCount }} {{ cart.itemCount === 1 ? 'item' : 'items' }}
        </p>
      </div>
      <div class="flex items-center gap-1">
        <button
          type="button"
          class="btn btn-ghost text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-500/10"
          :disabled="cart.isEmpty"
          @click="clearCart"
        >
          <AppIcon name="trash" :size="18" />
          Clear
        </button>
        <button v-if="closable" type="button" class="btn btn-ghost btn-icon" aria-label="Close cart" @click="emit('close')">
          <AppIcon name="x" />
        </button>
      </div>
    </header>

    <!-- Line items -->
    <div class="scrollbar-thin relative flex-1 overflow-y-auto overflow-x-hidden p-3">
      <Transition name="fade" mode="out-in">
        <EmptyState
          v-if="cart.isEmpty"
          emoji="🛒"
          title="Your cart is empty"
          description="Tap a product to start a new order."
        />

        <TransitionGroup v-else tag="ul" name="cart-item" class="relative flex flex-col gap-2" aria-label="Items in cart">
          <li
            v-for="line in cart.lines"
            :key="line.productId"
            class="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-2.5 dark:border-slate-800 dark:bg-slate-800/40"
          >
            <span
              class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-2xl shadow-sm dark:bg-slate-800"
              aria-hidden="true"
            >
              {{ line.emoji }}
            </span>

            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-semibold">{{ line.name }}</p>
              <p class="text-xs text-slate-500 dark:text-slate-400">{{ formatCurrency(line.price) }} each</p>

              <!-- Quantity stepper -->
              <div class="mt-1.5 flex items-center gap-1" role="group" :aria-label="`Quantity of ${line.name}`">
                <button
                  type="button"
                  class="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white transition hover:border-primary-300 hover:text-primary-600 active:scale-90 dark:border-slate-700 dark:bg-slate-800"
                  :aria-label="`Decrease ${line.name}`"
                  @click="cart.decrement(line.productId)"
                >
                  <AppIcon name="minus" :size="16" />
                </button>
                <span class="w-9 text-center text-sm font-bold tabular-nums" aria-live="polite">{{ line.quantity }}</span>
                <button
                  type="button"
                  class="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white transition hover:border-primary-300 hover:text-primary-600 active:scale-90 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800"
                  :aria-label="`Increase ${line.name}`"
                  :disabled="line.quantity >= line.stock"
                  :title="line.quantity >= line.stock ? 'No more stock available' : undefined"
                  @click="increment(line)"
                >
                  <AppIcon name="plus" :size="16" />
                </button>
              </div>
            </div>

            <div class="flex flex-col items-end gap-1">
              <span class="text-sm font-bold tabular-nums">{{ formatCurrency(line.lineTotal) }}</span>
              <button
                type="button"
                class="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                :aria-label="`Remove ${line.name} from cart`"
                @click="cart.removeItem(line.productId)"
              >
                <AppIcon name="trash" :size="18" />
              </button>
            </div>
          </li>
        </TransitionGroup>
      </Transition>
    </div>

    <!-- Summary -->
    <footer class="space-y-4 border-t border-slate-200 p-4 dark:border-slate-800 sm:p-5">
      <!-- Discount -->
      <fieldset class="flex items-center gap-2" :disabled="cart.isEmpty">
        <legend class="sr-only">Discount</legend>
        <div class="flex shrink-0 rounded-xl bg-slate-100 p-1 dark:bg-slate-800" role="radiogroup" aria-label="Discount type">
          <button
            v-for="opt in [
              { value: 'percent', label: '%', aria: 'Percentage discount' },
              { value: 'fixed', label: settings.currencySymbol, aria: 'Fixed amount discount' },
            ]"
            :key="opt.value"
            type="button"
            role="radio"
            :aria-checked="cart.discountType === opt.value"
            :aria-label="opt.aria"
            class="h-9 min-w-[2.5rem] rounded-lg px-2 text-sm font-semibold transition disabled:opacity-50"
            :class="
              cart.discountType === opt.value
                ? 'bg-white text-primary-700 shadow-sm dark:bg-slate-700 dark:text-primary-300'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            "
            @click="cart.discountType = opt.value"
          >
            {{ opt.label }}
          </button>
        </div>
        <label for="discount-input" class="sr-only">Discount value</label>
        <input
          id="discount-input"
          v-model.number="cart.discountValue"
          type="number"
          min="0"
          :max="cart.discountType === 'percent' ? 100 : undefined"
          step="0.01"
          inputmode="decimal"
          placeholder="Discount"
          class="input disabled:opacity-50"
        />
      </fieldset>

      <!-- Totals -->
      <dl class="space-y-1.5 text-sm">
        <div class="flex justify-between text-slate-600 dark:text-slate-400">
          <dt>Subtotal</dt>
          <dd class="tabular-nums">{{ formatCurrency(cart.subtotal) }}</dd>
        </div>
        <div v-if="cart.discountAmount > 0" class="flex justify-between text-emerald-600 dark:text-emerald-400">
          <dt>Discount{{ cart.discountType === 'percent' ? ` (${Math.min(cart.discountValue, 100)}%)` : '' }}</dt>
          <dd class="tabular-nums">−{{ formatCurrency(cart.discountAmount) }}</dd>
        </div>
        <div class="flex justify-between text-slate-600 dark:text-slate-400">
          <dt>Tax ({{ settings.taxRate }}%)</dt>
          <dd class="tabular-nums">{{ formatCurrency(cart.taxAmount) }}</dd>
        </div>
        <div class="flex items-baseline justify-between border-t border-dashed border-slate-200 pt-2 dark:border-slate-700">
          <dt class="text-base font-semibold">Total</dt>
          <dd class="text-2xl font-extrabold tabular-nums">{{ formatCurrency(cart.total) }}</dd>
        </div>
      </dl>

      <button type="button" class="btn btn-primary btn-lg w-full" :disabled="cart.isEmpty" @click="emit('checkout')">
        Checkout
        <kbd class="kbd kbd-inverse hidden sm:inline-flex">Enter</kbd>
      </button>
    </footer>
  </section>
</template>

