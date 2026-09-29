<template>
  <header class="toolbar">
    <div class="toolbar-left">
      <button class="icon-btn back-btn" :title="t('editor.back')" @click="$emit('go-home')">←</button>
      <span class="editor-context" :title="contextTitle">
        <span class="editor-context__user">
          {{ t('editor.contextUser', [archive.currentUser?.name ?? '—']) }}
        </span>
        <span class="editor-context__save">
          {{ t('editor.contextSave', [saveLabel]) }}
        </span>
      </span>
      <FileMenu
        :on-new-canvas="newCanvas"
        :on-import-json="handleImportJson"
        :on-export-json="handleExportJson"
        :on-export-image="handleExportImage"
        :on-export-svg="handleExportSvg"
        :on-export-webp="handleExportWebp"
      />
      <EditMenu :on-duplicate-selected="duplicateSelected" />
      <ViewMenu
        :on-show-zoom-panel="() => { showZoomPanel = true }"
        :on-show-canvas-mirror="() => $emit('show-canvas-mirror')"
        :on-show-cpp-status="() => { showCppStatus = true }"
      />
    </div>
    <div class="toolbar-center">
      <ProjectTitleEditor />
    </div>
    <div class="toolbar-right">
      <span class="graph-status">{{ t('toolbar.graphStatus', [nodeStore.personNodes.length, edgeStore.edges.length]) }}</span>
      <ZoomControls ref="zoomControlsRef" @toggle-zoom="showZoomPanel = !showZoomPanel" />
      <button
        class="toolbar-btn save-btn"
        type="button"
        :title="saveButtonTitle"
        :disabled="saving"
        @click="$emit('save')"
      >
        {{ boundSave ? t('editor.save') : t('editor.saveAsTitle') }}
        <span v-if="isDirty" class="save-btn__dirty" :title="t('editor.dirtyBadge')" aria-hidden="true" />
      </button>
      <button
        ref="canvasResizeBtnRef"
        class="toolbar-btn canvas-btn"
        type="button"
        :title="t('canvas.resizeTitle')"
        @click="showCanvasResize = !showCanvasResize"
      >
        {{ t('toolbar.canvas') }}
      </button>
      <button class="icon-btn settings-btn" type="button" @click="$emit('toggle-settings')" :title="t('home.settings')">⚙</button>
      <button class="icon-btn help-btn" type="button" @click="showShortcutHelp = true" :title="t('shortcut.title')">?</button>
    </div>
  </header>
  <ShortcutHelp v-model="showShortcutHelp" />
  <CanvasResizePanel
    :visible="showCanvasResize"
    :anchor-el="canvasResizeBtnRef"
    @update:visible="showCanvasResize = $event"
  />
  <ZoomPanel
    :visible="showZoomPanel"
    :anchor-el="zoomControlsRef?.zoomBtnRef ?? null"
    @update:visible="showZoomPanel = $event"
  />
  <CppStatusModal v-model="showCppStatus" />
</template>

<script setup lang="ts">
/**
 * @file EditorToolbar.vue - 编辑器顶部工具栏
 * @brief 组合文件、编辑、视图、标题、缩放和弹窗入口。
 */
import { computed, ref, watch } from 'vue'
import { useNodeStore } from '@/stores/nodeStore'
import { useEdgeStore } from '@/stores/edgeStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useLocalArchiveStore } from '@/stores/localArchiveStore'
import { isDirty } from '@/stores/dirtyFlag'
import { findSaveById } from '@/services/localArchive/archiveSelection'
import { ToolbarActions } from '@/composables/ToolbarActions'
import ShortcutHelp from '@/components/panels/ShortcutHelp.vue'
import CppStatusModal from '@/components/panels/CppStatusModal.vue'
import CanvasResizePanel from '@/components/toolbar/CanvasResizePanel.vue'
import ZoomPanel from '@/components/toolbar/ZoomPanel.vue'
import FileMenu from '@/components/toolbar/FileMenu.vue'
import EditMenu from '@/components/toolbar/EditMenu.vue'
import ViewMenu from '@/components/toolbar/ViewMenu.vue'
import ProjectTitleEditor from '@/components/toolbar/ProjectTitleEditor.vue'
import ZoomControls from '@/components/toolbar/ZoomControls.vue'
import { useI18n } from '@/i18n'

const props = defineProps<{
  canvasEl: HTMLElement | null
  openedSaveId: string | null
  saving?: boolean
}>()

defineEmits<{
  'go-home': []
  'toggle-settings': []
  'show-canvas-mirror': []
  'save': []
}>()

const nodeStore = useNodeStore()
const edgeStore = useEdgeStore()
const settings = useSettingsStore()
const archive = useLocalArchiveStore()
const { t } = useI18n()
const boundSave = computed(() => findSaveById(archive.saveMetas, props.openedSaveId))
const saveLabel = computed(() => boundSave.value?.name ?? t('editor.contextUnsaved'))
const contextTitle = computed(() => [
  t('editor.contextUser', [archive.currentUser?.name ?? '—']),
  t('editor.contextSave', [saveLabel.value]),
].join(' · '))
const saveButtonTitle = computed(() => {
  const action = boundSave.value ? t('editor.save') : t('editor.saveAsTitle')
  return isDirty.value ? `${action} · ${t('editor.dirtyBadge')}` : action
})
const {
  newCanvas,
  duplicateSelected,
  handleImportJson,
  handleExportJson,
  handleExportImage,
  handleExportSvg,
  handleExportWebp,
} = ToolbarActions(() => props.canvasEl)

