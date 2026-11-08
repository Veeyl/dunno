<script setup>
import { ref, watch } from 'vue'
import AppIcon from './AppIcon.vue'
import BaseModal from './BaseModal.vue'
import ReceiptContent from './ReceiptContent.vue'
import StatusBadge from './StatusBadge.vue'
import { buildOrdersCsvRows, downloadCsv } from '@/utils/csv'
import { formatDateTime } from '@/utils/format'

/**
 * Order detail view used on the Orders page: receipt + print + refund.
 * Refund uses a two-step confirmation to avoid accidents.
 */
const props = defineProps({
  order: { type: Object, default: null },
})
const emit = defineEmits(['close', 'refund'])

const confirmingRefund = ref(false)
watch(
  () => props.order?.id,
  () => (confirmingRefund.value = false),
)

function printReceipt() {
  window.print()
}

function saveOrderCsv() {
  if (!props.order) return
  downloadCsv(`order-${props.order.number}.csv`, buildOrdersCsvRows([props.order]))
}
</script>

<template>
  <BaseModal :open="!!order" :title="order ? `Order #${order.number}` : 'Order'" @close="emit('close')">
    <template v-if="order">
      <div class="no-print mb-4 flex flex-wrap items-center justify-between gap-2">
        <StatusBadge :status="order.status" />
        <p class="text-sm text-slate-500 dark:text-slate-400">
          {{ order.status === 'refunded' && order.refundedAt ? `Refunded ${formatDateTime(order.refundedAt)}` : formatDateTime(order.createdAt) }}
        </p>
      </div>
      <ReceiptContent :order="order" />

      <Transition name="fade">
        <div
          v-if="confirmingRefund"
          class="no-print mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
          role="alert"
        >
          Refund this order? Items will be returned to stock. This can't be undone.
        </div>
      </Transition>
    </template>

    <template #footer>
      <template v-if="confirmingRefund">
        <button type="button" class="btn btn-secondary" @click="confirmingRefund = false">Keep order</button>
        <button type="button" class="btn btn-danger" @click="emit('refund', order)">
          <AppIcon name="refund" :size="18" />
          Yes, refund
        </button>
      </template>
      <template v-else>
        <button
          v-if="order?.status === 'completed'"
          type="button"
          class="btn btn-ghost text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 sm:mr-auto"
          @click="confirmingRefund = true"
        >
          <AppIcon name="refund" :size="18" />
          Refund
        </button>
        <button type="button" class="btn btn-secondary" @click="saveOrderCsv">
          <AppIcon name="arrow-down-tray" :size="18" />
          CSV
        </button>
        <button type="button" class="btn btn-secondary" @click="printReceipt">
          <AppIcon name="printer" :size="18" />
          Print
        </button>
        <button type="button" class="btn btn-primary" data-autofocus @click="emit('close')">Done</button>
      </template>
    </template>
  </BaseModal>
</template>
