<script setup>
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useCurrency } from '@/composables/useCurrency'
import { formatDateTime, paymentLabel } from '@/utils/format'

/**
 * Paper-style receipt. Always rendered light (like real paper) and used both
 * on screen and when printing.
 */
defineProps({
  order: { type: Object, required: true },
})
const settings = useSettingsStore()
const { formatCurrency } = useCurrency()
</script>

<template>
  <article
    class="receipt mx-auto max-w-sm rounded-xl border border-slate-200 bg-white p-6 font-mono text-sm text-slate-800 shadow-inner"
    aria-label="Receipt"
  >
    <header class="text-center">
      <p class="font-sans text-lg font-extrabold text-slate-900">{{ settings.shopName }}</p>
      <p class="text-xs text-slate-500">Thank you for your purchase!</p>
    </header>

    <div class="my-4 border-t border-dashed border-slate-300" />

    <dl class="space-y-0.5 text-xs">
      <div class="flex justify-between">
        <dt>Order</dt>
        <dd class="font-bold">#{{ order.number }}</dd>
      </div>
      <div class="flex justify-between">
        <dt>Date</dt>
        <dd>{{ formatDateTime(order.createdAt) }}</dd>
      </div>
      <div class="flex justify-between">
        <dt>Payment</dt>
        <dd>{{ paymentLabel(order.paymentMethod) }}</dd>
      </div>
      <div v-if="order.status === 'refunded'" class="flex justify-between font-bold text-red-600">
        <dt>Status</dt>
        <dd>REFUNDED</dd>
      </div>
    </dl>

    <div class="my-4 border-t border-dashed border-slate-300" />

    <table class="w-full text-xs">
      <caption class="sr-only">Items purchased</caption>
      <thead>
        <tr class="text-left text-slate-500">
          <th scope="col" class="pb-1 font-normal">Item</th>
          <th scope="col" class="pb-1 text-center font-normal">Qty</th>
          <th scope="col" class="pb-1 text-right font-normal">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in order.items" :key="item.productId" class="align-top">
          <td class="py-1 pr-2">
            {{ item.name }}
            <span class="block text-[11px] text-slate-500">@ {{ formatCurrency(item.price) }}</span>
          </td>
          <td class="py-1 text-center">{{ item.quantity }}</td>
          <td class="py-1 text-right">{{ formatCurrency(item.price * item.quantity) }}</td>
        </tr>
      </tbody>
    </table>

    <div class="my-4 border-t border-dashed border-slate-300" />

    <dl class="space-y-1 text-xs">
      <div class="flex justify-between">
        <dt>Subtotal</dt>
        <dd>{{ formatCurrency(order.subtotal) }}</dd>
      </div>
      <div v-if="order.discount?.amount > 0" class="flex justify-between">
        <dt>Discount{{ order.discount.type === 'percent' ? ` (${order.discount.value}%)` : '' }}</dt>
        <dd>−{{ formatCurrency(order.discount.amount) }}</dd>
      </div>
      <div class="flex justify-between">
        <dt>Tax ({{ order.taxRate }}%)</dt>
        <dd>{{ formatCurrency(order.tax) }}</dd>
      </div>
      <div class="flex justify-between border-t border-slate-300 pt-2 text-base font-extrabold text-slate-900">
        <dt>TOTAL</dt>
        <dd>{{ formatCurrency(order.total) }}</dd>
      </div>
      <template v-if="order.paymentMethod === 'cash'">
        <div class="flex justify-between pt-1">
          <dt>Cash received</dt>
          <dd>{{ formatCurrency(order.amountReceived) }}</dd>
        </div>
        <div class="flex justify-between font-bold">
          <dt>Change</dt>
          <dd>{{ formatCurrency(order.change) }}</dd>
        </div>
      </template>
    </dl>

    <div class="my-4 border-t border-dashed border-slate-300" />
    <p class="text-center text-[11px] text-slate-500">Please come again ✦</p>
  </article>
</template>

