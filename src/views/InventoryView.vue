<script setup>
import { computed, ref } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import ConfirmModal from '@/components/ConfirmModal.vue'
import EmptyState from '@/components/EmptyState.vue'
import PageHeader from '@/components/PageHeader.vue'
import ProductFormModal from '@/components/ProductFormModal.vue'
import StockBadge from '@/components/StockBadge.vue'
import { useCartStore } from '@/stores/useCartStore'
import { useProductStore } from '@/stores/useProductStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useCurrency } from '@/composables/useCurrency'
import { useToast } from '@/composables/useToast'

const productStore = useProductStore()
const cart = useCartStore()
const settings = useSettingsStore()
const toast = useToast()
const { formatCurrency } = useCurrency()

/* ------------------------------- Filters ------------------------------- */
const search = ref('')
const category = ref('All')
const stockFilter = ref('all') // 'all' | 'low' | 'out'

const filteredProducts = computed(() => {
  const q = search.value.trim().toLowerCase()
  return productStore.products.filter((p) => {
    if (category.value !== 'All' && p.category !== category.value) return false
    if (q && !p.name.toLowerCase().includes(q)) return false
    if (stockFilter.value === 'low') return p.stock > 0 && p.stock <= settings.lowStockThreshold
    if (stockFilter.value === 'out') return p.stock <= 0
    return true
  })
})

function resetFilters() {
  search.value = ''
  category.value = 'All'
  stockFilter.value = 'all'
}

/* ---------------------------- Add / edit ---------------------------- */
const formOpen = ref(false)
const editingProduct = ref(null)

function openAdd() {
  editingProduct.value = null
  formOpen.value = true
}

function openEdit(product) {
  editingProduct.value = product
  formOpen.value = true
}

function saveProduct(data) {
  if (editingProduct.value) {
    productStore.updateProduct(editingProduct.value.id, data)
    toast.success(`${data.name} updated`)
  } else {
    const product = productStore.addProduct(data)
    toast.success(`${product.name} added to inventory`)
  }
  formOpen.value = false
}

/** Quick +/- stock adjustment directly from the table. */
function adjustStock(product, delta) {
  productStore.updateProduct(product.id, { ...product, stock: Math.max(0, product.stock + delta) })
}

/* ------------------------------- Delete ------------------------------- */
const deletingProduct = ref(null)

function confirmDelete() {
  const product = deletingProduct.value
  productStore.deleteProduct(product.id)
  cart.removeItem(product.id)
  toast.info(`${product.name} deleted`)
  deletingProduct.value = null
}
</script>

