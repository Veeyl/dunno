import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { loadState, saveState, STORAGE_KEYS } from '@/utils/storage'
import { roundMoney } from '@/utils/format'
import { useProductStore } from './useProductStore'
import { useSettingsStore } from './useSettingsStore'

/**
 * The current (in-progress) order.
 *
 * Cart entries only store `{ productId, quantity }`; name/price/emoji are read
 * live from the product store so edits in Inventory are reflected immediately.
 */
export const useCartStore = defineStore('cart', () => {
  const productStore = useProductStore()
  const settings = useSettingsStore()

  const saved = loadState(STORAGE_KEYS.cart, {})
  const items = ref(saved.items ?? [])
  const discountType = ref(saved.discountType ?? 'percent') // 'percent' | 'fixed'
  const discountValue = ref(saved.discountValue ?? 0)

  /* ---------------------------- Derived state ---------------------------- */

  /** Cart rows enriched with product data. Rows for deleted products are dropped. */
  const lines = computed(() =>
    items.value
      .map((item) => {
        const product = productStore.getById(item.productId)
        if (!product) return null
        return {
          productId: product.id,
          name: product.name,
          emoji: product.emoji,
          price: product.price,
          stock: product.stock,
          quantity: item.quantity,
          lineTotal: roundMoney(product.price * item.quantity),
        }
      })
      .filter(Boolean),
  )

  const isEmpty = computed(() => lines.value.length === 0)
  const itemCount = computed(() => lines.value.reduce((n, line) => n + line.quantity, 0))
  const subtotal = computed(() => roundMoney(lines.value.reduce((s, l) => s + l.lineTotal, 0)))

  const discountAmount = computed(() => {
    const value = Math.max(0, Number(discountValue.value) || 0)
    const amount =
      discountType.value === 'percent'
        ? (subtotal.value * Math.min(value, 100)) / 100
        : Math.min(value, subtotal.value)
    return roundMoney(amount)
  })

  // Tax is applied after the discount
  const taxAmount = computed(() =>
    roundMoney((subtotal.value - discountAmount.value) * (settings.taxRate / 100)),
  )
  const total = computed(() => roundMoney(subtotal.value - discountAmount.value + taxAmount.value))

  /* ------------------------------- Actions ------------------------------- */

  function quantityOf(productId) {
    return items.value.find((i) => i.productId === productId)?.quantity ?? 0
  }

  /**
   * Add one unit of a product, enforcing available stock.
   * @returns {{ ok: boolean, reason?: 'out-of-stock' | 'max-stock', stock?: number }}
   */
  function addItem(productId) {
    const product = productStore.getById(productId)
    const stock = product?.stock ?? 0
    if (stock <= 0) return { ok: false, reason: 'out-of-stock', stock: 0 }

    const existing = items.value.find((i) => i.productId === productId)
    const current = existing?.quantity ?? 0
    if (current >= stock) return { ok: false, reason: 'max-stock', stock }

    if (existing) existing.quantity++
    else items.value.push({ productId, quantity: 1 })
    return { ok: true, stock }
  }

  function decrement(productId) {
    const existing = items.value.find((i) => i.productId === productId)
    if (!existing) return
    if (existing.quantity > 1) existing.quantity--
    else removeItem(productId)
  }

  function removeItem(productId) {
    items.value = items.value.filter((i) => i.productId !== productId)
  }

  function clearCart() {
    items.value = []
    discountValue.value = 0
  }

  /**
   * Make sure the cart never exceeds current stock (stock may change in
   * Inventory while items sit in the cart). Returns names of adjusted items.
   */
  function reconcileWithStock() {
    const adjusted = []
    items.value = items.value
      .map((item) => {
        const product = productStore.getById(item.productId)
        if (!product) return null
        if (item.quantity > product.stock) {
          adjusted.push(product.name)
          return product.stock > 0 ? { ...item, quantity: product.stock } : null
        }
        return item
      })
      .filter(Boolean)
    return adjusted
  }

  watch(
    [items, discountType, discountValue],
    () =>
      saveState(STORAGE_KEYS.cart, {
        items: items.value,
        discountType: discountType.value,
        discountValue: discountValue.value,
      }),
    { deep: true },
  )

  return {
    items,
    discountType,
    discountValue,
    lines,
    isEmpty,
    itemCount,
    subtotal,
    discountAmount,
    taxAmount,
    total,
    quantityOf,
    addItem,
    decrement,
    removeItem,
    clearCart,
    reconcileWithStock,
  }
})

