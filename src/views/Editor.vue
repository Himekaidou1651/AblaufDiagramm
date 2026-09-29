<template>
  <div class="editor-container">
    <EditorToolbar
      ref="toolbarRef"
      :canvas-el="canvasRef"
      :opened-save-id="openedSaveId"
      :saving="saving"
      @go-home="goHome"
      @toggle-settings="showSettings = true"
      @show-canvas-mirror="showCanvasMirrorPreview = true"
      @save="handleSave"
    />

    <div v-if="saveBindingDeleted" class="editor-warning" role="alert">
      {{ t('saves.deletedCurrent') }}
    </div>

    <div class="editor-body">
      <EditorSideToolbar
        :edge-type="connection.currentEdgeType"
        :has-selection="!!selectedNode"
        :json-open="jsonSidebar.open"
        @add-person="onAddTestPerson"
        @add-child="onAddChildToSelected"
        @toggle-json="jsonSidebar.toggle()"
        @update:edge-type="connection.currentEdgeType = $event as EdgeType"
      />

      <JsonSidebar v-if="jsonSidebar.open" />

      <CanvasWorkspace
        :canvas-cursor="canvasCursor"
        :canvas-rect-style="canvasRectStyle"
        :space-held="spaceHeld"
        :active-snap-x="activeSnapX"
        :active-snap-y="activeSnapY"
        :active-snap-guides-x="activeSnapGuidesX"
        :active-snap-guides-y="activeSnapGuidesY"
        :selected-node="selectedNode"
        :selected-edge="selectedEdge"
        :recent-node-id="recentNodeId"
        :dragging-node-id="draggingNodeId"
        @canvas-ready="canvasRef = $event"
        @key-down="onKeyDown"
        @canvas-mouse-down="onCanvasMouseDown"
        @node-drag-start="onNodeDragStart"
        @node-select="onNodeSelect"
        @add-child="onAddChildToSelected"
        @add-spouse="onAddSpouseToSelected"
        @duplicate-node="duplicateContextNode"
        @delete-node="selection.deleteSelected()"
        @edge-type-change="onEdgeTypeChange"
        @delete-edge="deleteSelectedEdge"
        @close-context-toolbar="selection.clearSelection()"
      />

      <div
        v-if="inspectorVisible"
        class="splitter"
        :class="{ active: splitterDragging === 'right' }"
        @mousedown="onSplitterMouseDown($event, 'right')"
      />

      <InspectorPanel
        v-if="inspectorVisible"
        :visible="true"
        :panel-width="settings.rightPanelWidth"
        :selected-node="selectedNode"
        :developer-mode="settings.developerMode"
        :selected-node-edge-ids="selectedNodeEdgeIds"
        :selected-edge="selectedEdge"
        :selected-count="selection.selectedNodeCount"
        :source-name="sourceNodeName"
        :source-id="sourceNodeId"
        :target-name="targetNodeName"
        :target-id="targetNodeId"
        @toggle="selection.clearSelection()"
        @delete-selected="selection.deleteSelected()"
        @add-child="onAddChildToSelected"
        @delete-edge="deleteSelectedEdge"
        @edge-type-change="onEdgeTypeChange"
        @field-change="onFieldChange"
        @position-change="onPositionChange"
      />
    </div>

    <SettingsModal v-model="showSettings" />
    <HiddenCanvasMirror
      :width="mirrorSize.width"
      :height="mirrorSize.height"
      :space-held="spaceHeld"
      :snap-x="activeSnapX"
      :snap-y="activeSnapY"
      :snap-guides-x="activeSnapGuidesX"
      :snap-guides-y="activeSnapGuidesY"
    />
    <CanvasMirrorPreviewModal
      v-model="showCanvasMirrorPreview"
      :space-held="spaceHeld"
      :snap-x="activeSnapX"
      :snap-y="activeSnapY"
      :snap-guides-x="activeSnapGuidesX"
      :snap-guides-y="activeSnapGuidesY"
    />
    <ConfirmDialog
      v-model="showLeaveDialog"
      :title="t('editor.leaveTitle')"
      :message="t('editor.leaveUnsavedDesc')"
      :actions="leaveActions"
      :busy-key="saving ? 'save' : ''"
      :close-on-escape="true"
      :close-on-overlay="true"
      @action="handleLeaveAction"
    />
    <SaveNameDialog
      :model-value="showSaveNameDialog"
      mode="create"
      :initial-name="saveNameInitialValue"
      :description="t('editor.saveAsDesc')"
      :busy="savingName"
      @update:model-value="setSaveNameDialogVisibility"
      @submit="onSaveNameSubmit"
    />
    <UserManagerModal v-model="showUserManager" :start-in-create="true" />
    <ToastHost />
  </div>
