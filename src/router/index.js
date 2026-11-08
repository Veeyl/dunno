import { createRouter, createWebHistory } from 'vue-router'
import PosView from '@/views/PosView.vue'

/**
 * Application routes. The POS view is loaded eagerly (it's the landing page);
 * the others are lazy-loaded to keep the initial bundle small.
 */
const routes = [
  { path: '/', redirect: '/pos' },
  { path: '/pos', name: 'pos', component: PosView, meta: { title: 'Point of Sale' } },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('@/views/DashboardView.vue'),
    meta: { title: 'Dashboard' },
  },
  {
    path: '/inventory',
    name: 'inventory',
    component: () => import('@/views/InventoryView.vue'),
    meta: { title: 'Inventory' },
  },
  {
    path: '/orders',
    name: 'orders',
    component: () => import('@/views/OrdersView.vue'),
    meta: { title: 'Orders' },
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('@/views/SettingsView.vue'),
    meta: { title: 'Settings' },
  },
  // Unknown URLs fall back to the POS screen
  { path: '/:pathMatch(.*)*', redirect: '/pos' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Keep the browser tab title in sync with the current page
router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} · POS` : 'POS'
})

export default router

