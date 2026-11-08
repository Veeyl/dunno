import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { generateSeedOrders } from '@/data/seedOrders'
import { mockProducts } from '@/data/mockProducts'
import { loadState, saveState, STORAGE_KEYS } from '@/utils/storage'
import { isSameDay, isToday, roundMoney } from '@/utils/format'

/**
 * Completed transactions + sales analytics used by the dashboard.
 * Orders are kept newest-first.
 */
export const useOrderStore = defineStore('orders', () => {
  const orders = ref(loadState(STORAGE_KEYS.orders, null) ?? generateSeedOrders(mockProducts))

  const nextOrderNumber = computed(
    () => orders.value.reduce((max, o) => Math.max(max, o.number), 1000) + 1,
  )

  /* ----------------------------- Actions ----------------------------- */

  /** Create and store an order from the checkout payload. */
  function createOrder(payload) {
    const order = {
      id: `ord-${Date.now().toString(36)}`,
      number: nextOrderNumber.value,
      createdAt: new Date().toISOString(),
      status: 'completed',
      ...payload,
    }
    orders.value.unshift(order)
    return order
  }

  function getById(id) {
    return orders.value.find((o) => o.id === id)
  }

  /** Mark an order refunded. Returns the order (caller restocks items). */
  function refundOrder(id) {
    const order = getById(id)
    if (order && order.status === 'completed') {
      order.status = 'refunded'
      order.refundedAt = new Date().toISOString()
    }
    return order
  }

  /* ---------------------------- Analytics ---------------------------- */

  const completedOrders = computed(() => orders.value.filter((o) => o.status === 'completed'))
  const todayOrders = computed(() => orders.value.filter((o) => isToday(o.createdAt)))
  const todayCompleted = computed(() => completedOrders.value.filter((o) => isToday(o.createdAt)))

  const todaySales = computed(() => sumTotals(todayCompleted.value))
  const averageOrderValue = computed(() =>
    todayCompleted.value.length ? roundMoney(todaySales.value / todayCompleted.value.length) : 0,
  )

  const yesterdaySales = computed(() => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    return sumTotals(completedOrders.value.filter((o) => isSameDay(o.createdAt, yesterday)))
  })

  const topSellingToday = computed(() => topSellingItems(todayCompleted.value))

  /** Totals per day for the last `days` days (oldest → newest). */
  function salesByDay(days = 7) {
    const labels = []
    const values = []
    const dayFormatter = new Intl.DateTimeFormat(undefined, { weekday: 'short', day: 'numeric' })
    for (let i = days - 1; i >= 0; i--) {
      const day = new Date()
      day.setDate(day.getDate() - i)
      labels.push(i === 0 ? 'Today' : dayFormatter.format(day))
      values.push(sumTotals(completedOrders.value.filter((o) => isSameDay(o.createdAt, day))))
    }
    return { labels, values }
  }

  /** Totals per hour for today (6 AM → 10 PM). */
  function salesByHourToday() {
    const startHour = 6
    const endHour = 22
    const values = Array(endHour - startHour + 1).fill(0)
    todayCompleted.value.forEach((o) => {
      const hour = new Date(o.createdAt).getHours()
      if (hour >= startHour && hour <= endHour) values[hour - startHour] += o.total
    })
    const labels = values.map((_, i) => {
      const h = startHour + i
      return `${h % 12 || 12}${h < 12 ? 'am' : 'pm'}`
    })
    return { labels, values: values.map(roundMoney) }
  }

  watch(orders, (value) => saveState(STORAGE_KEYS.orders, value), { deep: true })

  return {
    orders,
    nextOrderNumber,
    createOrder,
    getById,
    refundOrder,
    completedOrders,
    todayOrders,
    todayCompleted,
    todaySales,
    yesterdaySales,
    averageOrderValue,
    topSellingToday,
    salesByDay,
    salesByHourToday,
  }
})

/* ----------------------------- Helpers ----------------------------- */

function sumTotals(list) {
  return roundMoney(list.reduce((sum, o) => sum + o.total, 0))
}

/** Aggregate quantities/revenue per product across orders. */
function topSellingItems(list, limit = 5) {
  const totals = new Map()
  list.forEach((order) => {
    order.items.forEach((item) => {
      const entry = totals.get(item.productId) ?? {
        productId: item.productId,
        name: item.name,
        emoji: item.emoji,
        quantity: 0,
        revenue: 0,
      }
      entry.quantity += item.quantity
      entry.revenue = roundMoney(entry.revenue + item.price * item.quantity)
      totals.set(item.productId, entry)
    })
  })
  return [...totals.values()].sort((a, b) => b.quantity - a.quantity).slice(0, limit)
}