</template>

<script setup lang="ts">
/**
 * @file Editor.vue
 * @brief 渲染族谱编辑器主界面，并组装画布、工具栏、检查器和全局交互逻辑。
 * @author 项目维护者
 * @date 2026-08-26
 */

import { computed, onMounted, onUnmounted, provide, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from '@/i18n'
import { useGraphStore } from '@/stores/graphStore'
import { useLocalArchiveStore } from '@/stores/localArchiveStore'
import { useNodeStore } from '@/stores/nodeStore'
import { useSelectionStore } from '@/stores/selectionStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useConnectionStore } from '@/stores/connectionStore'
import { clearDirty, isDirty } from '@/stores/dirtyFlag'
import { findSaveById } from '@/services/localArchive/archiveSelection'
import { useProjectTitle } from '@/stores/projectTitleStore'
import { useJsonSidebarStore } from '@/dvl/jsonSidebarStore'
import type { ProjectFile } from '@/types/serialization'
import { CanvasPan } from '@/composables/CanvasPan'
import { CanvasZoom } from '@/composables/CanvasZoom'
import { NodeDrag } from '@/composables/NodeDrag'
import { PanelResize } from '@/composables/PanelResize'
import { KeyboardShortcuts } from '@/composables/KeyboardShortcuts'
import { CanvasRectStyle } from '@/composables/CanvasRectStyle'
import { EditorSelectionModel } from '@/composables/EditorSelectionModel'
import { EditorInspectorActions } from '@/composables/EditorInspectorActions'
import { EditorNodeCreation } from '@/composables/EditorNodeCreation'
import { EditorConnectionFlow } from '@/composables/EditorConnectionFlow'
import { CanvasMirrorPreview } from '@/composables/CanvasMirrorPreview'
import EditorToolbar from '@/components/toolbar/EditorToolbar.vue'
import SettingsModal from '@/components/panels/SettingsModal.vue'
import InspectorPanel from '@/components/panels/InspectorPanel.vue'
import EditorSideToolbar from '@/components/workspace/EditorSideToolbar.vue'
import CanvasWorkspace from '@/components/workspace/CanvasWorkspace.vue'
import JsonSidebar from '@/dvl/JsonSidebar.vue'
import HiddenCanvasMirror from '@/components/canvas/HiddenCanvasMirror.vue'
import CanvasMirrorPreviewModal from '@/components/panels/CanvasMirrorPreviewModal.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import ToastHost from '@/components/common/ToastHost.vue'
import SaveNameDialog from '@/components/saves/SaveNameDialog.vue'
import UserManagerModal from '@/components/home/UserManagerModal.vue'
import { useToast } from '@/composables/Toast'
import type { EdgeType } from '@/types'

/** @brief 节点 Store。 */
const nodeStore = useNodeStore()

/** @brief 图谱组合 Store。 */
const graph = useGraphStore()

/** @brief 选择状态 Store。 */
const selection = useSelectionStore()

/** @brief 连线状态 Store。 */
const connection = useConnectionStore()

/** @brief 全局设置 Store。 */
const settings = useSettingsStore()

/** @brief 本地用户与存档状态。 */
const archive = useLocalArchiveStore()

/** @brief 当前存档 JSON 侧边栏状态。 */
const jsonSidebar = useJsonSidebarStore()

/** @brief 国际化翻译函数。 */
const { t } = useI18n()

/** @brief 应用路由实例。 */
const router = useRouter()
const toast = useToast()
const { projectTitle } = useProjectTitle()

/** @brief 标记编辑器设置弹窗是否显示。 */
const showSettings = ref(false)
const showLeaveDialog = ref(false)
const showSaveNameDialog = ref(false)
const showUserManager = ref(false)
const pendingProject = ref<ProjectFile | null>(null)
const openedSaveId = ref<string | null>(null)
const openedUserId = ref<string | null>(null)
const leaveAfterSave = ref(false)
const saving = ref(false)
const savingName = ref(false)
const boundSave = computed(() => findSaveById(archive.saveMetas, openedSaveId.value))
const saveBindingDeleted = computed(() => Boolean(
  openedSaveId.value
  && openedUserId.value
  && archive.currentUserId === openedUserId.value
  && !boundSave.value,
))
const saveNameInitialValue = computed(() => {
  const title = pendingProject.value?.title?.trim() || projectTitle.value.trim()
  return title && title !== 'default' ? title : t('archive.defaultSaveName')
})
const leaveActions = computed(() => [
  { key: 'save', label: saving.value ? t('home.loading') : t('editor.leaveSave'), variant: 'primary' as const },
  { key: 'discard', label: t('editor.leaveDiscard'), variant: 'default' as const },
  { key: 'cancel', label: t('common.cancel'), variant: 'default' as const },
])

/** @brief 标记当前连线鼠标释放是否已由节点手柄处理。 */
const connectionHandled = ref(false)

/** @brief 向子组件提供连线处理标记。 */
provide('connectionHandled', connectionHandled)

/** @brief 画布容器元素引用。 */
const canvasRef = ref<HTMLElement | null>(null)

/** @brief 顶部工具栏组件引用。 */
const toolbarRef = ref<InstanceType<typeof EditorToolbar> | null>(null)

/** @brief 开发者模式下画布镜像预览的尺寸和显示状态。 */
const { mirrorSize, showCanvasMirrorPreview } = CanvasMirrorPreview(canvasRef)

/** @brief 画布平移交互中的 Space 键状态。 */
const { spaceHeld } = CanvasPan(canvasRef)

/** @brief 挂载画布缩放交互。 */
CanvasZoom(canvasRef)

/** @brief 节点拖拽处理器和吸附辅助线状态。 */
const { startDrag, draggingNodeId, activeSnapX, activeSnapY, activeSnapGuidesX, activeSnapGuidesY } = NodeDrag()

/** @brief 检查器面板宽度拖拽状态和处理器。 */
const { splitterDragging, onSplitterMouseDown } = PanelResize(canvasRef)

/** @brief 向子组件提供当前拖拽节点 ID。 */
provide('draggingNodeId', draggingNodeId)

/** @brief 编辑器快捷键处理器。 */
const { onKeyDown, onGlobalKeyDown } = KeyboardShortcuts(
  () => toolbarRef.value?.duplicateSelected()
)

/** @brief 编辑器选择状态派生数据。 */
const {
  selectedNode,
  selectedNodeEdgeIds,
  selectedEdge,
  inspectorVisible,
  sourceNodeName,
  sourceNodeId,
  targetNodeName,
  targetNodeId,
} = EditorSelectionModel()

/** @brief 检查器面板可触发的编辑动作。 */
const {
  deleteSelectedEdge,
  onEdgeTypeChange,
  onFieldChange,
  onPositionChange,
} = EditorInspectorActions(selectedEdge)

/** @brief 编辑器节点新增动作。 */
const { addTestPerson, addChildToSelected, addSpouseToSelected, selectAndRevealNode } = EditorNodeCreation(
  selectedNode,
  canvasRef
)

/** @brief 最近创建或复制的节点 ID，用于提供短暂高亮反馈。 */
const recentNodeId = ref<string | null>(null)

/** @brief 最近创建或复制节点高亮的清理定时器。 */
let recentNodeTimer: ReturnType<typeof setTimeout> | null = null

/** @brief 编辑器连线流程处理器。 */
const { onCanvasMouseDown } = EditorConnectionFlow(canvasRef, spaceHeld, connectionHandled)

/**
 * @brief 返回首页。
 * @return 无返回值。
 */
function goHome() {
  if (isDirty.value || jsonSidebar.hasPendingEdits) {
    showLeaveDialog.value = true
    return
  }
  void router.push('/')
}

/**
 * @brief 保存当前编辑器状态到本地存档。
 */
async function handleSave(): Promise<boolean> {
  if (saving.value || savingName.value) return false
  if (!(await jsonSidebar.confirmBeforeSave())) {
    leaveAfterSave.value = false
    return false
  }
  const project = graph.buildProjectFile()

  if (!archive.currentUser) {
    leaveAfterSave.value = false
    showUserManager.value = true
    return false
  }

  const meta = findSaveById(archive.saveMetas, openedSaveId.value)
  if (!meta) {
    pendingProject.value = project
    showSaveNameDialog.value = true
    return false
  }

  saving.value = true
  try {
    await archive.selectSave(meta.id)
    const result = await archive.saveCurrentProject(project)
    openedSaveId.value = meta.id
    openedUserId.value = archive.currentUserId
    clearDirty()
    toast.success(t('editor.savedTo', [project.title?.trim() || meta.name]))
    if (!result.synced && result.syncError) {
      toast.error(result.syncError, t('editor.saveFailedHint'))
    }
    return true
  } catch (error) {
    leaveAfterSave.value = false
    toast.error(t('editor.saveFailed', [messageOf(error)]), t('editor.saveFailedHint'))
    return false
  } finally {
    saving.value = false
  }
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

async function handleLeaveAction(action: string) {
  if (action === 'cancel') {
    showLeaveDialog.value = false
    leaveAfterSave.value = false
    return
  }
  if (action === 'discard') {
    showLeaveDialog.value = false
    leaveAfterSave.value = false
    await router.push('/')
    return
  }
  if (action !== 'save') return

  leaveAfterSave.value = true
  showLeaveDialog.value = false
  const saved = await handleSave()
  if (saved) {
    leaveAfterSave.value = false
    await router.push('/')
  }
}

function setSaveNameDialogVisibility(visible: boolean) {
  showSaveNameDialog.value = visible
  if (!visible && !savingName.value) {
    pendingProject.value = null
    leaveAfterSave.value = false
  }
}

async function onSaveNameSubmit(name: string) {
  if (savingName.value || !archive.currentUser) return
  savingName.value = true
  try {
    const project = pendingProject.value ?? graph.buildProjectFile()
    project.title = name
    const meta = await archive.createSave(name, project)
    graph.loadProject(project)
    openedSaveId.value = meta.id
    openedUserId.value = archive.currentUserId
    clearDirty()
    const shouldLeave = leaveAfterSave.value
    pendingProject.value = null
    leaveAfterSave.value = false
    showSaveNameDialog.value = false
    toast.success(t('editor.savedTo', [meta.name]))
    if (shouldLeave) await router.push('/')
  } catch (error) {
    toast.error(t('editor.saveFailed', [messageOf(error)]), t('editor.saveFailedHint'))
  } finally {
    savingName.value = false
  }
}

/**
 * @brief 处理节点选择事件。
 * @param _nodeId 被选择的节点 ID。
 * @return 无返回值。
 */
function onNodeSelect(_nodeId: string) {
  // 选择状态已在 NodeLayer 内部更新。
}

/**
 * @brief 处理节点拖拽开始事件。
 * @param nodeId 被拖拽的节点 ID。
 * @param event 鼠标按下事件。
 * @return 无返回值。
 */
function onNodeDragStart(nodeId: string, event: MouseEvent) {
  startDrag(nodeId, event)
}

/**
 * @brief 记录最近创建或复制的节点，用于触发短暂高亮。
 * @param nodeId 节点 ID。
 * @return 无返回值。
 */
function flashRecentNode(nodeId: string) {
  if (!nodeId) return
  if (recentNodeTimer) {
    clearTimeout(recentNodeTimer)
  }
  recentNodeId.value = null
  requestAnimationFrame(() => {
    recentNodeId.value = nodeId
    recentNodeTimer = setTimeout(() => {
      if (recentNodeId.value === nodeId) {
        recentNodeId.value = null
      }
      recentNodeTimer = null
    }, 900)
  })
}

/**
 * @brief 新增空白人物节点并反馈创建结果。
 * @return 无返回值。
 */
function onAddTestPerson() {
  flashRecentNode(addTestPerson())
}

/**
 * @brief 为当前选中节点添加子节点并反馈创建结果。
 * @return 无返回值。
 */
function onAddChildToSelected() {
  flashRecentNode(addChildToSelected())
}

/**
 * @brief 为当前选中节点添加配偶节点并反馈创建结果。
 * @return 无返回值。
 */
function onAddSpouseToSelected() {
  flashRecentNode(addSpouseToSelected())
}

/**
 * @brief 复制当前上下文节点并选中新副本。
 * @return 无返回值。
 */
function duplicateContextNode() {
  const node = selectedNode.value
  if (!node) return
  const newId = nodeStore.duplicateNode(node.id)
  if (!newId) return
  selectAndRevealNode(newId)
  flashRecentNode(newId)
}

/**
 * @brief 挂载全局键盘快捷键监听。
 */
onMounted(() => {
  void (async () => {
    try {
      await archive.init()
      openedSaveId.value = archive.currentSaveId
      openedUserId.value = archive.currentUserId
      if (archive.currentSaveId) {
        const save = await archive.selectSave(archive.currentSaveId)
        graph.loadProject(save.project)
        openedSaveId.value = save.meta.id
        openedUserId.value = save.meta.userId
      }
    } catch (error) {
      toast.error(t('saves.openFailed', [messageOf(error)]))
    }
  })()
  document.addEventListener('keydown', onGlobalKeyDown, true)
})

/**
 * @brief 卸载全局键盘快捷键监听。
 */
onUnmounted(() => {
  document.removeEventListener('keydown', onGlobalKeyDown, true)
  if (recentNodeTimer) {
    clearTimeout(recentNodeTimer)
  }
})

/** @brief 根据当前交互状态计算画布鼠标光标样式。 */
const canvasCursor = computed(() => {
  if (connection.connecting) return 'crosshair'
  if (spaceHeld.value) return 'grab'
  return 'default'
})

/** @brief 画布矩形和网格背景样式。 */
const canvasRectStyle = CanvasRectStyle()
</script>

<style scoped>
.editor-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
  background: var(--bg-body);
  color: var(--text-body);
}

.editor-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.editor-warning {
  flex: 0 0 auto;
  padding: 7px 12px;
  border-bottom: 1px solid var(--danger, #d55353);
  color: var(--danger, #d55353);
  background: var(--bg-panel);
  font-size: 0.84rem;
  text-align: center;
}

.splitter {
  width: 6px;
  flex-shrink: 0;
  cursor: col-resize;
  background: transparent;
  position: relative;
  z-index: 10;
  transition: background 0.15s;
}

.splitter:hover,
.splitter.active {
  background: var(--accent-blue);
}

.splitter::after {
  content: '';
  position: absolute;
  inset: -4px 0;
}
</style>

<style>
@import '@/styles/modal.css';
</style>
