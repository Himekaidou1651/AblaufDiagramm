<template>
  <Teleport to="body">
    <div v-if="modelValue" class="modal-overlay" @click="onOverlayClick">
      <form
        ref="panelRef"
        class="modal-panel user-form-modal"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        tabindex="-1"
        @submit.prevent="submit"
      >
        <header class="modal-header">
          <h2 :id="titleId" class="modal-title">
            {{ mode === 'create' ? t('users.create') : t('users.editTitle') }}
          </h2>
          <button
            type="button"
            class="modal-close"
            :aria-label="t('common.close')"
            :disabled="busy"
            @click="close"
          >
            ✕
          </button>
        </header>

        <div class="modal-body user-form__body">
          <label class="user-form__label" :for="nameInputId">{{ t('users.nameLabel') }}</label>
          <input
            :id="nameInputId"
            ref="nameInputRef"
            v-model="name"
            class="user-form__input"
            type="text"
            :maxlength="USER_NAME_MAX_LENGTH"
            :placeholder="t('users.namePlaceholder')"
            :disabled="busy"
            :aria-invalid="Boolean(nameError)"
            :aria-describedby="nameError ? nameErrorId : duplicateName ? duplicateHintId : undefined"
            @input="nameError = ''"
          />
          <p v-if="nameError" :id="nameErrorId" class="user-form__error" role="alert">
            {{ nameError }}
          </p>
          <p v-else-if="duplicateName" :id="duplicateHintId" class="user-form__hint">
            {{ t('users.nameDuplicateHint') }}
          </p>

          <div class="user-form__avatar-section">
            <span class="user-form__label">{{ t('users.avatarLabel') }}</span>
            <div class="user-form__avatar-row">
              <span class="user-form__avatar" :aria-label="t('users.avatarDefault')">
                <img v-if="avatar" :src="avatar" alt="" />
                <span v-else aria-hidden="true">{{ initial }}</span>
              </span>
              <div class="user-form__avatar-actions">
                <label class="modal-btn user-form__upload" :class="{ 'user-form__upload--disabled': busy }">
                  {{ t('editor.avatarUpload') }}
                  <input
                    class="user-form__file-input"
                    type="file"
                    accept="image/*"
                    :disabled="busy"
                    @change="onAvatarFileChange"
                  />
                </label>
                <button
                  v-if="avatar"
                  type="button"
                  class="user-form__remove"
                  :disabled="busy"
                  @click="removeAvatar"
                >
                  {{ t('users.avatarRemove') }}
                </button>
              </div>
            </div>
            <p class="user-form__hint">{{ t('users.avatarHint') }}</p>
            <p v-if="avatarError" class="user-form__error" role="alert">{{ avatarError }}</p>
          </div>
        </div>

        <footer class="modal-footer user-form__footer">
          <button type="button" class="modal-btn" :disabled="busy" @click="close">
            {{ t('common.cancel') }}
          </button>
          <button type="submit" class="modal-btn modal-btn--primary" :disabled="busy">
            {{ busy ? busyLabel : submitLabel }}
          </button>
        </footer>
      </form>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, toRef, watch } from 'vue'
import type { LocalUser } from '@/types/localArchive'
import { USER_NAME_MAX_LENGTH } from '@/constants/storage'
import { AvatarUpload } from '@/composables/AvatarUpload'
import { ModalFocus } from '@/composables/ModalFocus'
import { useI18n } from '@/i18n'
import { validateUserName } from '@/services/localArchive/archiveSelection'

