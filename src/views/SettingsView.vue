<script setup>
import { computed, reactive, ref } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import ConfirmModal from '@/components/ConfirmModal.vue'
import PageHeader from '@/components/PageHeader.vue'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useCurrency } from '@/composables/useCurrency'
import { useToast } from '@/composables/useToast'
import { clearAllState } from '@/utils/storage'

const settings = useSettingsStore()
const toast = useToast()
const { formatCurrency } = useCurrency()

const CURRENCY_PRESETS = ['$', '€', '£', '¥', '₱', '₹', '₩', 'RM']

// Edit a local draft; changes are applied on Save
const draft = reactive({
  shopName: settings.shopName,
  taxRate: settings.taxRate,
  currencySymbol: settings.currencySymbol,
  lowStockThreshold: settings.lowStockThreshold,
})

const isDirty = computed(
  () =>
    draft.shopName !== settings.shopName ||
    Number(draft.taxRate) !== settings.taxRate ||
    draft.currencySymbol !== settings.currencySymbol ||
    Number(draft.lowStockThreshold) !== settings.lowStockThreshold,
)

const errors = computed(() => {
  const e = {}
  if (!String(draft.shopName).trim()) e.shopName = 'Shop name is required.'
  const tax = Number(draft.taxRate)
  if (draft.taxRate === '' || Number.isNaN(tax) || tax < 0 || tax > 100) e.taxRate = 'Tax must be between 0 and 100.'
  if (!String(draft.currencySymbol).trim()) e.currencySymbol = 'Currency symbol is required.'
  return e
})

// Live preview of a sample price with the draft currency/tax
const preview = computed(() => {
  const base = 10
  const tax = (base * (Number(draft.taxRate) || 0)) / 100
  const symbol = String(draft.currencySymbol).trim() || '$'
  return `${symbol}${base.toFixed(2)} + ${symbol}${tax.toFixed(2)} tax = ${symbol}${(base + tax).toFixed(2)}`
})

function save() {
  if (Object.keys(errors.value).length) {
    toast.error('Please fix the highlighted fields')
    return
  }
  settings.updateSettings(draft)
  Object.assign(draft, {
    shopName: settings.shopName,
    taxRate: settings.taxRate,
    currencySymbol: settings.currencySymbol,
    lowStockThreshold: settings.lowStockThreshold,
  })
  toast.success('Settings saved')
}

function discard() {
  Object.assign(draft, {
    shopName: settings.shopName,
    taxRate: settings.taxRate,
    currencySymbol: settings.currencySymbol,
    lowStockThreshold: settings.lowStockThreshold,
  })
}

/* ------------------------------ Danger zone ------------------------------ */
const confirmReset = ref(false)
function resetDemoData() {
  clearAllState()
  window.location.reload()
}

const SHORTCUTS = [
  { keys: ['/'], action: 'Focus product search (POS)' },
  { keys: ['Enter'], action: 'Open checkout (POS)' },
  { keys: ['Enter'], action: 'Add product when search has exactly one match' },
  { keys: ['Esc'], action: 'Close dialogs / clear search' },
]
</script>

