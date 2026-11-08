<script setup>
import { computed, onMounted, ref } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import CartPanel from '@/components/CartPanel.vue'
import CheckoutModal from '@/components/CheckoutModal.vue'
import EmptyState from '@/components/EmptyState.vue'
import ProductCard from '@/components/ProductCard.vue'
import ReceiptModal from '@/components/ReceiptModal.vue'
import { useCartStore } from '@/stores/useCartStore'
import { useOrderStore } from '@/stores/useOrderStore'
import { useProductStore } from '@/stores/useProductStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useCurrency } from '@/composables/useCurrency'
import { useKeyboardShortcuts } from '@/composables/useKeyboardShortcuts'
import { useToast } from '@/composables/useToast'

const productStore = useProductStore()
const cart = useCartStore()
const orderStore = useOrderStore()
const settings = useSettingsStore()
const toast = useToast()
const { formatCurrency } = useCurrency()

/* ------------------------------ Filtering ------------------------------ */
const searchInput = ref(null)
const searchQuery = ref('')
const activeCategory = ref('All')
const tabs = computed(() => ['All', ...productStore.categories])

const filteredProducts = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  return productStore.products.filter((p) => {
    const inCategory = activeCategory.value === 'All' || p.category === activeCategory.value
    const matches = !query || p.name.toLowerCase().includes(query) || p.category.toLowerCase().includes(query)
    return inCategory && matches
  })
})

function countFor(category) {
  return category === 'All'
    ? productStore.products.length
    : productStore.products.filter((p) => p.category === category).length
}

/** Enter inside the search box adds the product when there's exactly one match. */
function onSearchEnter() {
  if (filteredProducts.value.length === 1) addToCart(filteredProducts.value[0])
}

function clearSearch() {
  searchQuery.value = ''
  searchInput.value?.focus()
}

/* -------------------------------- Cart -------------------------------- */
const cartDrawerOpen = ref(false) // only used below the lg breakpoint

function addToCart(product) {
  const result = cart.addItem(product.id)
  if (result.ok) {
    toast.success(`${product.emoji} ${product.name} added`, { duration: 1500 })
  } else if (result.reason === 'out-of-stock') {
    toast.error(`${product.name} is out of stock`)
  } else {
    toast.warning(`Only ${result.stock} ${product.name} available — all are in the cart`)
  }
}

/* ------------------------------ Checkout ------------------------------ */
const checkoutOpen = ref(false)
const completedOrder = ref(null)
const isModalOpen = computed(() => checkoutOpen.value || !!completedOrder.value)

function openCheckout() {
  if (cart.isEmpty) {
    toast.info('Add some items before checking out')
    return
  }
  // Guard against stock having changed since items were added
  const adjusted = cart.reconcileWithStock()
  if (adjusted.length) {
    toast.warning(`Cart adjusted to available stock: ${adjusted.join(', ')}`)
    return
  }
  cartDrawerOpen.value = false
  checkoutOpen.value = true
}

function completeCheckout(payment) {
  const items = cart.lines.map(({ productId, name, emoji, price, quantity }) => ({
    productId,
    name,
    emoji,
    price,
    quantity,
  }))

  const order = orderStore.createOrder({
    items,
    subtotal: cart.subtotal,
    discount: { type: cart.discountType, value: Number(cart.discountValue) || 0, amount: cart.discountAmount },
    taxRate: settings.taxRate,
    tax: cart.taxAmount,
    total: cart.total,
    ...payment,
  })

  productStore.decrementStock(items)
  cart.clearCart()
  checkoutOpen.value = false
  completedOrder.value = order

  toast.success(`Order #${order.number} completed · ${formatCurrency(order.total)}`, { title: 'Payment received' })
  notifyLowStock(items)
}

/** Warn about products that just hit the low-stock threshold or ran out. */
function notifyLowStock(items) {
  items.forEach(({ productId }) => {
    const product = productStore.getById(productId)
    if (!product) return
    if (product.stock === 0) toast.error(`${product.name} is now out of stock`, { title: 'Out of stock' })
    else if (product.stock <= settings.lowStockThreshold)
      toast.warning(`${product.name}: only ${product.stock} left`, { title: 'Low stock' })
  })
}

/* --------------------------- Keyboard shortcuts --------------------------- */
useKeyboardShortcuts({
  '/': () => {
    if (isModalOpen.value) return false
    searchInput.value?.focus()
  },
  Enter: () => {
    if (isModalOpen.value) return false
    openCheckout()
  },
})

onMounted(() => {
  const adjusted = cart.reconcileWithStock()
  if (adjusted.length) toast.warning(`Cart adjusted to available stock: ${adjusted.join(', ')}`)
})
</script>

