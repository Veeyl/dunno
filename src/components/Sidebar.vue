<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppIcon from './AppIcon.vue'
import { useCartStore } from '@/stores/useCartStore'
import { useProductStore } from '@/stores/useProductStore'
import { useSettingsStore } from '@/stores/useSettingsStore'

/**
 * Responsive navigation:
 * - Mobile  (< md):  off-canvas drawer toggled from the top bar
 * - Tablet  (md–xl): compact icon rail (labels visually hidden, still read by screen readers)
 * - Desktop (≥ xl):  full sidebar with labels
 */
const props = defineProps({
  open: { type: Boolean, default: false },
})
const emit = defineEmits(['close'])

const route = useRoute()
const cart = useCartStore()
const productStore = useProductStore()
const settings = useSettingsStore()

const NAV_ITEMS = [
  { to: '/pos', label: 'POS', icon: 'shopping-cart' },
  { to: '/dashboard', label: 'Dashboard', icon: 'chart-bar' },
  { to: '/inventory', label: 'Inventory', icon: 'cube' },
  { to: '/orders', label: 'Orders', icon: 'document-text' },
  { to: '/settings', label: 'Settings', icon: 'adjustments' },
]

// Track the mobile breakpoint so the closed drawer can be made `inert`
// (removes its links from the tab order and the accessibility tree).
const mobileQuery = window.matchMedia('(max-width: 767px)')
const isMobile = ref(mobileQuery.matches)
const updateMobile = (e) => (isMobile.value = e.matches)
onMounted(() => mobileQuery.addEventListener('change', updateMobile))
onBeforeUnmount(() => mobileQuery.removeEventListener('change', updateMobile))

// Close the drawer after navigating
watch(
  () => route.path,
  () => emit('close'),
)

function badgeFor(path) {
  if (path === '/pos' && cart.itemCount) return { value: cart.itemCount, label: 'items in cart', tone: 'primary' }
  const alerts = productStore.lowStockProducts.length + productStore.outOfStockProducts.length
  if (path === '/inventory' && alerts) return { value: alerts, label: 'stock alerts', tone: 'warning' }
  return null
}
</script>

<template>
  <!-- Mobile backdrop -->
  <Transition name="fade">
    <div v-if="open" class="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm md:hidden" aria-hidden="true" @click="emit('close')" />
  </Transition>

  <aside
    class="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform duration-300 ease-out dark:border-slate-800 dark:bg-slate-900 md:static md:w-20 md:translate-x-0 xl:w-64"
    :class="open ? 'translate-x-0 shadow-2xl' : '-translate-x-full'"
    :inert="isMobile && !props.open"
    aria-label="Main"
    @keydown.esc="emit('close')"
  >
    <!-- Brand -->
    <div class="flex h-16 items-center gap-3 px-5 md:justify-center md:px-0 xl:justify-start xl:px-5">
      <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white shadow-lg shadow-primary-600/30">
        <AppIcon name="shopping-bag" :size="22" />
      </div>
      <div class="min-w-0 md:max-xl:sr-only">
        <p class="truncate font-bold leading-tight">{{ settings.shopName }}</p>
        <p class="text-xs text-slate-500 dark:text-slate-400">Point of Sale</p>
      </div>
      <button type="button" class="btn btn-ghost btn-icon ml-auto md:hidden" aria-label="Close menu" @click="emit('close')">
        <AppIcon name="x" />
      </button>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 overflow-y-auto px-3 py-4" aria-label="Primary">
      <ul class="space-y-1">
        <li v-for="item in NAV_ITEMS" :key="item.to">
          <RouterLink
            :to="item.to"
            class="group relative flex min-h-[48px] items-center gap-3 rounded-xl px-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white md:justify-center xl:justify-start"
            active-class="!bg-primary-50 !text-primary-700 dark:!bg-primary-500/10 dark:!text-primary-300"
            :title="item.label"
          >
            <AppIcon :name="item.icon" :size="22" />
            <span class="md:max-xl:sr-only">{{ item.label }}</span>
            <span
              v-if="badgeFor(item.to)"
              class="ml-auto flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-[11px] font-bold text-white md:absolute md:right-1 md:top-1 xl:static"
              :class="badgeFor(item.to).tone === 'primary' ? 'bg-primary-600' : 'bg-amber-500'"
            >
              {{ badgeFor(item.to).value }}
              <span class="sr-only">{{ badgeFor(item.to).label }}</span>
            </span>
          </RouterLink>
        </li>
      </ul>
    </nav>

    <!-- Footer: theme toggle + shortcut hints -->
    <div class="space-y-3 border-t border-slate-200 p-3 dark:border-slate-800">
      <button
        type="button"
        class="btn btn-ghost w-full md:px-0 xl:justify-start xl:px-3"
        role="switch"
        :aria-checked="settings.darkMode"
        :title="settings.darkMode ? 'Switch to light mode' : 'Switch to dark mode'"
        @click="settings.toggleDarkMode()"
      >
        <AppIcon :name="settings.darkMode ? 'sun' : 'moon'" :size="22" />
        <span class="md:max-xl:sr-only">Dark mode</span>
      </button>
      <p class="hidden px-3 text-xs leading-relaxed text-slate-400 xl:block">
        <kbd class="kbd">/</kbd> search &nbsp;·&nbsp; <kbd class="kbd">Enter</kbd> checkout
      </p>
    </div>
  </aside>
</template>

