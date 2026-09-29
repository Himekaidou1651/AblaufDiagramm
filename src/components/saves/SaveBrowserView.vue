<template>
  <main class="save-browser">
    <div class="save-browser__shell">
      <header class="save-browser__header">
        <div class="save-browser__heading">
          <h1>{{ t('saves.title') }}</h1>
          <p v-if="archive.currentUser" class="save-browser__user">
            {{ t('saves.currentUser') }} <strong>{{ archive.currentUser.name }}</strong>
          </p>
        </div>
        <div class="save-browser__header-actions">
          <button type="button" class="save-browser__secondary" @click="showUserManager = true">
            {{ t('menu.switchUser') }}
          </button>
          <button type="button" class="save-browser__secondary" @click="router.push('/')">
            {{ t('saves.backToMenu') }}
          </button>
        </div>
      </header>

      <div v-if="archive.initializationError" class="save-browser__error" role="alert">
        <span>{{ t('menu.loadFailed', [archive.initializationError]) }}</span>
        <button type="button" @click="initialize">{{ t('menu.retry') }}</button>
      </div>

      <p v-if="archive.initializing && !archive.initialized" class="save-browser__loading" role="status">
        {{ t('menu.loadingProjects') }}
      </p>

      <template v-else-if="archive.ready">
        <HomeEmptyState
          v-if="!archive.hasUsers"
          :title="t('saves.needUserTitle')"
          :description="t('menu.noUsersDesc')"
          :action-label="t('menu.createUserAndStart')"
          @action="openUserCreation"
        />

        <template v-else>
          <div class="save-browser__toolbar">
            <button type="button" class="save-browser__new" :disabled="Boolean(busy)" @click="openCreateDialog">
              + {{ t('saves.new') }}
            </button>
          </div>

          <HomeEmptyState
            v-if="!archive.hasSaves"
            :title="t('saves.emptyTitle')"
            :description="t('saves.emptyDesc')"
            :action-label="t('saves.new')"
            @action="openCreateDialog"
          />

          <section v-else class="save-browser__list" :aria-label="t('saves.title')">
            <SaveCard
              v-for="save in archive.saveMetas"
              :key="save.id"
              :save="save"
              :current="save.id === archive.currentSaveId"
              :busy="busy === `open:${save.id}`"
              @open="openSave(save)"
              @rename="openRenameDialog(save)"
              @delete="requestDelete(save)"
            />
          </section>
        </template>
      </template>
    </div>

    <SaveNameDialog
      v-model="showNameDialog"
      :mode="nameDialogMode"
      :initial-name="nameDialogInitialName"
      :description="nameDialogMode === 'create' ? t('saves.defaultNameHint') : ''"
      :hint="nameDialogMode === 'create' ? t('saves.defaultNameHint') : ''"
      :busy="busy === 'create' || busy === 'rename'"
      @submit="submitNameDialog"
    />

    <ConfirmDialog
      v-model="showDeleteDialog"
      :title="t('saves.deleteTitle')"
      :message="t('saves.deleteConfirm', [deleteCandidate?.name ?? ''])"
      :actions="deleteActions"
      :busy-key="busy === 'delete' ? 'delete' : ''"
      :close-on-escape="false"
      :close-on-overlay="false"
      @action="handleDeleteAction"
    />

    <UserManagerModal v-model="showUserManager" :start-in-create="startUserInCreate" />
    <ToastHost />
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { SaveSlot } from '@/types/localArchive'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import ToastHost from '@/components/common/ToastHost.vue'
import HomeEmptyState from '@/components/home/HomeEmptyState.vue'
import UserManagerModal from '@/components/home/UserManagerModal.vue'
import SaveCard from '@/components/saves/SaveCard.vue'
import SaveNameDialog from '@/components/saves/SaveNameDialog.vue'
import { useToast } from '@/composables/Toast'
import { useI18n } from '@/i18n'
import { useGraphStore } from '@/stores/graphStore'
import { createBlankProjectFile, useLocalArchiveStore } from '@/stores/localArchiveStore'
import { setProjectTitle } from '@/stores/projectTitleStore'

const router = useRouter()
const archive = useLocalArchiveStore()
const graph = useGraphStore()
const { t } = useI18n()
const toast = useToast()
const busy = ref('')
const showNameDialog = ref(false)
const nameDialogMode = ref<'create' | 'rename'>('create')
const nameDialogInitialName = ref('')
const renameCandidate = ref<SaveSlot | null>(null)
const showDeleteDialog = ref(false)
const deleteCandidate = ref<SaveSlot | null>(null)
const showUserManager = ref(false)
const startUserInCreate = ref(false)

const deleteActions = computed(() => [
  { key: 'cancel', label: t('common.cancel'), variant: 'default' as const },
  { key: 'delete', label: busy.value === 'delete' ? t('saves.deleting') : t('saves.delete'), variant: 'danger' as const },
])

onMounted(initialize)