<template>
  <div class="scrollbar-thin h-full overflow-y-auto">
    <div class="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
      <PageHeader title="Inventory" :subtitle="`${productStore.products.length} products · ${formatCurrency(productStore.inventoryValue)} stock value`">
        <button type="button" class="btn btn-primary" @click="openAdd">
          <AppIcon name="plus" :size="18" />
          Add product
        </button>
      </PageHeader>

      <!-- Low stock banner -->
      <div
        v-if="productStore.lowStockProducts.length || productStore.outOfStockProducts.length"
        class="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
        role="status"
      >
        <AppIcon name="exclamation-triangle" :size="22" class="text-amber-500" />
        <p class="flex-1">
          <strong>{{ productStore.lowStockProducts.length }}</strong> low-stock and
          <strong>{{ productStore.outOfStockProducts.length }}</strong> out-of-stock products (threshold: {{ settings.lowStockThreshold }}).
        </p>
        <button type="button" class="btn btn-secondary min-h-[36px] py-1.5" @click="stockFilter = 'low'">Show low stock</button>
      </div>

      <!-- Filters -->
      <div class="card mb-5 grid gap-3 p-4 sm:grid-cols-[1fr_auto_auto]">
        <div class="relative">
          <label for="inventory-search" class="sr-only">Search inventory</label>
          <AppIcon name="search" class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input id="inventory-search" v-model="search" type="search" placeholder="Search by name…" class="input pl-11" />
        </div>
        <div>
          <label for="inventory-category" class="sr-only">Category</label>
          <select id="inventory-category" v-model="category" class="input">
            <option value="All">All categories</option>
            <option v-for="cat in productStore.categories" :key="cat" :value="cat">{{ cat }}</option>
          </select>
        </div>
        <div>
          <label for="inventory-stock" class="sr-only">Stock level</label>
          <select id="inventory-stock" v-model="stockFilter" class="input">
            <option value="all">All stock levels</option>
            <option value="low">Low stock</option>
            <option value="out">Out of stock</option>
          </select>
        </div>
      </div>

      <!-- Table -->
      <div class="card overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full min-w-[640px] text-left text-sm">
            <caption class="sr-only">Products and stock levels</caption>
            <thead class="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th scope="col" class="px-5 py-3 font-semibold">Product</th>
                <th scope="col" class="px-5 py-3 font-semibold">Category</th>
                <th scope="col" class="px-5 py-3 text-right font-semibold">Price</th>
                <th scope="col" class="px-5 py-3 font-semibold">Stock</th>
                <th scope="col" class="px-5 py-3 font-semibold">Status</th>
                <th scope="col" class="px-5 py-3 text-right font-semibold"><span class="sr-only">Actions</span></th>
              </tr>
            </thead>
            <TransitionGroup tag="tbody" name="fade" class="divide-y divide-slate-100 dark:divide-slate-800">
              <tr
                v-for="product in filteredProducts"
                :key="product.id"
                class="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40"
                :class="{ 'bg-red-50/40 dark:bg-red-500/5': product.stock <= 0 }"
              >
                <td class="px-5 py-3">
                  <div class="flex items-center gap-3">
                    <span class="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-xl dark:bg-slate-800" aria-hidden="true">
                      {{ product.emoji }}
                    </span>
                    <span class="font-semibold">{{ product.name }}</span>
                  </div>
                </td>
                <td class="px-5 py-3 text-slate-500 dark:text-slate-400">{{ product.category }}</td>
                <td class="px-5 py-3 text-right font-medium tabular-nums">{{ formatCurrency(product.price) }}</td>
                <td class="px-5 py-3">
                  <div class="flex items-center gap-1" role="group" :aria-label="`Adjust stock for ${product.name}`">
                    <button
                      type="button"
                      class="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 transition hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800"
                      :aria-label="`Decrease stock of ${product.name}`"
                      :disabled="product.stock <= 0"
                      @click="adjustStock(product, -1)"
                    >
                      <AppIcon name="minus" :size="14" />
                    </button>
                    <span class="w-10 text-center font-bold tabular-nums">{{ product.stock }}</span>
                    <button
                      type="button"
                      class="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 transition hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                      :aria-label="`Increase stock of ${product.name}`"
                      @click="adjustStock(product, 1)"
                    >
                      <AppIcon name="plus" :size="14" />
                    </button>
                  </div>
                </td>
                <td class="px-5 py-3"><StockBadge :stock="product.stock" /></td>
                <td class="px-5 py-3">
                  <div class="flex justify-end gap-1">
                    <button type="button" class="btn btn-ghost btn-icon" :aria-label="`Edit ${product.name}`" @click="openEdit(product)">
                      <AppIcon name="pencil" :size="18" />
                    </button>
                    <button
                      type="button"
                      class="btn btn-ghost btn-icon hover:!bg-red-50 hover:!text-red-600 dark:hover:!bg-red-500/10 dark:hover:!text-red-400"
                      :aria-label="`Delete ${product.name}`"
                      @click="deletingProduct = product"
                    >
                      <AppIcon name="trash" :size="18" />
                    </button>
                  </div>
                </td>
              </tr>
            </TransitionGroup>
          </table>
        </div>

        <EmptyState v-if="!filteredProducts.length" emoji="📦" title="No products match your filters">
          <button type="button" class="btn btn-secondary" @click="resetFilters">Reset filters</button>
        </EmptyState>
      </div>
    </div>

    <ProductFormModal :open="formOpen" :product="editingProduct" @close="formOpen = false" @save="saveProduct" />
    <ConfirmModal
      :open="!!deletingProduct"
      title="Delete product?"
      :message="deletingProduct ? `“${deletingProduct.name}” will be removed from inventory and the current cart. Past orders are kept.` : ''"
      confirm-label="Delete"
      danger
      @cancel="deletingProduct = null"
      @confirm="confirmDelete"
    />
  </div>
</template>

