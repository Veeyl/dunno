<script setup>
import { computed, ref } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import EmptyState from '@/components/EmptyState.vue'
import OrderDetailModal from '@/components/OrderDetailModal.vue'
import PageHeader from '@/components/PageHeader.vue'
import SalesChart from '@/components/SalesChart.vue'
import StatCard from '@/components/StatCard.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import StockBadge from '@/components/StockBadge.vue'
import { useOrderStore } from '@/stores/useOrderStore'
import { useProductStore } from '@/stores/useProductStore'
import { useCurrency } from '@/composables/useCurrency'
import { useToast } from '@/composables/useToast'
import { formatTime, isToday, formatDateTime, paymentLabel } from '@/utils/format'

const orderStore = useOrderStore()
const productStore = useProductStore()
const toast = useToast()
const { formatCurrency } = useCurrency()

const today = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date())

/* --------------------------------- KPIs --------------------------------- */
const salesTrend = computed(() => {
  const y = orderStore.yesterdaySales
  return y > 0 ? ((orderStore.todaySales - y) / y) * 100 : null
})
const stockAlerts = computed(() => [...productStore.outOfStockProducts, ...productStore.lowStockProducts])

/* -------------------------------- Chart -------------------------------- */
const chartRange = ref('week') // 'week' | 'today'
const chart = computed(() =>
  chartRange.value === 'week'
    ? { ...orderStore.salesByDay(7), type: 'bar' }
    : { ...orderStore.salesByHourToday(), type: 'line' },
)

/* ----------------------------- Top sellers ----------------------------- */
const topSellers = computed(() => orderStore.topSellingToday)
const maxTopQty = computed(() => Math.max(1, ...topSellers.value.map((i) => i.quantity)))

