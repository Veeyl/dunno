<script setup>
import { ref } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import Sidebar from '@/components/Sidebar.vue'
import ToastContainer from '@/components/ToastContainer.vue'
import { useCartStore } from '@/stores/useCartStore'
import { useSettingsStore } from '@/stores/useSettingsStore'

/**
 * App shell: sidebar + routed page + global toasts.
 * Stores are instantiated here so theme/cart state is ready app-wide.
 */
const settings = useSettingsStore()
const cart = useCartStore()
const sidebarOpen = ref(false)
</script>

<template>
  <a href="#main-content" class="skip-link">Skip to main content</a>

  <div class="flex h-dvh overflow-hidden">
    <Sidebar :open="sidebarOpen" @close="sidebarOpen = false" />

    <div class="flex min-w-0 flex-1 flex-col">
      <!-- Mobile top bar -->
      <header
        class="flex h-14 shrink-0 items-center gap-2 border-b border-slate-200 bg-white px-3 dark:border-slate-800 dark:bg-slate-900 md:hidden"
      >
        <button
          type="button"
          class="btn btn-ghost btn-icon"
          aria-label="Open menu"
          :aria-expanded="sidebarOpen"
          @click="sidebarOpen = true"
        >
          <AppIcon name="menu" :size="24" />
        </button>
        <p class="flex-1 truncate font-bold">{{ settings.shopName }}</p>
        <RouterLink to="/pos" class="btn btn-ghost btn-icon relative" :aria-label="`Cart, ${cart.itemCount} items`">
          <AppIcon name="shopping-cart" :size="22" />
          <span
            v-if="cart.itemCount"
            class="absolute right-0.5 top-0.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-primary-600 px-1 text-[11px] font-bold text-white"
            aria-hidden="true"
          >
            {{ cart.itemCount }}
          </span>
        </RouterLink>
      </header>

      <main id="main-content" class="min-h-0 flex-1" tabindex="-1">
        <RouterView v-slot="{ Component }">
          <Transition name="fade" mode="out-in">
            <component :is="Component" />
          </Transition>
        </RouterView>
      </main>
    </div>
  </div>

  <ToastContainer />
</template>

