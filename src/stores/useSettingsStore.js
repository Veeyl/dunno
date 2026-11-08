import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { loadState, saveState, STORAGE_KEYS } from '@/utils/storage'

const prefersDark = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches

/**
 * Shop-wide preferences: name, tax, currency, theme and low-stock threshold.
 * Persisted to localStorage on every change.
 */
export const useSettingsStore = defineStore('settings', () => {
  const saved = loadState(STORAGE_KEYS.settings, {})

  const shopName = ref(saved.shopName ?? 'Brew & Bite Café')
  const taxRate = ref(saved.taxRate ?? 8) // percentage
  const currencySymbol = ref(saved.currencySymbol ?? '$')
  const lowStockThreshold = ref(saved.lowStockThreshold ?? 5)
  const darkMode = ref(saved.darkMode ?? prefersDark())

  /** Bulk update from the settings form. Values are sanitized here. */
  function updateSettings(values) {
    if (values.shopName !== undefined) shopName.value = String(values.shopName).trim() || 'My Shop'
    if (values.taxRate !== undefined) taxRate.value = clamp(Number(values.taxRate) || 0, 0, 100)
    if (values.currencySymbol !== undefined)
      currencySymbol.value = String(values.currencySymbol).trim() || '$'
    if (values.lowStockThreshold !== undefined)
      lowStockThreshold.value = clamp(Math.round(Number(values.lowStockThreshold) || 0), 0, 999)
  }

  function toggleDarkMode() {
    darkMode.value = !darkMode.value
  }

  // Persist whenever anything changes
  watch(
    [shopName, taxRate, currencySymbol, lowStockThreshold, darkMode],
    () => {
      saveState(STORAGE_KEYS.settings, {
        shopName: shopName.value,
        taxRate: taxRate.value,
        currencySymbol: currencySymbol.value,
        lowStockThreshold: lowStockThreshold.value,
        darkMode: darkMode.value,
      })
    },
  )

  // Reflect the theme on <html> so Tailwind's `dark:` variants apply
  watch(
    darkMode,
    (isDark) => document.documentElement.classList.toggle('dark', isDark),
    { immediate: true },
  )

  return {
    shopName,
    taxRate,
    currencySymbol,
    lowStockThreshold,
    darkMode,
    updateSettings,
    toggleDarkMode,
  }
})

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