/* -------------------------- Recent transactions -------------------------- */
const recentOrders = computed(() => orderStore.orders.slice(0, 8))
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
      <PageHeader title="Dashboard" :subtitle="today">
        <RouterLink to="/pos" class="btn btn-primary">
          <AppIcon name="plus" :size="18" />
          New sale
        </RouterLink>
      </PageHeader>

      <!-- KPI cards -->
      <section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Today's summary">
        <StatCard label="Today's sales" :value="formatCurrency(orderStore.todaySales)" icon="banknotes" :trend="salesTrend" hint="No sales yesterday" />
        <StatCard
          label="Orders today"
          :value="String(orderStore.todayCompleted.length)"
          icon="receipt"
          tone="sky"
          :hint="`${orderStore.todayOrders.length - orderStore.todayCompleted.length} refunded`"
        />
        <StatCard label="Avg. order value" :value="formatCurrency(orderStore.averageOrderValue)" icon="chart-bar" tone="emerald" hint="Completed orders today" />
        <StatCard
          label="Stock alerts"
          :value="String(stockAlerts.length)"
          icon="exclamation-triangle"
          tone="amber"
          :hint="`${productStore.outOfStockProducts.length} out · ${productStore.lowStockProducts.length} low`"
        />
      </section>

      <div class="mt-6 grid gap-6 xl:grid-cols-3">
        <!-- Sales chart -->
        <section class="card p-5 xl:col-span-2" aria-labelledby="chart-heading">
          <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 id="chart-heading" class="font-bold">Sales over time</h2>
              <p class="text-sm text-slate-500 dark:text-slate-400">
                {{ chartRange === 'week' ? 'Last 7 days' : 'Today, by hour' }} · completed orders
              </p>
            </div>
            <div class="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800" role="radiogroup" aria-label="Chart range">
              <button
                v-for="opt in [
                  { value: 'week', label: '7 days' },
                  { value: 'today', label: 'Today' },
                ]"
                :key="opt.value"
                type="button"
                role="radio"
                :aria-checked="chartRange === opt.value"
                class="min-h-[36px] rounded-lg px-3 text-sm font-semibold transition"
                :class="
                  chartRange === opt.value
                    ? 'bg-white text-primary-700 shadow-sm dark:bg-slate-700 dark:text-primary-300'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                "
                @click="chartRange = opt.value"
              >
                {{ opt.label }}
              </button>
            </div>
          </div>
          <SalesChart :labels="chart.labels" :values="chart.values" :type="chart.type" />
        </section>

        <!-- Top sellers -->
        <section class="card p-5" aria-labelledby="top-heading">
          <h2 id="top-heading" class="font-bold">Top sellers today</h2>
          <p class="mb-4 text-sm text-slate-500 dark:text-slate-400">By units sold</p>
          <EmptyState v-if="!topSellers.length" emoji="🏆" title="No sales yet today" description="Top items will appear here." />
          <ol v-else class="space-y-4">
            <li v-for="(item, index) in topSellers" :key="item.productId" class="flex items-center gap-3">
              <span class="w-4 text-sm font-bold text-slate-400">{{ index + 1 }}</span>
              <span class="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-xl dark:bg-slate-800" aria-hidden="true">
                {{ item.emoji }}
              </span>
              <div class="min-w-0 flex-1">
                <div class="flex justify-between gap-2 text-sm">
                  <span class="truncate font-semibold">{{ item.name }}</span>
                  <span class="shrink-0 tabular-nums text-slate-500 dark:text-slate-400">{{ item.quantity }} sold</span>
                </div>
                <div class="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800" aria-hidden="true">
                  <div class="h-full rounded-full bg-primary-500 transition-all duration-500" :style="{ width: `${(item.quantity / maxTopQty) * 100}%` }" />
                </div>
              </div>
            </li>
          </ol>
        </section>
      </div>

      <div class="mt-6 grid gap-6 xl:grid-cols-3">
        <!-- Recent transactions -->
        <section class="card overflow-hidden xl:col-span-2" aria-labelledby="recent-heading">
          <div class="flex items-center justify-between p-5 pb-3">
            <h2 id="recent-heading" class="font-bold">Recent transactions</h2>
            <RouterLink to="/orders" class="flex items-center gap-1 text-sm font-semibold text-primary-600 hover:underline dark:text-primary-400">
              View all <AppIcon name="chevron-right" :size="16" />
            </RouterLink>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead class="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
                <tr>
                  <th scope="col" class="px-5 py-3 font-semibold">Order</th>
                  <th scope="col" class="px-5 py-3 font-semibold">Time</th>
                  <th scope="col" class="hidden px-5 py-3 font-semibold sm:table-cell">Payment</th>
                  <th scope="col" class="px-5 py-3 font-semibold">Status</th>
                  <th scope="col" class="px-5 py-3 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                <tr
                  v-for="order in recentOrders"
                  :key="order.id"
                  class="cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  @click="selectedOrderId = order.id"
                >
                  <td class="px-5 py-3">
                    <button type="button" class="font-semibold text-primary-600 hover:underline dark:text-primary-400" @click.stop="selectedOrderId = order.id">
                      #{{ order.number }}
                    </button>
                  </td>
                  <td class="whitespace-nowrap px-5 py-3 text-slate-500 dark:text-slate-400">
                    {{ isToday(order.createdAt) ? formatTime(order.createdAt) : formatDateTime(order.createdAt) }}
                  </td>
                  <td class="hidden px-5 py-3 sm:table-cell">{{ paymentLabel(order.paymentMethod) }}</td>
                  <td class="px-5 py-3"><StatusBadge :status="order.status" /></td>
                  <td class="px-5 py-3 text-right font-semibold tabular-nums" :class="{ 'text-slate-400 line-through': order.status === 'refunded' }">
                    {{ formatCurrency(order.total) }}
                  </td>
                </tr>
              </tbody>
            </table>
            <EmptyState v-if="!recentOrders.length" emoji="🧾" title="No transactions yet" />
          </div>
        </section>

        <!-- Stock alerts -->
        <section class="card p-5" aria-labelledby="alerts-heading">
          <div class="mb-4 flex items-center justify-between">
            <h2 id="alerts-heading" class="font-bold">Stock alerts</h2>
            <RouterLink to="/inventory" class="text-sm font-semibold text-primary-600 hover:underline dark:text-primary-400">Manage</RouterLink>
          </div>
          <EmptyState v-if="!stockAlerts.length" emoji="✅" title="All stocked up" description="No low-stock items." />
          <ul v-else class="space-y-2">
            <li
              v-for="product in stockAlerts.slice(0, 6)"
              :key="product.id"
              class="flex items-center gap-3 rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800/50"
            >
              <span class="text-2xl" aria-hidden="true">{{ product.emoji }}</span>
              <span class="min-w-0 flex-1 truncate text-sm font-medium">{{ product.name }}</span>
              <StockBadge :stock="product.stock" compact />
            </li>
          </ul>
        </section>
      </div>
    </div>

    <OrderDetailModal :order="selectedOrder" @close="selectedOrderId = null" @refund="refund" />
  </div>
</template>

