<template>
  <div class="home-menu">
    <main class="home-content">
      <header class="title-section">
        <h1 class="main-title">AblaufDiagramm</h1>
        <p class="subtitle">{{ t('home.subtitle') }}</p>
      </header>

      <section v-if="archive.hasUsers" class="user-summary">
        <span class="user-summary__avatar">
          <img v-if="archive.currentUser?.avatar" :src="archive.currentUser.avatar" alt="" />
          <span v-else aria-hidden="true">{{ initialOf(archive.currentUser?.name) }}</span>
        </span>
        <span class="user-summary__text">
          <span class="user-summary__label">{{ t('menu.userSummary') }}</span>
          <strong class="user-summary__name" :title="archive.currentUser?.name">
            {{ archive.currentUser?.name }}
          </strong>
        </span>
        <button type="button" class="user-summary__switch" @click="openUserManager">
          {{ t('menu.switchUser') }}
        </button>
      </section>

      <HomeEmptyState v-else-if="archive.ready" class="home-empty" :title="t('menu.noUsersTitle')"
        :description="t('menu.noUsersDesc')" :action-label="t('menu.createUserAndStart')"
        @action="openUserManagerForCreate" />

      <p v-else class="home-loading" role="status">{{ t('menu.loadingProjects') }}</p>

      <div v-if="archive.initializationError" class="home-error" role="alert">
        <span>{{ t('menu.loadFailed', [archive.initializationError]) }}</span>
        <button type="button" @click="retryInit">{{ t('menu.retry') }}</button>
      </div>

      <div class="home-actions">
        <button class="menu-btn menu-btn--primary" type="button" :disabled="loading" @click="handleNewProject">
          <span class="btn-text">{{ t('menu.newProject') }}</span>
          <span class="btn-desc">{{ t('menu.newProjectDesc') }}</span>
        </button>

        <button class="menu-btn" type="button" :disabled="loading || !archive.lastProjectMeta"
          :title="archive.lastProjectMeta ? t('menu.continueLastDesc') : t('menu.continueLastUnavailable')"
          @click="handleContinueProject">
          <span class="btn-text">
            {{ busy === 'continue' ? t('home.loading') : t('menu.continueLast') }}
          </span>
          <span class="btn-desc">
            {{ archive.lastProjectMeta?.name ?? t('menu.continueLastUnavailable') }}
          </span>
        </button>

        <button class="menu-btn" type="button" :disabled="loading" @click="router.push('/saves')">
          <span class="btn-text">{{ t('menu.openSaves') }}</span>
          <span class="btn-desc">{{ t('menu.openSavesDesc') }}</span>
        </button>

        <button class="menu-btn" type="button" :disabled="loading" @click="handleImportProject">
          <span class="btn-text">
            {{ busy === 'import' ? t('home.importing') : t('menu.importProject') }}
          </span>
          <span class="btn-desc">{{ t('menu.importProjectDesc') }}</span>
        </button>
      </div>

      <nav class="home-secondary" :aria-label="t('menu.userManagement')">
        <button type="button" @click="openUserManager">{{ t('menu.userManagement') }}</button>
        <button type="button" @click="showSettings = true">{{ t('home.settings') }}</button>
        <button type="button" @click="showHelp = true">{{ t('home.help') }}</button>
        <button type="button" @click="showAbout = true">{{ t('home.about') }}</button>
      </nav>
    </main>

    <input ref="fileInputRef" type="file" accept=".json" class="hidden-input" @change="onFileSelected" />

    <UserManagerModal v-model="showUserManager" :start-in-create="startInCreate" />
    <AboutModal v-model="showAbout" />
    <HomeSettingsModal v-model="showSettings" />
    <HelpModal v-model="showHelp" :html="helpHtml" :loading="helpLoading" />
    <ToastHost />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AboutModal from '@/components/home/AboutModal.vue'
