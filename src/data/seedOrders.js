import { roundMoney } from '@/utils/format'

/**
 * Generates a week of realistic-looking historical orders so the dashboard
 * and order history have something to show on first launch.
 *
 * Uses a seeded pseudo-random generator so the demo data is stable.
 */
export function generateSeedOrders(products, taxRate = 8) {
  let seed = 20240501
  const rand = () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }
  const pick = (arr) => arr[Math.floor(rand() * arr.length)]

  // Only sell items that make sense to have been in stock
  const sellable = products.filter((p) => p.stock > 0)
  const now = new Date()
  const orders = []

  for (let daysAgo = 6; daysAgo >= 0; daysAgo--) {
    const orderCount = 5 + Math.floor(rand() * 8)

    for (let i = 0; i < orderCount; i++) {
      const date = new Date(now)
      date.setDate(now.getDate() - daysAgo)
      date.setHours(7 + Math.floor(rand() * 14), Math.floor(rand() * 60), Math.floor(rand() * 60), 0)

      // Today's orders must be in the past
      if (date > now) {
        date.setTime(now.getTime() - Math.floor(rand() * 3 * 60 * 60 * 1000) - 60_000)
      }

      // Build 1–4 distinct line items
      const items = []
      const lineCount = 1 + Math.floor(rand() * 4)
      for (let l = 0; l < lineCount; l++) {
        const product = pick(sellable)
        const existing = items.find((it) => it.productId === product.id)
        const quantity = 1 + Math.floor(rand() * 3)
        if (existing) existing.quantity += quantity
        else {
          items.push({
            productId: product.id,
            name: product.name,
            emoji: product.emoji,
            price: product.price,
            quantity,
          })
        }
      }

      const subtotal = roundMoney(items.reduce((sum, it) => sum + it.price * it.quantity, 0))
      const discountAmount = rand() < 0.15 ? roundMoney(subtotal * 0.1) : 0
      const tax = roundMoney((subtotal - discountAmount) * (taxRate / 100))
      const total = roundMoney(subtotal - discountAmount + tax)
      const paymentMethod = pick(['cash', 'cash', 'card', 'card', 'ewallet'])
      const amountReceived =
        paymentMethod === 'cash' ? Math.ceil(total / 5) * 5 + (rand() < 0.3 ? 5 : 0) : total

      orders.push({
        id: `seed-${daysAgo}-${i}`,
        number: 0, // assigned below once sorted chronologically
        createdAt: date.toISOString(),
        status: rand() < 0.06 ? 'refunded' : 'completed',
        items,
        subtotal,
        discount: { type: 'percent', value: discountAmount ? 10 : 0, amount: discountAmount },
        taxRate,
        tax,
        total,
        paymentMethod,
        amountReceived: roundMoney(amountReceived),
        change: roundMoney(amountReceived - total),
      })
    }
  }

  // Oldest first → assign sequential order numbers → newest first for display
  orders.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
  orders.forEach((order, index) => {
    order.number = 1001 + index
  })
  return orders.reverse()
}

