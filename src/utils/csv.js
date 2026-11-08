import { formatDateTime, PAYMENT_METHODS, paymentLabel, roundMoney } from '@/utils/format'

/**
 * Escape a single CSV cell value according to RFC 4180.
 */
export function escapeCsvCell(value) {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

/**
 * Convert an array of row arrays into a CSV string with UTF-8 BOM for Excel.
 */
export function toCsvString(rows) {
  const body = rows.map((row) => row.map(escapeCsvCell).join(',')).join('\r\n')
  return `\uFEFF${body}\r\n`
}

/**
 * Trigger a browser file download for the given CSV rows.
 */
export function downloadCsv(filename, rows) {
  const csv = toCsvString(rows)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Compute aggregated metrics for each payment method from a list of orders.
 */
export function computePaymentBreakdown(orders) {
  return PAYMENT_METHODS.map((pm) => {
    const matching = orders.filter((o) => o.paymentMethod === pm.value)
    const completed = matching.filter((o) => o.status === 'completed')
    const refunded = matching.filter((o) => o.status === 'refunded')
    const subtotal = roundMoney(completed.reduce((s, o) => s + (o.subtotal || 0), 0))
    const discount = roundMoney(completed.reduce((s, o) => s + (o.discount?.amount || 0), 0))
    const tax = roundMoney(completed.reduce((s, o) => s + (o.tax || 0), 0))
    const completedTotal = roundMoney(completed.reduce((s, o) => s + o.total, 0))
    const refundedTotal = roundMoney(refunded.reduce((s, o) => s + o.total, 0))

    return {
      value: pm.value,
      label: pm.label,
      icon: pm.icon,
      totalOrders: matching.length,
      completedCount: completed.length,
      refundedCount: refunded.length,
      subtotal,
      discount,
      tax,
      completedTotal,
      refundedTotal,
    }
  })
}

/**
 * Build CSV rows for a list of orders, including per-payment-method columns
 * and a summary breakdown by payment type at the bottom.
 */
export function buildOrdersCsvRows(orders) {
  const header = [
    'Order #',
    'Date',
    'ISO Timestamp',
    'Status',
    'Payment Method',
    'Items Count',
    'Items Summary',
    'Subtotal',
    'Discount',
    'Tax Rate (%)',
    'Tax',
    'Total',
    ...PAYMENT_METHODS.map((pm) => `${pm.label} Amount`),
    'Amount Received',
    'Change',
    'Refunded At',
  ]

  const transactionRows = orders.map((order) => {
    const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0)
    const itemsText = order.items
      .map((item) => `${item.name} x${item.quantity} (@ ${roundMoney(item.price).toFixed(2)})`)
      .join('; ')
    const discountAmount = roundMoney(order.discount?.amount || 0)

    const paymentColumns = PAYMENT_METHODS.map((pm) =>
      order.paymentMethod === pm.value ? roundMoney(order.total).toFixed(2) : (0).toFixed(2),
    )

    return [
      `#${order.number}`,
      formatDateTime(order.createdAt),
      order.createdAt,
      order.status,
      paymentLabel(order.paymentMethod),
      itemCount,
      itemsText,
      roundMoney(order.subtotal).toFixed(2),
      discountAmount.toFixed(2),
      order.taxRate ?? 0,
      roundMoney(order.tax).toFixed(2),
      roundMoney(order.total).toFixed(2),
      ...paymentColumns,
      roundMoney(order.amountReceived ?? order.total).toFixed(2),
      roundMoney(order.change ?? 0).toFixed(2),
      order.refundedAt ? formatDateTime(order.refundedAt) : '',
    ]
  })

  const breakdown = computePaymentBreakdown(orders)
  const summaryRows = [
    [],
    ['SUMMARY BY PAYMENT TYPE'],
    [
      'Payment Method',
      'Completed Orders',
      'Refunded Orders',
      'Total Orders',
      'Subtotal (Completed)',
      'Discounts (Completed)',
      'Tax (Completed)',
      'Completed Sales',
      'Refunded Total',
    ],
    ...breakdown.map((b) => [
      b.label,
      b.completedCount,
      b.refundedCount,
      b.totalOrders,
      b.subtotal.toFixed(2),
      b.discount.toFixed(2),
      b.tax.toFixed(2),
      b.completedTotal.toFixed(2),
      b.refundedTotal.toFixed(2),
    ]),
    [
      'TOTAL',
      breakdown.reduce((s, b) => s + b.completedCount, 0),
      breakdown.reduce((s, b) => s + b.refundedCount, 0),
      breakdown.reduce((s, b) => s + b.totalOrders, 0),
      roundMoney(breakdown.reduce((s, b) => s + b.subtotal, 0)).toFixed(2),
      roundMoney(breakdown.reduce((s, b) => s + b.discount, 0)).toFixed(2),
      roundMoney(breakdown.reduce((s, b) => s + b.tax, 0)).toFixed(2),
      roundMoney(breakdown.reduce((s, b) => s + b.completedTotal, 0)).toFixed(2),
      roundMoney(breakdown.reduce((s, b) => s + b.refundedTotal, 0)).toFixed(2),
    ],
  ]

  return [header, ...transactionRows, ...summaryRows]
}

/**
 * Build CSV rows specifically for the payment methods breakdown summary.
 */
export function buildPaymentSummaryCsvRows(orders) {
  const breakdown = computePaymentBreakdown(orders)
  return [
    [
      'Payment Method',
      'Completed Orders',
      'Refunded Orders',
      'Total Orders',
      'Subtotal (Completed)',
      'Discounts (Completed)',
      'Tax (Completed)',
      'Completed Sales',
      'Refunded Total',
    ],
    ...breakdown.map((b) => [
      b.label,
      b.completedCount,
      b.refundedCount,
      b.totalOrders,
      b.subtotal.toFixed(2),
      b.discount.toFixed(2),
      b.tax.toFixed(2),
      b.completedTotal.toFixed(2),
      b.refundedTotal.toFixed(2),
    ]),
    [
      'TOTAL',
      breakdown.reduce((s, b) => s + b.completedCount, 0),
      breakdown.reduce((s, b) => s + b.refundedCount, 0),
      breakdown.reduce((s, b) => s + b.totalOrders, 0),
      roundMoney(breakdown.reduce((s, b) => s + b.subtotal, 0)).toFixed(2),
      roundMoney(breakdown.reduce((s, b) => s + b.discount, 0)).toFixed(2),
      roundMoney(breakdown.reduce((s, b) => s + b.tax, 0)).toFixed(2),
      roundMoney(breakdown.reduce((s, b) => s + b.completedTotal, 0)).toFixed(2),
      roundMoney(breakdown.reduce((s, b) => s + b.refundedTotal, 0)).toFixed(2),
    ],
  ]
}