const props = withDefaults(defineProps<{
  modelValue: boolean
  mode: 'create' | 'edit'
  user?: LocalUser | null
  duplicateNames?: string[]
  busy?: boolean
}>(), {
  user: null,
  duplicateNames: () => [],
  busy: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: [patch: { name: string; avatar: string | null }]
}>()

const { t } = useI18n()
const panelRef = ref<HTMLElement | null>(null)
const nameInputRef = ref<HTMLElement | null>(null)
const name = ref('')
const avatar = ref<string | null>(null)
const nameError = ref('')
const active = toRef(props, 'modelValue')
const idSuffix = Math.random().toString(36).slice(2)
const titleId = `user-form-title-${idSuffix}`
const nameInputId = `user-name-${idSuffix}`
const nameErrorId = `user-name-error-${idSuffix}`
const duplicateHintId = `user-name-duplicate-${idSuffix}`

const { avatarError, resetAvatarError, onAvatarFileChange } = AvatarUpload(t, dataUri => {
  avatar.value = dataUri
})

const initial = computed(() => Array.from(name.value.trim())[0]?.toLocaleUpperCase() ?? '?')
const duplicateName = computed(() => {
  const normalized = name.value.trim().toLocaleLowerCase()
  return Boolean(normalized) && props.duplicateNames.some(
    existingName => existingName.trim().toLocaleLowerCase() === normalized,
  )
})
const submitLabel = computed(() => props.mode === 'create'
  ? t('users.createAndUse')
  : t('common.confirm'))
const busyLabel = computed(() => props.mode === 'create'
  ? t('users.creating')
  : t('users.savingProfile'))

watch(active, isOpen => {
  if (!isOpen) return
  name.value = props.mode === 'edit' ? props.user?.name ?? '' : ''
  avatar.value = props.mode === 'edit' ? props.user?.avatar ?? null : null
  nameError.value = ''
  resetAvatarError()
})

function removeAvatar() {
  avatar.value = null
  resetAvatarError()
}

function close() {
  if (!props.busy) emit('update:modelValue', false)
}

function submit() {
  if (props.busy) return
  const validation = validateUserName(name.value, USER_NAME_MAX_LENGTH)
  if (!validation.ok) {
    nameError.value = validation.reason === 'empty'
      ? t('users.nameRequired')
      : t('users.nameTooLong', [USER_NAME_MAX_LENGTH])
    return
  }
  emit('submit', { name: validation.value, avatar: avatar.value })
}

const { onOverlayClick } = ModalFocus({
  containerRef: panelRef,
  active,
  initialFocusRef: nameInputRef,
  onRequestClose: close,
  closeOnEscape: true,
  closeOnOverlay: true,
})
</script>

<style scoped>
.user-form-modal { width: min(480px, 92vw); }
.user-form__body { display: grid; gap: 8px; }
.user-form__label { color: var(--text-body); font-size: 0.9rem; font-weight: 600; }
.user-form__input {
  box-sizing: border-box;
  width: 100%;
  padding: 9px 11px;
  border: 1px solid var(--border-light);
  border-radius: 6px;
  color: var(--text-body);
  background: var(--bg-element);
}
.user-form__input:focus { outline: 2px solid var(--accent-blue); outline-offset: 1px; }
.user-form__error,
.user-form__hint { margin: 0; font-size: 0.82rem; line-height: 1.4; }
.user-form__error { color: var(--danger, #d55353); }
.user-form__hint { color: var(--text-secondary); }
.user-form__avatar-section { display: grid; gap: 8px; margin-top: 12px; }
.user-form__avatar-row { display: flex; align-items: center; gap: 14px; }
.user-form__avatar {
  display: grid;
  flex: 0 0 64px;
  width: 64px;
  height: 64px;
  place-items: center;
  overflow: hidden;
  border: 1px solid var(--border-light);
  border-radius: 50%;
  color: var(--text-body);
  background: var(--bg-element);
  font-size: 1.4rem;
  font-weight: 700;
}
.user-form__avatar img { width: 100%; height: 100%; object-fit: cover; }
.user-form__avatar-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.user-form__upload { display: inline-flex; align-items: center; white-space: normal; }
.user-form__upload--disabled { opacity: 0.55; cursor: wait; }
.user-form__file-input { position: absolute; width: 1px; height: 1px; overflow: hidden; opacity: 0; }
.user-form__remove {
  padding: 7px 10px;
  border: 0;
  color: var(--danger, #d55353);
  background: transparent;
  cursor: pointer;
}
.user-form__remove:disabled { opacity: 0.55; cursor: wait; }
.user-form__footer { flex-wrap: wrap; gap: 8px; }
</style>
