<script setup>
import { computed, ref, watch } from 'vue'
import AppIcon from './AppIcon.vue'
import BaseModal from './BaseModal.vue'
import { useCurrency } from '@/composables/useCurrency'
import { PAYMENT_METHODS, roundMoney } from '@/utils/format'

/**
 * Payment step: choose method, enter cash received (auto change calculation),
 * then confirm. Emits `confirm` with { paymentMethod, amountReceived, change }.
 */
const props = defineProps({
  open: { type: Boolean, default: false },
  total: { type: Number, required: true },
})
const emit = defineEmits(['close', 'confirm'])
const { formatCurrency } = useCurrency()

const method = ref('cash')
const cashInput = ref('')
const processing = ref(false)

// Reset the form each time the modal opens
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      method.value = 'cash'
      cashInput.value = ''
      processing.value = false
    }
  },
)

const amountReceived = computed(() => roundMoney(Number(cashInput.value) || 0))
const change = computed(() => roundMoney(amountReceived.value - props.total))
const isCash = computed(() => method.value === 'cash')
const canConfirm = computed(() => !processing.value && (!isCash.value || amountReceived.value >= props.total))

/** Suggested tender amounts: exact, then common rounded bills. */
const quickAmounts = computed(() => {
  const t = props.total
  const candidates = [t, Math.ceil(t), Math.ceil(t / 5) * 5, Math.ceil(t / 10) * 10, Math.ceil(t / 20) * 20, Math.ceil(t / 50) * 50, Math.ceil(t / 100) * 100]
  return [...new Set(candidates.map(roundMoney))].filter((v) => v >= t).slice(0, 6)
})

async function submit() {
  if (!canConfirm.value) return
  // Simulate talking to a card terminal / e-wallet gateway
  if (!isCash.value) {
    processing.value = true
    await new Promise((resolve) => setTimeout(resolve, 900))
  }
  emit('confirm', {
    paymentMethod: method.value,
    amountReceived: isCash.value ? amountReceived.value : props.total,
    change: isCash.value ? change.value : 0,
  })
  processing.value = false
}
</script>

<template>
  <BaseModal :open="open" title="Checkout" description="Select a payment method to complete the order." @close="!processing && emit('close')">
    <form id="checkout-form" class="space-y-6" @submit.prevent="submit">
      <!-- Amount due -->
      <div class="rounded-2xl bg-primary-50 p-5 text-center dark:bg-primary-500/10">
        <p class="text-sm font-medium text-primary-700 dark:text-primary-300">Amount due</p>
        <p class="mt-1 text-4xl font-extrabold tabular-nums text-primary-700 dark:text-primary-200">{{ formatCurrency(total) }}</p>
      </div>

      <!-- Payment method -->
      <fieldset>
        <legend class="label">Payment method</legend>
        <div class="grid grid-cols-3 gap-2 sm:gap-3">
          <label
            v-for="pm in PAYMENT_METHODS"
            :key="pm.value"
            class="relative flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 p-3 text-center transition-all has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary-500 sm:p-4"
            :class="
              method === pm.value
                ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-300'
                : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600'
            "
          >
            <input v-model="method" type="radio" name="payment-method" :value="pm.value" class="sr-only" :disabled="processing" />
            <AppIcon :name="pm.icon" :size="28" />
            <span class="text-sm font-semibold">{{ pm.label }}</span>
            <span class="hidden text-xs text-slate-500 dark:text-slate-400 sm:block">{{ pm.hint }}</span>
          </label>
        </div>
      </fieldset>

      <!-- Cash details -->
      <Transition name="fade" mode="out-in">
        <div v-if="isCash" key="cash" class="space-y-4">
          <div>
            <label for="cash-received" class="label">Amount received</label>
            <input
              id="cash-received"
              v-model="cashInput"
              data-autofocus
              type="number"
              inputmode="decimal"
              min="0"
              step="0.01"
              placeholder="0.00"
              class="input h-14 text-2xl font-bold tabular-nums"
              :aria-describedby="'change-display'"
            />
          </div>

          <div class="flex flex-wrap gap-2" aria-label="Quick amounts">
            <button
              v-for="amount in quickAmounts"
              :key="amount"
              type="button"
              class="btn btn-secondary flex-1 tabular-nums"
              @click="cashInput = String(amount)"
            >
              {{ amount === total ? 'Exact' : formatCurrency(amount) }}
            </button>
          </div>

          <div
            id="change-display"
            class="flex items-center justify-between rounded-2xl p-4 transition-colors"
            :class="
              cashInput === ''
                ? 'bg-slate-100 dark:bg-slate-800'
                : change >= 0
                  ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300'
                  : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300'
            "
            aria-live="polite"
          >
            <span class="font-medium">{{ change >= 0 || cashInput === '' ? 'Change due' : 'Remaining' }}</span>
            <span class="text-2xl font-extrabold tabular-nums">
              {{ cashInput === '' ? formatCurrency(0) : formatCurrency(Math.abs(change)) }}
            </span>
          </div>
        </div>

        <div v-else key="electronic" class="rounded-2xl border border-dashed border-slate-300 p-6 text-center dark:border-slate-700">
          <div v-if="processing" class="flex flex-col items-center gap-3" role="status">
            <span class="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" aria-hidden="true" />
            <p class="font-medium">Processing payment…</p>
          </div>
          <template v-else>
            <p class="text-4xl" aria-hidden="true">{{ method === 'card' ? '💳' : '📱' }}</p>
            <p class="mt-2 font-medium">
              {{ method === 'card' ? 'Ask the customer to tap or insert their card.' : 'Ask the customer to scan the QR code.' }}
            </p>
            <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">Press confirm once the terminal approves.</p>
          </template>
        </div>
      </Transition>
    </form>

    <template #footer>
      <button type="button" class="btn btn-secondary" :disabled="processing" @click="emit('close')">Cancel</button>
      <button type="submit" form="checkout-form" class="btn btn-primary sm:min-w-[180px]" :disabled="!canConfirm">
        <AppIcon name="check-circle" :size="18" />
        {{ processing ? 'Processing…' : `Confirm ${formatCurrency(total)}` }}
      </button>
    </template>
  </BaseModal>
</template>

