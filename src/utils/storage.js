/**
 * Thin wrapper around localStorage with JSON (de)serialization and
 * graceful failure (e.g. private mode, quota exceeded, corrupted data).
 */

export const STORAGE_KEYS = {
  products: 'pos.products',
  cart: 'pos.cart',
  orders: 'pos.orders',
  settings: 'pos.settings',
}

export function loadState(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export function saveState(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* Storage unavailable — app keeps working in-memory */
  }
}

/** Remove every key this app writes (used by "Reset demo data"). */
export function clearAllState() {
  Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key))
}