<template>
  <div class="flex h-full">
    <!-- Products -->
    <section class="flex min-w-0 flex-1 flex-col" aria-labelledby="products-heading">
      <div class="space-y-4 border-b border-slate-200 bg-slate-100/80 px-4 pb-4 pt-5 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80 sm:px-6">
        <div class="flex items-center justify-between gap-4">
          <h1 id="products-heading" class="text-2xl font-bold tracking-tight">Products</h1>
          <p class="hidden text-sm text-slate-500 dark:text-slate-400 sm:block">
            Order <span class="font-semibold text-slate-700 dark:text-slate-200">#{{ orderStore.nextOrderNumber }}</span>
          </p>
        </div>

        <!-- Search -->
        <div class="relative">
          <label for="product-search" class="sr-only">Search products</label>
          <AppIcon name="search" class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="product-search"
            ref="searchInput"
            v-model="searchQuery"
            type="search"
            autocomplete="off"
            placeholder="Search products…"
            class="input h-12 pl-11 pr-20 text-base"
            @keydown.enter.prevent="onSearchEnter"
            @keydown.esc="searchQuery ? (searchQuery = '') : $event.target.blur()"
          />
          <button
            v-if="searchQuery"
            type="button"
            class="absolute right-12 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700"
            aria-label="Clear search"
            @click="clearSearch"
          >
            <AppIcon name="x" :size="16" />
          </button>
          <kbd class="kbd absolute right-3 top-1/2 -translate-y-1/2" aria-hidden="true">/</kbd>
        </div>

        <!-- Category tabs -->
        <div class="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 sm:-mx-6 sm:px-6" role="tablist" aria-label="Product categories">
          <button
            v-for="tab in tabs"
            :key="tab"
            type="button"
            role="tab"
            :aria-selected="activeCategory === tab"
            aria-controls="product-grid"
            class="flex min-h-[44px] shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-all"
            :class="
              activeCategory === tab
                ? 'bg-primary-600 text-white shadow-md shadow-primary-600/25'
                : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
            "
            @click="activeCategory = tab"
          >
            {{ tab }}
            <span
              class="rounded-full px-1.5 text-xs"
              :class="activeCategory === tab ? 'bg-white/20' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'"
            >
              {{ countFor(tab) }}
            </span>
          </button>
        </div>
      </div>

      <!-- Grid -->
      <div id="product-grid" class="scrollbar-thin flex-1 overflow-y-auto p-4 pb-28 sm:p-6 sm:pb-28 lg:pb-6" role="tabpanel">
        <p class="sr-only" aria-live="polite">{{ filteredProducts.length }} products shown</p>
        <Transition name="fade" mode="out-in">
          <EmptyState
            v-if="filteredProducts.length === 0"
            emoji="🔍"
            title="No products found"
            :description="searchQuery ? `Nothing matches “${searchQuery}” in ${activeCategory}.` : 'This category has no products yet.'"
          >
            <button v-if="searchQuery" type="button" class="btn btn-secondary" @click="clearSearch">Clear search</button>
          </EmptyState>

          <TransitionGroup
            v-else
            tag="ul"
            name="grid-item"
            class="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
          >
            <li v-for="product in filteredProducts" :key="product.id">
              <ProductCard :product="product" :in-cart="cart.quantityOf(product.id)" @add="addToCart" />
            </li>
          </TransitionGroup>
        </Transition>
      </div>
    </section>

    <!-- Cart: static column on lg+, slide-over drawer below -->
    <Transition name="fade">
      <div
        v-if="cartDrawerOpen"
        class="fixed inset-0 z-30 bg-slate-900/50 backdrop-blur-sm lg:hidden"
        aria-hidden="true"
        @click="cartDrawerOpen = false"
      />
    </Transition>
    <aside
      class="fixed inset-y-0 right-0 z-40 w-full max-w-md border-l border-slate-200 shadow-2xl transition-transform duration-300 ease-out dark:border-slate-800 lg:static lg:z-auto lg:w-[380px] lg:max-w-none lg:translate-x-0 lg:shadow-none xl:w-[420px]"
      :class="cartDrawerOpen ? 'translate-x-0' : 'translate-x-full'"
      aria-label="Cart"
    >
      <CartPanel :closable="cartDrawerOpen" @checkout="openCheckout" @close="cartDrawerOpen = false" />
    </aside>

    <!-- Floating cart summary button (below lg) -->
    <div class="fixed inset-x-0 bottom-0 z-20 p-4 lg:hidden">
      <button
        type="button"
        class="btn btn-primary btn-lg w-full justify-between rounded-2xl shadow-xl"
        :aria-label="`View cart: ${cart.itemCount} items, total ${formatCurrency(cart.total)}`"
        @click="cartDrawerOpen = true"
      >
        <span class="flex items-center gap-2">
          <AppIcon name="shopping-cart" :size="22" />
          View cart
          <span class="rounded-full bg-white/20 px-2 py-0.5 text-sm">{{ cart.itemCount }}</span>
        </span>
        <span class="tabular-nums">{{ formatCurrency(cart.total) }}</span>
      </button>
    </div>

    <CheckoutModal :open="checkoutOpen" :total="cart.total" @close="checkoutOpen = false" @confirm="completeCheckout" />
    <ReceiptModal :order="completedOrder" @close="completedOrder = null" />
  </div>
</template>