<template>
  <div class="scrollbar-thin h-full overflow-y-auto">
    <div class="mx-auto max-w-3xl p-4 sm:p-6 lg:p-8">
      <PageHeader title="Settings" subtitle="Configure your shop and preferences." />

      <!-- Shop settings -->
      <form class="card divide-y divide-slate-100 dark:divide-slate-800" novalidate @submit.prevent="save">
        <div class="p-5 sm:p-6">
          <h2 class="font-bold">Shop</h2>
          <p class="mb-5 text-sm text-slate-500 dark:text-slate-400">Shown in the sidebar and on receipts.</p>

          <div class="space-y-5">
            <div>
              <label for="shop-name" class="label">Shop name</label>
              <input
                id="shop-name"
                v-model="draft.shopName"
                type="text"
                maxlength="40"
                class="input"
                :class="{ 'input-error': errors.shopName }"
                :aria-invalid="!!errors.shopName"
                aria-describedby="shop-name-error"
              />
              <p v-if="errors.shopName" id="shop-name-error" class="mt-1 text-sm text-red-600 dark:text-red-400">{{ errors.shopName }}</p>
            </div>

            <div class="grid gap-5 sm:grid-cols-2">
              <div>
                <label for="tax-rate" class="label">Tax rate (%)</label>
                <input
                  id="tax-rate"
                  v-model="draft.taxRate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  inputmode="decimal"
                  class="input"
                  :class="{ 'input-error': errors.taxRate }"
                  :aria-invalid="!!errors.taxRate"
                  aria-describedby="tax-rate-error"
                />
                <p v-if="errors.taxRate" id="tax-rate-error" class="mt-1 text-sm text-red-600 dark:text-red-400">{{ errors.taxRate }}</p>
              </div>
              <div>
                <label for="low-stock" class="label">Low-stock threshold</label>
                <input id="low-stock" v-model="draft.lowStockThreshold" type="number" min="0" step="1" inputmode="numeric" class="input" />
              </div>
            </div>

            <div>
              <label for="currency" class="label">Currency symbol</label>
              <div class="flex flex-wrap items-center gap-2">
                <input
                  id="currency"
                  v-model="draft.currencySymbol"
                  type="text"
                  maxlength="4"
                  class="input w-24 text-center text-lg font-semibold"
                  :class="{ 'input-error': errors.currencySymbol }"
                  :aria-invalid="!!errors.currencySymbol"
                />
                <div class="flex flex-wrap gap-1.5" role="group" aria-label="Currency presets">
                  <button
                    v-for="symbol in CURRENCY_PRESETS"
                    :key="symbol"
                    type="button"
                    class="h-11 min-w-[44px] rounded-xl border px-2 text-sm font-semibold transition"
                    :class="
                      draft.currencySymbol === symbol
                        ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300'
                        : 'border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800'
                    "
                    :aria-pressed="draft.currencySymbol === symbol"
                    @click="draft.currencySymbol = symbol"
                  >
                    {{ symbol }}
                  </button>
                </div>
              </div>
              <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">Preview: <span class="font-medium tabular-nums">{{ preview }}</span></p>
            </div>
          </div>
        </div>

        <div class="flex flex-col-reverse gap-2 bg-slate-50 p-4 dark:bg-slate-900/60 sm:flex-row sm:justify-end sm:px-6">
          <button type="button" class="btn btn-secondary" :disabled="!isDirty" @click="discard">Discard</button>
          <button type="submit" class="btn btn-primary" :disabled="!isDirty">Save changes</button>
        </div>
      </form>

      <!-- Appearance -->
      <section class="card mt-6 p-5 sm:p-6" aria-labelledby="appearance-heading">
        <div class="flex items-center justify-between gap-4">
          <div>
            <h2 id="appearance-heading" class="font-bold">Dark mode</h2>
            <p class="text-sm text-slate-500 dark:text-slate-400">Easier on the eyes in low light. Applied instantly.</p>
          </div>
          <button
            type="button"
            role="switch"
            :aria-checked="settings.darkMode"
            aria-labelledby="appearance-heading"
            class="relative inline-flex h-8 w-14 shrink-0 items-center rounded-full transition-colors duration-200"
            :class="settings.darkMode ? 'bg-primary-600' : 'bg-slate-300'"
            @click="settings.toggleDarkMode()"
          >
            <span
              class="inline-flex h-6 w-6 transform items-center justify-center rounded-full bg-white text-slate-700 shadow transition-transform duration-200"
              :class="settings.darkMode ? 'translate-x-7' : 'translate-x-1'"
            >
              <AppIcon :name="settings.darkMode ? 'moon' : 'sun'" :size="14" />
            </span>
          </button>
        </div>
      </section>

      <!-- Keyboard shortcuts -->
      <section class="card mt-6 p-5 sm:p-6" aria-labelledby="shortcuts-heading">
        <h2 id="shortcuts-heading" class="mb-4 font-bold">Keyboard shortcuts</h2>
        <dl class="divide-y divide-slate-100 text-sm dark:divide-slate-800">
          <div v-for="s in SHORTCUTS" :key="s.action" class="flex items-center justify-between py-2.5">
            <dt class="text-slate-600 dark:text-slate-300">{{ s.action }}</dt>
            <dd class="flex gap-1">
              <kbd v-for="k in s.keys" :key="k" class="kbd">{{ k }}</kbd>
            </dd>
          </div>
        </dl>
      </section>

      <!-- Danger zone -->
      <section class="card mt-6 border-red-200 p-5 dark:border-red-500/30 sm:p-6" aria-labelledby="danger-heading">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 id="danger-heading" class="font-bold text-red-600 dark:text-red-400">Reset demo data</h2>
            <p class="text-sm text-slate-500 dark:text-slate-400">Restore sample products, orders and default settings.</p>
          </div>
          <button type="button" class="btn btn-danger" @click="confirmReset = true">
            <AppIcon name="refund" :size="18" />
            Reset everything
          </button>
        </div>
      </section>

      <p class="mt-6 text-center text-xs text-slate-400">Example price: {{ formatCurrency(1234.5) }}</p>
    </div>

    <ConfirmModal
      :open="confirmReset"
      title="Reset all data?"
      message="This clears products, orders, the cart and settings stored in this browser, then reloads the app with demo data."
      confirm-label="Reset"
      danger
      @cancel="confirmReset = false"
      @confirm="resetDemoData"
    />
  </div>
</template>

