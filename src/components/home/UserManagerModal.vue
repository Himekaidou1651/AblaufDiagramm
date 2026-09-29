<template>
  <Teleport to="body">
    <div v-if="modelValue" class="modal-overlay" @click="onOverlayClick">
      <section
        ref="panelRef"
        class="modal-panel user-modal"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        tabindex="-1"
      >
        <header class="modal-header">
          <h2 :id="titleId" ref="titleRef" class="modal-title" tabindex="-1">
            {{ t('users.title') }}
          </h2>
          <button
            type="button"
            class="modal-close"
            :aria-label="t('common.close')"
            :disabled="Boolean(switchingUserId)"
            @click="close"
          >
            ✕
          </button>
        </header>

        <div class="modal-body user-manager__body">
          <p v-if="archive.initializing && !archive.initialized" class="user-manager__status" role="status">
            {{ t('menu.loadingProjects') }}
          </p>
          <div v-else-if="archive.initializationError" class="user-manager__error" role="alert">
            {{ t('menu.loadFailed', [archive.initializationError]) }}
          </div>
          <template v-else>
            <section v-if="archive.currentUser" class="user-manager__section">
              <h3 class="user-manager__heading">{{ t('users.currentSection') }}</h3>
              <article
                class="user-card user-card--current"
                aria-current="true"
              >
                <UserAvatar :user="archive.currentUser" />
                <div class="user-card__identity">
                  <strong class="user-card__name">{{ archive.currentUser.name }}</strong>
                  <time class="user-card__time" :datetime="isoTime(archive.currentUser.updatedAt)">
                    {{ formatTime(archive.currentUser.updatedAt) }}
                  </time>
                </div>
                <span class="user-card__badge">{{ t('users.badgeCurrent') }}</span>
                <div class="user-card__actions">
                  <button type="button" class="user-card__button" @click="openEdit(archive.currentUser)">
                    {{ t('users.editProfile') }}
                  </button>
                  <button type="button" class="user-card__delete" @click="requestDelete(archive.currentUser)">
                    {{ t('users.delete') }}
                  </button>
                </div>
              </article>
            </section>

            <section v-if="otherUsers.length" class="user-manager__section">
              <h3 class="user-manager__heading">{{ t('users.othersSection') }}</h3>
              <div class="user-manager__list">
                <article v-for="user in otherUsers" :key="user.id" class="user-card">
                  <UserAvatar :user="user" />
                  <div class="user-card__identity">
                    <strong class="user-card__name">{{ user.name }}</strong>
                    <time class="user-card__time" :datetime="isoTime(user.updatedAt)">
                      {{ formatTime(user.updatedAt) }}
                    </time>
                  </div>
                  <div class="user-card__actions">
                    <button
                      type="button"
                      class="user-card__button user-card__button--switch"
                      :aria-label="t('users.switchTo', [user.name])"
                      :disabled="Boolean(switchingUserId)"
                      @click="switchUser(user)"
                    >
                      {{ switchingUserId === user.id ? t('users.switching') : t('users.switch') }}
                    </button>
                    <button type="button" class="user-card__button" :disabled="Boolean(switchingUserId)" @click="openEdit(user)">
                      {{ t('users.editProfile') }}
                    </button>
                    <button type="button" class="user-card__delete" :disabled="Boolean(switchingUserId)" @click="requestDelete(user)">
                      {{ t('users.delete') }}
                    </button>
                  </div>
                </article>
              </div>
            </section>

            <div v-if="!archive.hasUsers" class="user-manager__empty">
              <p>{{ t('menu.noUsersDesc') }}</p>
            </div>
          </template>
        </div>

        <footer class="modal-footer user-manager__footer">
          <button
            type="button"
            class="modal-btn modal-btn--primary"
            :disabled="Boolean(switchingUserId) || archive.initializing"
            @click="openCreate"
          >
            + {{ t('users.create') }}
          </button>
        </footer>
      </section>
    </div>
  </Teleport>

  <UserFormModal
    v-model="showForm"
    :mode="formMode"
    :user="formUser"
    :duplicate-names="duplicateNames"
    :busy="formBusy"
    @submit="submitUserForm"
  />

  <ConfirmDialog
    v-model="showDeleteDialog"
    :title="t('users.deleteTitle')"
    :message="t('users.deleteConfirm', [deleteCandidate?.name ?? ''])"
    :hint="archive.users.length === 1 ? t('users.deleteLastNote') : ''"
    :actions="deleteActions"
    :busy-key="deletingUserId ? 'delete' : ''"
    :close-on-escape="false"
    :close-on-overlay="false"
    @action="handleDeleteAction"
  />
