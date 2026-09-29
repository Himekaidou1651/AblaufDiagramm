<template>
  <Teleport to="body">
    <div v-if="modelValue" class="modal-overlay" @click="onOverlayClick">
      <form
        ref="panelRef"
        class="modal-panel save-name-modal"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        tabindex="-1"
        @submit.prevent="submit"
      >
        <header class="modal-header">
          <h2 :id="titleId" class="modal-title">
            {{ mode === 'create' ? t('saves.createTitle') : t('saves.renameTitle') }}
          </h2>
          <button type="button" class="modal-close" :aria-label="t('common.close')" :disabled="busy" @click="close">
            ✕
          </button>
        </header>
        <div class="modal-body save-name-dialog__body">
          <p v-if="description" class="save-name-dialog__description">{{ description }}</p>
          <label class="save-name-dialog__label" :for="inputId">{{ t('saves.nameLabel') }}</label>
          <input
            :id="inputId"
            ref="inputRef"
            v-model="name"
            class="save-name-dialog__input"
            type="text"
            :maxlength="SAVE_NAME_MAX_LENGTH"
            :placeholder="t('saves.namePlaceholder')"
            :disabled="busy"
            :aria-describedby="error ? errorId : hint ? hintId : undefined"
            :aria-invalid="Boolean(error)"
            @input="error = ''"
          />
          <p v-if="error" :id="errorId" class="save-name-dialog__error" role="alert">{{ error }}</p>
          <p v-else-if="hint" :id="hintId" class="save-name-dialog__hint">{{ hint }}</p>
        </div>
        <footer class="modal-footer save-name-dialog__actions">
          <button type="button" class="modal-btn" :disabled="busy" @click="close">
            {{ t('common.cancel') }}
          </button>
          <button type="submit" class="modal-btn modal-btn--primary" :disabled="busy">
            {{ submitLabel }}
          </button>
        </footer>
      </form>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, toRef, watch } from 'vue'
import { SAVE_NAME_MAX_LENGTH } from '@/constants/storage'
import { ModalFocus } from '@/composables/ModalFocus'
import { useI18n } from '@/i18n'
import { validateSaveName } from '@/services/localArchive/archiveSelection'

const props = withDefaults(defineProps<{
  modelValue: boolean
  mode: 'create' | 'rename'
  initialName?: string
  description?: string
  hint?: string
  busy?: boolean
}>(), {
  initialName: '',
  description: '',
  hint: '',
  busy: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: [name: string]
}>()

const { t } = useI18n()
const panelRef = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLElement | null>(null)
const name = ref('')
const error = ref('')
const active = toRef(props, 'modelValue')
const idSuffix = Math.random().toString(36).slice(2)
const titleId = `save-name-title-${idSuffix}`
const inputId = `save-name-input-${idSuffix}`
const errorId = `save-name-error-${idSuffix}`
const hintId = `save-name-hint-${idSuffix}`

const submitLabel = computed(() => props.mode === 'create'
  ? t('saves.createAndOpen')
  : t('saves.save'))

watch(active, isOpen => {
  if (!isOpen) return
  name.value = props.initialName
  error.value = ''
})

function close() {
  if (!props.busy) emit('update:modelValue', false)
}

function submit() {
  if (props.busy) return
  const validation = validateSaveName(name.value, SAVE_NAME_MAX_LENGTH)
  if (!validation.ok) {
    error.value = validation.reason === 'empty'
      ? t('saves.nameRequired')
      : t('saves.nameTooLong', [SAVE_NAME_MAX_LENGTH])
    return
  }
  emit('submit', validation.value)
}

const { onOverlayClick } = ModalFocus({
  containerRef: panelRef,
  active,
  initialFocusRef: inputRef,
  onRequestClose: close,
  closeOnEscape: true,
  closeOnOverlay: true,
})
</script>

<style scoped>
.save-name-dialog__body { display: grid; gap: 8px; }
.save-name-dialog__description,
.save-name-dialog__hint,
.save-name-dialog__error { margin: 0; line-height: 1.45; }
.save-name-dialog__description,
.save-name-dialog__hint { color: var(--text-secondary); font-size: 0.88rem; }
.save-name-dialog__label { color: var(--text-body); font-weight: 600; }
.save-name-dialog__input {
  box-sizing: border-box;
  width: 100%;
  padding: 9px 11px;
  border: 1px solid var(--border-light);
  border-radius: 6px;
  color: var(--text-body);
  background: var(--bg-element);
}
.save-name-dialog__input:focus { outline: 2px solid var(--accent-blue); outline-offset: 1px; }
.save-name-dialog__error { color: #d55353; font-size: 0.88rem; }
.save-name-dialog__actions { gap: 8px; }
</style>
