<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="modal-overlay"
      @click="onOverlayClick"
    >
      <section
        ref="panelRef"
        class="modal-panel confirm-modal"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        tabindex="-1"
      >
        <header class="modal-header">
          <h2 :id="titleId" class="modal-title">{{ title }}</h2>
        </header>
        <div class="modal-body confirm-dialog__body">
          <p class="confirm-dialog__message">{{ message }}</p>
          <p v-if="hint" class="confirm-dialog__hint">{{ hint }}</p>
        </div>
        <footer class="modal-footer confirm-dialog__actions">
          <button
            v-for="(action, index) in actions"
            :key="action.key"
            :ref="element => setInitialButton(element, index)"
            type="button"
            class="modal-btn"
            :class="`modal-btn--${action.variant ?? 'default'}`"
            :disabled="Boolean(busyKey)"
            @click="emit('action', action.key)"
          >
            {{ action.label }}
          </button>
        </footer>
      </section>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, toRef } from 'vue'
import type { ComponentPublicInstance } from 'vue'
import { ModalFocus } from '@/composables/ModalFocus'

export interface DialogAction {
  key: string
  label: string
  variant?: 'primary' | 'default' | 'danger'
}

const props = withDefaults(defineProps<{
  modelValue: boolean
  title: string
  message: string
  hint?: string
  actions: DialogAction[]
  busyKey?: string
  closeOnEscape?: boolean
  closeOnOverlay?: boolean
}>(), {
  hint: '',
  busyKey: '',
  closeOnEscape: true,
  closeOnOverlay: true,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  action: [key: string]
}>()

const panelRef = ref<HTMLElement | null>(null)
const initialButtonRef = ref<HTMLElement | null>(null)
const titleId = `confirm-dialog-title-${Math.random().toString(36).slice(2)}`
const active = toRef(props, 'modelValue')

function requestClose() {
  if (!props.busyKey) emit('update:modelValue', false)
}

function setInitialButton(element: Element | ComponentPublicInstance | null, index: number) {
  if (index === 0 && element instanceof HTMLElement) initialButtonRef.value = element
}

const focusOptions = computed(() => ({
  closeOnEscape: props.closeOnEscape,
  closeOnOverlay: props.closeOnOverlay,
}))

const { onOverlayClick } = ModalFocus({
  containerRef: panelRef,
  active,
  initialFocusRef: initialButtonRef,
  onRequestClose: requestClose,
  get closeOnEscape() { return focusOptions.value.closeOnEscape },
  get closeOnOverlay() { return focusOptions.value.closeOnOverlay },
})
</script>

<style scoped>
.confirm-dialog__body { display: grid; gap: 10px; }
.confirm-dialog__message,
.confirm-dialog__hint { margin: 0; line-height: 1.5; overflow-wrap: anywhere; }
.confirm-dialog__hint { color: var(--text-secondary); font-size: 0.88rem; }
.confirm-dialog__actions { flex-wrap: wrap; gap: 8px; }
</style>
