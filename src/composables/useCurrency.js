import { useSettingsStore } from '@/stores/useSettingsStore'

const numberFormatter = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/**
 * Formats numbers as money using the currency symbol from Settings.
 *   formatCurrency(12.5)  → "$12.50"
 *   formatCurrency(-3)    → "-$3.00"
 */
export function useCurrency() {
  const settings = useSettingsStore()

  function formatCurrency(value) {
    const amount = Number(value) || 0
    const sign = amount < 0 ? '-' : ''
    return `${sign}${settings.currencySymbol}${numberFormatter.format(Math.abs(amount))}`
  }

  return { formatCurrency }
}

