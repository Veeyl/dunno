<script setup>
import AppIcon from './AppIcon.vue'
import BaseModal from './BaseModal.vue'
import ReceiptContent from './ReceiptContent.vue'

/** Shown right after a successful checkout. */
defineProps({
  order: { type: Object, default: null },
})
const emit = defineEmits(['close'])

function printReceipt() {
  window.print()
}
</script>

<template>
  <BaseModal :open="!!order" title="Order complete" description="Payment received successfully." @close="emit('close')">
    <template v-if="order">
      <div class="no-print mb-5 flex flex-col items-center text-center">
        <div class="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
          <AppIcon name="check-circle" :size="32" />
        </div>
        <p class="mt-2 font-semibold">Order #{{ order.number }} paid</p>
      </div>
      <ReceiptContent :order="order" />
    </template>

    <template #footer>
      <button type="button" class="btn btn-secondary" @click="printReceipt">
        <AppIcon name="printer" :size="18" />
        Print receipt
      </button>
      <button type="button" class="btn btn-primary" data-autofocus @click="emit('close')">
        New order
      </button>
    </template>
  </BaseModal>
</template>

