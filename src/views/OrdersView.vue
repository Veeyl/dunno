<script setup>
import { computed, ref, watch } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import EmptyState from '@/components/EmptyState.vue'
import OrderDetailModal from '@/components/OrderDetailModal.vue'
import PageHeader from '@/components/PageHeader.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { useOrderStore } from '@/stores/useOrderStore'
import { useProductStore } from '@/stores/useProductStore'
import { useCurrency } from '@/composables/useCurrency'
import { useToast } from '@/composables/useToast'
import { buildOrdersCsvRows, buildPaymentSummaryCsvRows, computePaymentBreakdown, downloadCsv } from '@/utils/csv'
import { formatDateTime, isToday, PAYMENT_METHODS, paymentLabel, roundMoney } from '@/utils/format'

const orderStore = useOrderStore()
const productStore = useProductStore()
const toast = useToast()
const { formatCurrency } = useCurrency()

/* ------------------------------- Filters ------------------------------- */
const search = ref('')
const status = ref('all')
const payment = ref('all')
const dateRange = ref('all') // 'today' | '7d' | '30d' | 'all'

const PAGE_SIZE = 25
const visibleCount = ref(PAGE_SIZE)

const filteredOrders = computed(() => {
  const q = search.value.trim().toLowerCase().replace(/^#/, '')
  const now = Date.now()
  const maxAge = { '7d': 7, '30d': 30 }[dateRange.value]

  return orderStore.orders.filter((o) => {
    if (status.value !== 'all' && o.status !== status.value) return false
    if (payment.value !== 'all' && o.paymentMethod !== payment.value) return false
    if (dateRange.value === 'today' && !isToday(o.createdAt)) return false
    if (maxAge && now - new Date(o.createdAt).getTime() > maxAge * 86_400_000) return false
    if (q) {
      const matchesNumber = String(o.number).includes(q)
      const matchesItem = o.items.some((i) => i.name.toLowerCase().includes(q))
      if (!matchesNumber && !matchesItem) return false
    }
    return true
  })
})

const visibleOrders = computed(() => filteredOrders.value.slice(0, visibleCount.value))
const filteredTotal = computed(() =>
  roundMoney(filteredOrders.value.filter((o) => o.status === 'completed').reduce((s, o) => s + o.total, 0)),
)
const hasFilters = computed(() => search.value || status.value !== 'all' || payment.value !== 'all' || dateRange.value !== 'all')

// Reset pagination when filters change
watch([search, status, payment, dateRange], () => (visibleCount.value = PAGE_SIZE))

function resetFilters() {
  search.value = ''
  status.value = 'all'
  payment.value = 'all'
  dateRange.value = 'all'
}

function itemSummary(order) {
  const count = order.items.reduce((n, i) => n + i.quantity, 0)
  const names = order.items.map((i) => i.name).join(', ')
  return { count, names }
}

/* ----------------------------- CSV Export ----------------------------- */
const exportScope = ref('all') // 'all' | 'filtered' | 'cash' | 'card' | 'ewallet' | 'summary'

// Orders matching search/date/status filters (ignoring payment filter so payment cards show all 3 methods)
const baseFilteredOrders = computed(() => {
  const q = search.value.trim().toLowerCase().replace(/^#/, '')
  const now = Date.now()
  const maxAge = { '7d': 7, '30d': 30 }[dateRange.value]

  return orderStore.orders.filter((o) => {
    if (status.value !== 'all' && o.status !== status.value) return false
    if (dateRange.value === 'today' && !isToday(o.createdAt)) return false
    if (maxAge && now - new Date(o.createdAt).getTime() > maxAge * 86_400_000) return false
    if (q) {
      const matchesNumber = String(o.number).includes(q)
      const matchesItem = o.items.some((i) => i.name.toLowerCase().includes(q))
      if (!matchesNumber && !matchesItem) return false
    }
    return true
  })
})

const paymentBreakdown = computed(() => computePaymentBreakdown(baseFilteredOrders.value))

function dateStamp() {
  return new Date().toISOString().slice(0, 10)
}

function exportCsv(scope = exportScope.value) {
  const stamp = dateStamp()

  if (scope === 'summary') {
    const source = hasFilters.value ? filteredOrders.value : orderStore.orders
    if (!source.length) {
      toast.error('No orders available to export')
      return
    }
    downloadCsv(`orders-payment-summary-${stamp}.csv`, buildPaymentSummaryCsvRows(source))
    toast.success('Payment breakdown summary exported to CSV')
    return
  }

  let list = orderStore.orders
  let label = 'All transactions'
  let filename = `orders-all-${stamp}.csv`

  if (scope === 'filtered') {
    list = filteredOrders.value
    label = 'Filtered transactions'
    filename = `orders-filtered-${stamp}.csv`
  } else if (PAYMENT_METHODS.some((pm) => pm.value === scope)) {
    const pmLabel = paymentLabel(scope)
    list = baseFilteredOrders.value.filter((o) => o.paymentMethod === scope)
    label = `${pmLabel} transactions`
    filename = `orders-${scope}-${stamp}.csv`
  }

  if (!list.length) {
    toast.error(`No ${label.toLowerCase()} to export`)
    return
  }

  downloadCsv(filename, buildOrdersCsvRows(list))
  toast.success(`${label} (${list.length}) exported to CSV`)
}

function togglePaymentFilter(pmValue) {
  payment.value = payment.value === pmValue ? 'all' : pmValue
}

/* ------------------------------- Detail ------------------------------- */
const selectedOrderId = ref(null)
const selectedOrder = computed(() => (selectedOrderId.value ? orderStore.getById(selectedOrderId.value) : null))

function refund(order) {
  orderStore.refundOrder(order.id)
  productStore.restock(order.items)
  toast.info(`Order #${order.number} refunded and items restocked`)
}
</script>

<template>
  <div class="scrollbar-thin h-full overflow-y-auto">
    <div class="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
      <PageHeader title="Order history" :subtitle="`${filteredOrders.length} orders · ${formatCurrency(filteredTotal)} in completed sales`">
        <div class="flex flex-wrap items-center gap-2">
          <label for="csv-export-scope" class="sr-only">CSV export type</label>
          <select id="csv-export-scope" v-model="exportScope" class="input w-auto min-w-[190px] py-2">
            <option value="all">All transactions ({{ orderStore.orders.length }})</option>
            <option v-if="hasFilters" value="filtered">Current filter ({{ filteredOrders.length }})</option>
            <option v-for="pm in paymentBreakdown" :key="pm.value" :value="pm.value">
              {{ pm.label }} only ({{ pm.totalOrders }})
            </option>
            <option value="summary">Payment summary only</option>
          </select>
          <button
            type="button"
            class="btn btn-primary"
            :disabled="!orderStore.orders.length"
            @click="exportCsv()"
          >
            <AppIcon name="arrow-down-tray" :size="18" />
            Save CSV
          </button>
        </div>
      </PageHeader>

      <!-- Payment types breakdown + quick CSV per payment method -->
      <div class="mb-5 grid gap-3 sm:grid-cols-3">
        <div
          v-for="pm in paymentBreakdown"
          :key="pm.value"
          class="card flex items-center justify-between gap-3 p-4 transition"
          :class="
            payment === pm.value
              ? 'border-primary-500 ring-2 ring-primary-500/20 dark:border-primary-400'
              : 'hover:border-slate-300 dark:hover:border-slate-700'
          "
        >
          <button
            type="button"
            class="flex min-w-0 flex-1 items-center gap-3 text-left"
            :aria-pressed="payment === pm.value"
            @click="togglePaymentFilter(pm.value)"
          >
            <span
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <AppIcon :name="pm.icon" :size="20" />
            </span>
            <div class="min-w-0">
              <p class="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {{ pm.label }}
              </p>
              <p class="truncate text-lg font-bold tabular-nums">{{ formatCurrency(pm.completedTotal) }}</p>
              <p class="text-xs text-slate-500 dark:text-slate-400">
                {{ pm.completedCount }} completed<span v-if="pm.refundedCount"> · {{ pm.refundedCount }} refunded</span>
              </p>
            </div>
          </button>
          <button
            type="button"
            class="btn btn-secondary btn-icon shrink-0"
            :disabled="!pm.totalOrders"
            :aria-label="`Save ${pm.label} transactions as CSV`"
            :title="`Save ${pm.label} CSV`"
            @click="exportCsv(pm.value)"
          >
            <AppIcon name="arrow-down-tray" :size="18" />
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="card mb-5 grid gap-3 p-4 md:grid-cols-[1fr_auto_auto_auto]">
        <div class="relative">
          <label for="order-search" class="sr-only">Search orders</label>
          <AppIcon name="search" class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input id="order-search" v-model="search" type="search" placeholder="Order # or item name…" class="input pl-11" />
        </div>
        <div>
          <label for="order-date" class="sr-only">Date range</label>
          <select id="order-date" v-model="dateRange" class="input">
            <option value="all">All time</option>
            <option value="today">Today</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>
        </div>
        <div>
          <label for="order-status" class="sr-only">Status</label>
          <select id="order-status" v-model="status" class="input">
            <option value="all">All statuses</option>
            <option value="completed">Completed</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
        <div>
          <label for="order-payment" class="sr-only">Payment method</label>
          <select id="order-payment" v-model="payment" class="input">
            <option value="all">All payments</option>
            <option v-for="pm in PAYMENT_METHODS" :key="pm.value" :value="pm.value">{{ pm.label }}</option>
          </select>
        </div>
      </div>

      <!-- List -->
      <div class="card overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <caption class="sr-only">Past transactions</caption>
            <thead class="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th scope="col" class="px-5 py-3 font-semibold">Order</th>
                <th scope="col" class="hidden px-5 py-3 font-semibold sm:table-cell">Date</th>
                <th scope="col" class="hidden px-5 py-3 font-semibold lg:table-cell">Items</th>
                <th scope="col" class="hidden px-5 py-3 font-semibold md:table-cell">Payment</th>
                <th scope="col" class="px-5 py-3 font-semibold">Status</th>
                <th scope="col" class="px-5 py-3 text-right font-semibold">Total</th>
                <th scope="col" class="px-3 py-3"><span class="sr-only">View</span></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              <tr
                v-for="order in visibleOrders"
                :key="order.id"
                class="cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40"
                @click="selectedOrderId = order.id"
              >
                <td class="px-5 py-3.5">
                  <p class="font-semibold">#{{ order.number }}</p>
                  <p class="text-xs text-slate-500 dark:text-slate-400 sm:hidden">{{ formatDateTime(order.createdAt) }}</p>
                </td>
                <td class="hidden whitespace-nowrap px-5 py-3.5 text-slate-500 dark:text-slate-400 sm:table-cell">
                  {{ formatDateTime(order.createdAt) }}
                </td>
                <td class="hidden max-w-xs px-5 py-3.5 lg:table-cell">
                  <p class="truncate">
                    <span class="mr-1 text-lg" aria-hidden="true">{{ order.items.map((i) => i.emoji).slice(0, 4).join('') }}</span>
                    <span class="text-slate-500 dark:text-slate-400">{{ itemSummary(order).count }} items · {{ itemSummary(order).names }}</span>
                  </p>
                </td>
                <td class="hidden px-5 py-3.5 md:table-cell">{{ paymentLabel(order.paymentMethod) }}</td>
                <td class="px-5 py-3.5"><StatusBadge :status="order.status" /></td>
                <td
                  class="whitespace-nowrap px-5 py-3.5 text-right font-semibold tabular-nums"
                  :class="{ 'text-slate-400 line-through': order.status === 'refunded' }"
                >
                  {{ formatCurrency(order.total) }}
                </td>
                <td class="px-3 py-3.5 text-right">
                  <button
                    type="button"
                    class="btn btn-ghost btn-icon"
                    :aria-label="`View order ${order.number}`"
                    @click.stop="selectedOrderId = order.id"
                  >
                    <AppIcon name="eye" :size="18" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <EmptyState
          v-if="!filteredOrders.length"
          emoji="🧾"
          :title="hasFilters ? 'No orders match your filters' : 'No orders yet'"
          :description="hasFilters ? 'Try a different search or filter.' : 'Completed sales will appear here.'"
        >
          <button v-if="hasFilters" type="button" class="btn btn-secondary" @click="resetFilters">Reset filters</button>
        </EmptyState>

        <div v-if="visibleOrders.length < filteredOrders.length" class="border-t border-slate-100 p-4 text-center dark:border-slate-800">
          <button type="button" class="btn btn-secondary" @click="visibleCount += PAGE_SIZE">
            Show more ({{ filteredOrders.length - visibleOrders.length }} remaining)
          </button>
        </div>
      </div>
    </div>

    <OrderDetailModal :order="selectedOrder" @close="selectedOrderId = null" @refund="refund" />
  </div>
</template>