</template>

<script lang="ts">
import { defineComponent, h } from 'vue'
import type { PropType } from 'vue'
import type { LocalUser } from '@/types/localArchive'

const UserAvatar = defineComponent({
  name: 'UserAvatar',
  props: {
    user: { type: Object as PropType<LocalUser>, required: true },
  },
  setup(props) {
    return () => h('span', { class: 'user-card__avatar' }, props.user.avatar
      ? h('img', { src: props.user.avatar, alt: '' })
      : h('span', { 'aria-hidden': 'true' }, Array.from(props.user.name.trim())[0]?.toLocaleUpperCase() ?? '?'))
  },
})

export default { components: { UserAvatar } }
</script>

<script setup lang="ts">
import { computed, ref, toRef, watch } from 'vue'
import type { LocalUser } from '@/types/localArchive'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import UserFormModal from '@/components/home/UserFormModal.vue'
import { ModalFocus } from '@/composables/ModalFocus'
import { useToast } from '@/composables/Toast'
import { useI18n } from '@/i18n'
import { useLocalArchiveStore } from '@/stores/localArchiveStore'

const props = withDefaults(defineProps<{
  modelValue: boolean
  startInCreate?: boolean
}>(), {
  startInCreate: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const archive = useLocalArchiveStore()
const { t, locale } = useI18n()
const toast = useToast()
const panelRef = ref<HTMLElement | null>(null)
const titleRef = ref<HTMLElement | null>(null)
const active = toRef(props, 'modelValue')
const titleId = `user-manager-title-${Math.random().toString(36).slice(2)}`
const showForm = ref(false)
const formMode = ref<'create' | 'edit'>('create')
const formUser = ref<LocalUser | null>(null)
const formBusy = ref(false)
const switchingUserId = ref<string | null>(null)
const showDeleteDialog = ref(false)
const deleteCandidate = ref<LocalUser | null>(null)
const deletingUserId = ref<string | null>(null)

const otherUsers = computed(() => archive.users.filter(user => user.id !== archive.currentUserId))
const duplicateNames = computed(() => archive.users
  .filter(user => user.id !== formUser.value?.id)
  .map(user => user.name))
const deleteActions = computed(() => [
  { key: 'cancel', label: t('common.cancel'), variant: 'default' as const },
  { key: 'delete', label: deletingUserId.value ? t('users.deleting') : t('users.delete'), variant: 'danger' as const },
])

watch(active, async isOpen => {
  if (!isOpen) return
  try {
    await archive.init()
    if (props.startInCreate) openCreate()
  } catch (error) {
    toast.error(t('menu.loadFailed', [messageOf(error)]))
  }
})

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function isoTime(timestamp: number): string {
  return new Date(timestamp).toISOString()
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString(locale.value)
}

function close() {
  if (switchingUserId.value) return
  showForm.value = false
  showDeleteDialog.value = false
  emit('update:modelValue', false)
}

function openCreate() {
  formMode.value = 'create'
  formUser.value = null
  showForm.value = true
}

function openEdit(user: LocalUser) {
  formMode.value = 'edit'
  formUser.value = user
  showForm.value = true
}

async function submitUserForm(patch: { name: string; avatar: string | null }) {
  if (formBusy.value) return
  formBusy.value = true
  try {
    if (formMode.value === 'create') {
      const user = await archive.createUser(patch.name)
      await archive.selectUser(user.id)
      if (patch.avatar) await archive.updateUser(user.id, { avatar: patch.avatar })
      showForm.value = false
      toast.success(t('users.createdHint'))
    } else if (formUser.value) {
      await archive.updateUser(formUser.value.id, patch)
      showForm.value = false
      toast.success(t('users.profileUpdated'))
    }
  } catch (error) {
    const key = formMode.value === 'create' ? 'users.createFailed' : 'users.saveFailed'
    toast.error(t(key, [messageOf(error)]))
  } finally {
    formBusy.value = false
  }
}

async function switchUser(user: LocalUser) {
  if (switchingUserId.value) return
  switchingUserId.value = user.id
  try {
    await archive.selectUser(user.id)
    if (!archive.hasSaves) toast.success(t('users.noProjectsYet'))
    emit('update:modelValue', false)
  } catch (error) {
    toast.error(`${t('users.switch')}: ${messageOf(error)}`)
  } finally {
    switchingUserId.value = null
  }
}

function requestDelete(user: LocalUser) {
  deleteCandidate.value = user
  showDeleteDialog.value = true
}

async function handleDeleteAction(action: string) {
  if (action === 'cancel') {
    showDeleteDialog.value = false
    deleteCandidate.value = null
    return
  }
  if (action !== 'delete' || !deleteCandidate.value || deletingUserId.value) return

  const userId = deleteCandidate.value.id
  deletingUserId.value = userId
  try {
    await archive.removeUser(userId)
    showDeleteDialog.value = false
    deleteCandidate.value = null
  } catch (error) {
    toast.error(t('users.deleteFailed', [messageOf(error)]))
  } finally {
    deletingUserId.value = null
  }
}

const { onOverlayClick } = ModalFocus({
  containerRef: panelRef,
  active,
  initialFocusRef: titleRef,
  onRequestClose: close,
  closeOnEscape: true,
  closeOnOverlay: true,
})
</script>

<style scoped>
.user-manager__body { display: grid; gap: 20px; }
.user-manager__section { display: grid; gap: 9px; }
.user-manager__heading { margin: 0; color: var(--text-secondary); font-size: 0.82rem; letter-spacing: 0.03em; }
.user-manager__list { display: grid; gap: 9px; }
.user-card {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  padding: 11px 12px;
  border: 1px solid var(--border-light);
  border-radius: 8px;
  background: var(--bg-element);
}
.user-card--current {
  border: 2px solid var(--home-menu-primary-border, var(--accent-blue));
}
:deep(.user-card__avatar) {
  display: grid;
  width: 44px;
  height: 44px;
  place-items: center;
  overflow: hidden;
  border-radius: 50%;
  color: var(--text-body);
  background: var(--bg-panel);
  font-weight: 700;
}
:deep(.user-card__avatar img) { width: 100%; height: 100%; object-fit: cover; }
.user-card__identity { display: grid; min-width: 0; gap: 3px; }
.user-card__name { overflow: hidden; color: var(--text-body); text-overflow: ellipsis; white-space: nowrap; }
.user-card__time { color: var(--text-muted); font-size: 0.76rem; }
.user-card__badge {
  padding: 3px 8px;
  border: 1px solid var(--home-menu-primary-border, var(--accent-blue));
  border-radius: 999px;
  color: var(--text-body);
  font-size: 0.75rem;
}
.user-card__actions { grid-column: 3; display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 7px; }
.user-card__button,
.user-card__delete {
  min-height: 32px;
  padding: 6px 10px;
  border: 1px solid var(--border-light);
  border-radius: 5px;
  color: var(--text-body);
  background: var(--bg-panel);
  cursor: pointer;
  white-space: normal;
}
.user-card__button--switch { border-color: var(--home-menu-primary-border, var(--accent-blue)); }
.user-card__delete { border-color: transparent; color: var(--danger, #d55353); background: transparent; }
.user-card__button:disabled,
.user-card__delete:disabled { opacity: 0.55; cursor: wait; }
.user-manager__status,
.user-manager__empty { margin: 0; color: var(--text-secondary); text-align: center; }
.user-manager__error { color: var(--danger, #d55353); }
.user-manager__footer { justify-content: flex-start; }

@media (max-width: 600px) {
  .user-card { grid-template-columns: auto minmax(0, 1fr); }
  .user-card__badge { grid-column: 2; justify-self: start; }
  .user-card__actions { grid-column: 1 / -1; justify-content: flex-start; }
}
</style>