watch(showUserManager, visible => {
  if (!visible) startUserInCreate.value = false
})

async function initialize() {
  try {
    await archive.init()
  } catch (error) {
    toast.error(t('menu.loadFailed', [messageOf(error)]))
  }
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function openUserCreation() {
  startUserInCreate.value = true
  showUserManager.value = true
}

function openCreateDialog() {
  if (busy.value) return
  nameDialogMode.value = 'create'
  nameDialogInitialName.value = t('archive.defaultSaveName')
  renameCandidate.value = null
  showNameDialog.value = true
}

function openRenameDialog(save: SaveSlot) {
  if (busy.value) return
  nameDialogMode.value = 'rename'
  nameDialogInitialName.value = save.name
  renameCandidate.value = save
  showNameDialog.value = true
}

async function submitNameDialog(name: string) {
  if (busy.value) return
  if (nameDialogMode.value === 'create') {
    busy.value = 'create'
    try {
      const project = createBlankProjectFile()
      project.title = name
      const meta = await archive.createSave(name, project)
      graph.loadProject(project)
      setProjectTitle(meta.name)
      showNameDialog.value = false
      await router.push('/editor')
    } catch (error) {
      toast.error(t('saves.createFailed', [messageOf(error)]))
    } finally {
      busy.value = ''
    }
    return
  }

  if (!renameCandidate.value) return
  busy.value = 'rename'
  try {
    const renamedId = renameCandidate.value.id
    await archive.renameSave(renamedId, name)
    if (archive.currentSaveId === renamedId) setProjectTitle(name)
    showNameDialog.value = false
    renameCandidate.value = null
  } catch (error) {
    toast.error(t('saves.renameFailed', [messageOf(error)]))
  } finally {
    busy.value = ''
  }
}

async function openSave(save: SaveSlot) {
  if (busy.value) return
  busy.value = `open:${save.id}`
  try {
    const localSave = await archive.selectSave(save.id)
    graph.loadProject(localSave.project)
    setProjectTitle(localSave.meta.name)
    await router.push('/editor')
  } catch (error) {
    toast.error(t('saves.openFailed', [messageOf(error)]))
  } finally {
    busy.value = ''
  }
}

function requestDelete(save: SaveSlot) {
  if (busy.value) return
  deleteCandidate.value = save
  showDeleteDialog.value = true
}

async function handleDeleteAction(action: string) {
  if (action === 'cancel') {
    showDeleteDialog.value = false
    deleteCandidate.value = null
    return
  }
  if (action !== 'delete' || !deleteCandidate.value || busy.value) return

  busy.value = 'delete'
  try {
    await archive.removeSave(deleteCandidate.value.id)
    showDeleteDialog.value = false
    deleteCandidate.value = null
  } catch (error) {
    toast.error(t('saves.deleteFailed', [messageOf(error)]))
  } finally {
    busy.value = ''
  }
}
</script>

<style scoped>
.save-browser {
  box-sizing: border-box;
  min-height: 100vh;
  padding: 32px 22px;
  color: var(--text-body);
  background: var(--bg-app, var(--bg-panel));
  font-family: var(--font-serif);
}
.save-browser__shell { display: grid; width: min(980px, 100%); margin: 0 auto; gap: 22px; }
.save-browser__header { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; padding-bottom: 18px; border-bottom: 1px solid var(--border-default); }
.save-browser__heading { min-width: 0; }
.save-browser__heading h1 { margin: 0; font-size: 1.8rem; }
.save-browser__user { margin: 7px 0 0; color: var(--text-secondary); overflow-wrap: anywhere; }
.save-browser__header-actions { display: flex; flex: 0 0 auto; flex-wrap: wrap; justify-content: flex-end; gap: 8px; }
.save-browser__secondary,
.save-browser__new,
.save-browser__error button {
  min-height: 38px;
  padding: 8px 13px;
  border: 1px solid var(--border-light);
  border-radius: 6px;
  color: var(--text-body);
  background: var(--bg-element);
  cursor: pointer;
  white-space: normal;
  font-family: var(--font-serif);
}
.save-browser__new { border-color: var(--accent-blue); background: var(--accent-blue); color: #fff; }
.save-browser__new:disabled { opacity: 0.55; cursor: wait; }
.save-browser__toolbar { display: flex; justify-content: flex-end; }
.save-browser__list { display: grid; gap: 12px; }
.save-browser__loading { margin: 40px 0; color: var(--text-secondary); text-align: center; }
.save-browser__error { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 14px; border: 1px solid var(--danger, #d55353); border-radius: 8px; color: var(--danger, #d55353); }

@media (max-width: 768px) {
  .save-browser { padding: 20px 14px; }
  .save-browser__header { align-items: stretch; flex-direction: column; }
  .save-browser__header-actions { justify-content: stretch; }
  .save-browser__secondary { flex: 1 1 150px; }
  .save-browser__toolbar .save-browser__new { width: 100%; }
}
</style>

<style>
@import '@/styles/modal.css';
</style>
