<script setup>
import BaseModal from './BaseModal.vue'

/** Generic "Are you sure?" dialog. */
defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: 'Are you sure?' },
  message: { type: String, default: '' },
  confirmLabel: { type: String, default: 'Confirm' },
  danger: { type: Boolean, default: false },
})
const emit = defineEmits(['confirm', 'cancel'])
</script>

<template>
  <BaseModal :open="open" :title="title" size="sm" @close="emit('cancel')">
    <p class="text-slate-600 dark:text-slate-300">{{ message }}</p>
    <slot />
    <template #footer>
      <button type="button" class="btn btn-secondary" data-autofocus @click="emit('cancel')">Cancel</button>
      <button type="button" class="btn" :class="danger ? 'btn-danger' : 'btn-primary'" @click="emit('confirm')">
        {{ confirmLabel }}
      </button>
    </template>
  </BaseModal>
</template>

