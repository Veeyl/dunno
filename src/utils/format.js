/** Shared formatting helpers and constants. */

/** Round to 2 decimals, avoiding floating point artifacts like 0.1 + 0.2. */
export function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100
}

export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash', icon: 'banknotes', hint: 'Enter amount received' },
  { value: 'card', label: 'Card', icon: 'credit-card', hint: 'Tap, insert or swipe' },
  { value: 'ewallet', label: 'E-wallet', icon: 'device-phone-mobile', hint: 'Scan QR code' },
]

export function paymentLabel(value) {
  return PAYMENT_METHODS.find((m) => m.value === value)?.label ?? value
}

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
})
const timeFormatter = new Intl.DateTimeFormat(undefined, { timeStyle: 'short' })

export function formatDateTime(iso) {
  return dateTimeFormatter.format(new Date(iso))
}

export function formatTime(iso) {
  return timeFormatter.format(new Date(iso))
}

export function isSameDay(a, b) {
  const da = new Date(a)
  const db = new Date(b)
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  )
}

export function isToday(iso) {
  return isSameDay(iso, new Date())
}