import HelpModal from '@/components/home/HelpModal.vue'
import HomeEmptyState from '@/components/home/HomeEmptyState.vue'
import HomeSettingsModal from '@/components/home/HomeSettingsModal.vue'
import UserManagerModal from '@/components/home/UserManagerModal.vue'
import ToastHost from '@/components/common/ToastHost.vue'
import { ExportImport } from '@/composables/ExportImport'
import { HelpMarkdown } from '@/composables/HelpMarkdown'
import { useToast } from '@/composables/Toast'
import { useI18n } from '@/i18n'
import { useGraphStore } from '@/stores/graphStore'
import { createBlankProjectFile, useLocalArchiveStore } from '@/stores/localArchiveStore'
import { setProjectTitle } from '@/stores/projectTitleStore'
import { useSettingsStore } from '@/stores/settingsStore'
import '@/constants/markdown.css'

const router = useRouter()
const archive = useLocalArchiveStore()
const graph = useGraphStore()
const settings = useSettingsStore()
const { t } = useI18n()
const toast = useToast()
const { importJsonFromFile } = ExportImport()
const { helpHtml, helpLoading } = HelpMarkdown(() => settings.language)

const showAbout = ref(false)
const showSettings = ref(false)
const showHelp = ref(false)
const showUserManager = ref(false)
const startInCreate = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)
const busy = ref('')
const loading = computed(() => archive.initializing || Boolean(busy.value))

onMounted(retryInit)

watch(showUserManager, visible => {
  if (!visible) startInCreate.value = false
})

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function initialOf(name?: string): string {
  return Array.from(name?.trim() ?? '')[0]?.toLocaleUpperCase() ?? '?'
}

async function retryInit() {
  try {
    await archive.init()
  } catch (error) {
    toast.error(t('menu.loadFailed', [messageOf(error)]))
  }
}

function openUserManager() {
  startInCreate.value = false
  showUserManager.value = true
}

function openUserManagerForCreate() {
  startInCreate.value = true
  showUserManager.value = true
}

async function handleNewProject() {
  if (loading.value) return
  busy.value = 'new'
  try {
    await archive.init()
    graph.loadProject(createBlankProjectFile())
    await archive.startUnsavedSession()
    await router.push('/editor')
  } catch (error) {
    toast.error(t('menu.openFailed', [messageOf(error)]))
  } finally {
    busy.value = ''
  }
}

async function handleContinueProject() {
  const meta = archive.lastProjectMeta
  if (!meta || loading.value) return
  busy.value = 'continue'
  try {
    const save = await archive.selectSave(meta.id)
    graph.loadProject(save.project)
    setProjectTitle(save.meta.name)
    await router.push('/editor')
  } catch (error) {
    toast.error(t('menu.openFailed', [messageOf(error)]))
  } finally {
    busy.value = ''
  }
}

function handleImportProject() {
  if (loading.value) return
  if (!archive.hasUsers) {
    openUserManagerForCreate()
    return
  }
  fileInputRef.value?.click()
}

async function onFileSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file || busy.value) return

  busy.value = 'import'
  try {
    const result = await importJsonFromFile(file)
    if (!result.success) {
      toast.error(result.error ?? t('home.importFailed'))
      return
    }
    await archive.startUnsavedSession()
    toast.success(t('menu.importedAsUnsaved'))
    await router.push('/editor')
  } catch (error) {
    toast.error(`${t('home.importFailed')}: ${messageOf(error)}`)
  } finally {
    busy.value = ''
  }
}
</script>

<style scoped>
.home-menu {
  box-sizing: border-box;
  width: 100vw;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 28px 20px;
  overflow-y: auto;
  color: var(--text-body);
  background: var(--home-bg-overlay), url('../../assets/photo/mainMenu.jpg') center / cover fixed no-repeat;
  font-family: var(--font-serif);
}

.home-menu :deep(button),
.home-menu :deep(input),
.home-menu :deep(select),
.home-menu :deep(textarea) {
  font-family: var(--font-serif);
}

.home-content {
  position: relative;
  z-index: 1;
  display: grid;
  width: min(620px, 100%);
  gap: 18px;
}

.title-section {
  text-align: center;
}

