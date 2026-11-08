<script setup>
import { computed, reactive, ref, watch } from 'vue'
import BaseModal from './BaseModal.vue'
import { CATEGORIES, EMOJI_CHOICES } from '@/data/mockProducts'
import { useSettingsStore } from '@/stores/useSettingsStore'

/**
 * Add / edit product form. Pass `product` to edit, or `null` to create.
 * Emits `save` with validated form values.
 */
const props = defineProps({
  open: { type: Boolean, default: false },
  product: { type: Object, default: null },
})
const emit = defineEmits(['close', 'save'])
const settings = useSettingsStore()

const emptyForm = () => ({ name: '', category: CATEGORIES[0], price: '', stock: '', emoji: '📦' })
const form = reactive(emptyForm())
const submitted = ref(false)
const isEdit = computed(() => !!props.product)

// Populate form whenever the modal opens
watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) return
    submitted.value = false
    Object.assign(form, props.product ? { ...props.product } : emptyForm())
  },
)

const errors = computed(() => {
  const e = {}
  if (!String(form.name).trim()) e.name = 'Name is required.'
  if (form.price === '' || Number.isNaN(Number(form.price)) || Number(form.price) < 0)
    e.price = 'Enter a valid price (0 or more).'
  if (form.stock === '' || !Number.isInteger(Number(form.stock)) || Number(form.stock) < 0)
    e.stock = 'Enter a whole number (0 or more).'
  return e
})
const isValid = computed(() => Object.keys(errors.value).length === 0)

function submit() {
  submitted.value = true
  if (!isValid.value) return
  emit('save', { ...form })
}

/** Only show errors after the first submit attempt */
const showError = (field) => submitted.value && errors.value[field]
</script>

<template>
  <BaseModal :open="open" :title="isEdit ? 'Edit product' : 'Add product'" @close="emit('close')">
    <form id="product-form" class="space-y-5" novalidate @submit.prevent="submit">
      <div class="flex gap-4">
        <div
          class="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-5xl dark:bg-slate-800"
          aria-hidden="true"
        >
          {{ form.emoji || '📦' }}
        </div>
        <div class="flex-1">
          <label for="product-name" class="label">Name</label>
          <input
            id="product-name"
            v-model="form.name"
            data-autofocus
            type="text"
            class="input"
            :class="{ 'input-error': showError('name') }"
            placeholder="e.g. Caramel Macchiato"
            maxlength="40"
            :aria-invalid="!!showError('name')"
            :aria-describedby="showError('name') ? 'name-error' : undefined"
          />
          <p v-if="showError('name')" id="name-error" class="mt-1 text-sm text-red-600 dark:text-red-400">{{ errors.name }}</p>
        </div>
      </div>

      <div class="grid gap-4 sm:grid-cols-3">
        <div>
          <label for="product-category" class="label">Category</label>
          <select id="product-category" v-model="form.category" class="input">
            <option v-for="cat in CATEGORIES" :key="cat" :value="cat">{{ cat }}</option>
          </select>
        </div>
        <div>
          <label for="product-price" class="label">Price ({{ settings.currencySymbol }})</label>
          <input
            id="product-price"
            v-model="form.price"
            type="number"
            min="0"
            step="0.01"
            inputmode="decimal"
            class="input"
            :class="{ 'input-error': showError('price') }"
            :aria-invalid="!!showError('price')"
            :aria-describedby="showError('price') ? 'price-error' : undefined"
          />
          <p v-if="showError('price')" id="price-error" class="mt-1 text-sm text-red-600 dark:text-red-400">{{ errors.price }}</p>
        </div>
        <div>
          <label for="product-stock" class="label">Stock</label>
          <input
            id="product-stock"
            v-model="form.stock"
            type="number"
            min="0"
            step="1"
            inputmode="numeric"
            class="input"
            :class="{ 'input-error': showError('stock') }"
            :aria-invalid="!!showError('stock')"
            :aria-describedby="showError('stock') ? 'stock-error' : undefined"
          />
          <p v-if="showError('stock')" id="stock-error" class="mt-1 text-sm text-red-600 dark:text-red-400">{{ errors.stock }}</p>
        </div>
      </div>

      <fieldset>
        <legend class="label">Icon</legend>
        <div class="grid grid-cols-8 gap-1.5">
          <button
            v-for="emoji in EMOJI_CHOICES"
            :key="emoji"
            type="button"
            class="flex aspect-square items-center justify-center rounded-xl text-2xl transition hover:bg-slate-100 dark:hover:bg-slate-800"
            :class="form.emoji === emoji ? 'bg-primary-50 ring-2 ring-primary-500 dark:bg-primary-500/15' : ''"
            :aria-label="`Use ${emoji} icon`"
            :aria-pressed="form.emoji === emoji"
            @click="form.emoji = emoji"
          >
            {{ emoji }}
          </button>
        </div>
        <label for="product-emoji" class="mt-3 block text-xs text-slate-500 dark:text-slate-400">Or type any emoji</label>
        <input id="product-emoji" v-model="form.emoji" type="text" maxlength="4" class="input mt-1 w-24 text-center text-xl" />
      </fieldset>
    </form>

    <template #footer>
      <button type="button" class="btn btn-secondary" @click="emit('close')">Cancel</button>
      <button type="submit" form="product-form" class="btn btn-primary">
        {{ isEdit ? 'Save changes' : 'Add product' }}
      </button>
    </template>
  </BaseModal>
</template>