const showShortcutHelp = ref(false)
const showCppStatus = ref(false)
const showCanvasResize = ref(false)
const canvasResizeBtnRef = ref<HTMLElement | null>(null)
const showZoomPanel = ref(false)
const zoomControlsRef = ref<InstanceType<typeof ZoomControls> | null>(null)

watch(
  () => settings.developerMode,
  (enabled) => {
    if (!enabled) {
      showCppStatus.value = false
    }
  }
)

defineExpose({ duplicateSelected })
</script>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 44px;
  gap: 14px;
  padding: 0 10px;
  background: var(--bg-panel);
  border-bottom: 1px solid var(--border-default);
  flex-shrink: 0;
  user-select: none;
  font-family: var(--font-serif);
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.editor-context {
  display: flex;
  max-width: 320px;
  min-width: 0;
  gap: 8px;
  color: var(--text-dim);
  font-size: 11px;
}

.editor-context__user,
.editor-context__save {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.toolbar-center {
  flex: 1;
  min-width: 120px;
  text-align: center;
}

:deep(.toolbar-title) {
  font-size: 13px;
  color: var(--text-dim);
  font-family: var(--font-serif);
  cursor: text;
  padding: 2px 8px;
  border-radius: 4px;
  transition: background 0.15s;
}

:deep(.toolbar-title:hover) {
  background: var(--bg-element);
}

:deep(.toolbar-title-input) {
  font-size: 13px;
  color: var(--text-body);
  font-family: var(--font-serif);
  background: var(--bg-input);
  border: 1px solid var(--accent-blue);
  border-radius: 4px;
  padding: 2px 8px;
  outline: none;
  text-align: center;
  width: 200px;
}

:deep(.toolbar-title-input:focus) {
  box-shadow: 0 0 0 2px var(--shadow-focus);
}

.icon-btn,
.toolbar-btn,
:deep(.icon-btn) {
  height: 28px;
  min-width: 28px;
  padding: 0 9px;
  border: 1px solid var(--border-light);
  border-radius: 5px;
  background: var(--bg-element);
  color: var(--text-body);
  font-size: 12px;
  font-family: var(--font-serif);
  cursor: pointer;
  transition: background 0.15s;
}

.icon-btn,
:deep(.icon-btn) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  line-height: 1;
}

.icon-btn:hover,
.toolbar-btn:hover,
:deep(.icon-btn:hover) {
  background: var(--bg-element-hover);
}

.icon-btn:disabled,
.toolbar-btn:disabled,
:deep(.icon-btn:disabled) {
  opacity: 0.35;
  cursor: not-allowed;
}

.toolbar-btn.danger:hover:not(:disabled) {
  background: var(--danger);
  border-color: var(--danger);
  color: #fff;
}

.save-btn {
  position: relative;
  border-color: var(--accent-green);
  color: var(--accent-green);
}

.save-btn__dirty {
  position: absolute;
  top: 3px;
  right: 3px;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--danger, #d55353);
}

.save-btn:hover {
  background: rgba(166, 227, 161, 0.12);
}

.settings-btn {
  font-size: 16px;
}

.help-btn {
  font-size: 13px;
  font-weight: 700;
}

@media (max-width: 900px) {
  .editor-context__user { display: none; }
}

@media (max-width: 700px) {
  .editor-context { display: none; }
}

:deep(.zoom-strip) {
  display: flex;
  align-items: center;
  gap: 2px;
  border: 1px solid var(--border-light);
  border-radius: 6px;
  background: var(--bg-element);
  overflow: hidden;
}

:deep(.zoom-step-btn) {
  border: 0;
  border-radius: 0;
  background: transparent;
}

:deep(.zoom-trigger-btn) {
  height: 28px;
  min-width: 58px;
  padding: 0 6px;
  border: 0;
  border-left: 1px solid var(--border-light);
  border-right: 1px solid var(--border-light);
  background: transparent;
  font-weight: 600;
  color: var(--accent-green);
  font-size: 12px;
  font-family: var(--font-serif);
  cursor: pointer;
}

:deep(.zoom-trigger-btn:hover) {
  background: var(--bg-element-hover);
}

.graph-status {
  font-size: 12px;
  color: var(--text-subtle);
  white-space: nowrap;
}

:deep(.menu-item) {
  width: 100%;
  min-height: 30px;
  padding: 6px 9px;
  border: 1px solid transparent;
  border-radius: 6px;
  background: transparent;
  color: var(--text-body);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  font-size: 12px;
  font-family: var(--font-serif);
  text-align: left;
  cursor: pointer;
}

:deep(.menu-item:hover:not(:disabled)) {
  background: var(--bg-element);
  border-color: var(--border-light);
}

:deep(.menu-item:disabled) {
  opacity: 0.35;
  cursor: not-allowed;
}

:deep(.menu-item.danger:hover:not(:disabled)) {
  background: var(--danger);
  border-color: var(--danger);
  color: #fff;
}

:deep(.menu-divider) {
  height: 1px;
  margin: 5px 4px;
  background: var(--border-default);
}

:deep(.menu-shortcut) {
  color: var(--text-subtle);
  font-size: 11px;
  white-space: nowrap;
}

@media (max-width: 900px) {
  .graph-status {
    display: none;
  }
}

@media (max-width: 700px) {
  .toolbar-center {
    display: none;
  }
}
</style>
