import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { mockProducts, CATEGORIES } from '@/data/mockProducts'
import { loadState, saveState, STORAGE_KEYS } from '@/utils/storage'
import { roundMoney } from '@/utils/format'
import { useSettingsStore } from './useSettingsStore'

/**
 * Product catalogue + inventory levels.
 */
export const useProductStore = defineStore('products', () => {
  const settings = useSettingsStore()

  const products = ref(loadState(STORAGE_KEYS.products, structuredClone(mockProducts)))
  const categories = CATEGORIES

  /** O(1) lookups by id */
  const productMap = computed(() => new Map(products.value.map((p) => [p.id, p])))

  const lowStockProducts = computed(() =>
    products.value.filter((p) => p.stock > 0 && p.stock <= settings.lowStockThreshold),
  )
  const outOfStockProducts = computed(() => products.value.filter((p) => p.stock <= 0))
  const inventoryValue = computed(() =>
    roundMoney(products.value.reduce((sum, p) => sum + p.price * p.stock, 0)),
  )

  function getById(id) {
    return productMap.value.get(id)
  }

  /** Normalizes form input into a clean product object. */
  function sanitize(data) {
    return {
      name: String(data.name ?? '').trim(),
      category: CATEGORIES.includes(data.category) ? data.category : CATEGORIES[0],
      price: roundMoney(Math.max(0, Number(data.price) || 0)),
      stock: Math.max(0, Math.floor(Number(data.stock) || 0)),
      emoji: String(data.emoji ?? '').trim() || '📦',
    }
  }

  function addProduct(data) {
    const product = { id: `p${Date.now().toString(36)}`, ...sanitize(data) }
    products.value.unshift(product)
    return product
  }

  function updateProduct(id, data) {
    const product = getById(id)
    if (product) Object.assign(product, sanitize(data))
    return product
  }

  function deleteProduct(id) {
    products.value = products.value.filter((p) => p.id !== id)
  }

  /** Reduce stock after a sale. `items` = [{ productId, quantity }] */
  function decrementStock(items) {
    items.forEach(({ productId, quantity }) => {
      const product = getById(productId)
      if (product) product.stock = Math.max(0, product.stock - quantity)
    })
  }

  /** Return stock (e.g. after a refund). */
  function restock(items) {
    items.forEach(({ productId, quantity }) => {
      const product = getById(productId)
      if (product) product.stock += quantity
    })
  }

  watch(products, (value) => saveState(STORAGE_KEYS.products, value), { deep: true })

  return {
    products,
    categories,
    lowStockProducts,
    outOfStockProducts,
    inventoryValue,
    getById,
    addProduct,
    updateProduct,
    deleteProduct,
    decrementStock,
    restock,
  }
})