.main-title {
  margin: 0;
  color: #000;
  font-family: Fraktur, 'Old English Text MT', serif;
  font-size: 2.8rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.subtitle {
  margin: 8px 0 0;
  color: var(--text-dim);
  font-size: 1.05rem;
  letter-spacing: 0.05em;
}

.user-summary {
  display: flex;
  min-height: 56px;
  align-items: center;
  gap: 12px;
  padding: 9px 12px;
  border: 1px solid var(--home-menu-border, var(--border-light));
  border-radius: 9px;
  background: var(--home-menu-bg, var(--bg-panel));
}

.user-summary__avatar {
  display: grid;
  flex: 0 0 42px;
  width: 42px;
  height: 42px;
  place-items: center;
  overflow: hidden;
  border-radius: 50%;
  color: var(--home-menu-text, var(--text-body));
  background: var(--bg-element);
  font-weight: 700;
}

.user-summary__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-summary__text {
  display: grid;
  min-width: 0;
  flex: 1;
  gap: 2px;
}

.user-summary__label {
  color: var(--home-menu-desc, var(--text-secondary));
  font-size: 0.76rem;
}

.user-summary__name {
  overflow: hidden;
  color: var(--home-menu-text, var(--text-body));
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-summary__switch {
  flex: 0 0 auto;
  padding: 7px 10px;
  border: 1px solid var(--home-menu-border, var(--border-light));
  border-radius: 6px;
  color: var(--home-menu-text, var(--text-body));
  background: transparent;
  cursor: pointer;
}

.home-empty {
  background: var(--home-menu-bg, var(--bg-panel));
}

.home-loading {
  margin: 0;
  padding: 18px;
  color: var(--home-menu-desc, var(--text-secondary));
  text-align: center;
}

.home-error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid var(--danger, #d55353);
  border-radius: 7px;
  color: var(--danger, #d55353);
  background: var(--home-menu-bg, var(--bg-panel));
}

.home-error button {
  padding: 6px 10px;
  border: 1px solid currentColor;
  border-radius: 5px;
  color: inherit;
  background: transparent;
  cursor: pointer;
}

.home-actions {
  display: grid;
  gap: 10px;
}

.menu-btn {
  display: grid;
  min-height: 44px;
  align-content: center;
  gap: 3px;
  padding: 9px 15px;
  border: 1px solid var(--home-menu-border, var(--border-light));
  border-radius: 8px;
  color: var(--home-menu-text, var(--text-body));
  background: var(--home-menu-bg, var(--bg-panel));
  text-align: start;
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease, transform 0.15s ease;
}

.menu-btn:hover:not(:disabled) {
  border-color: var(--home-menu-border-hover, var(--accent-blue));
  background: var(--home-menu-bg-hover, var(--bg-element-hover));
  transform: translateY(-1px);
}

.menu-btn--primary {
  min-height: 48px;
  border-color: var(--home-menu-primary-border, var(--accent-blue));
  color: var(--home-menu-primary-text, #fff);
  background: var(--home-menu-primary-bg, var(--accent-blue));
}

.menu-btn--primary:hover:not(:disabled) {
  background: var(--home-menu-primary-bg-hover, var(--accent-blue));
}

.menu-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-text {
  font-size: 0.95rem;
  font-weight: 650;
}

.menu-btn--primary .btn-text {
  font-size: 1rem;
}

.btn-desc {
  overflow: hidden;
  color: var(--home-menu-desc, var(--text-secondary));
  font-size: 0.78rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.menu-btn--primary .btn-desc {
  color: var(--home-menu-primary-desc, rgba(255, 255, 255, 0.52));
}

.home-secondary {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 4px 14px;
}

.home-secondary button {
  padding: 5px 4px;
  border: 0;
  color: var(--home-menu-desc, var(--text-secondary));
  background: transparent;
  font-size: 0.85rem;
  cursor: pointer;
}

.home-secondary button:hover {
  color: var(--home-menu-text, var(--text-body));
  text-decoration: underline;
}

.hidden-input {
  display: none;
}

@media (max-width: 768px) {
  .home-menu {
    align-items: flex-start;
    padding: 22px 16px;
  }

  .main-title {
    font-size: 2.1rem;
  }

  .user-summary {
    flex-wrap: wrap;
  }

  .user-summary__switch {
    margin-inline-start: auto;
  }
}

@media (max-width: 480px) {
  .home-menu {
    padding: 18px 12px;
  }

  .home-content {
    gap: 14px;
  }

  .main-title {
    font-size: 1.75rem;
  }

  .subtitle {
    font-size: 0.88rem;
  }

  .btn-desc {
    display: none;
  }

  .menu-btn {
    min-height: 44px;
  }

  .home-error {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>

<style>
@import '@/styles/modal.css';
</style>
