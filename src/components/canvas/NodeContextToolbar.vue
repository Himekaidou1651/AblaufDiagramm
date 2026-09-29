<template>
  <div
    v-if="visible"
    class="node-context-toolbar"
    role="toolbar"
    :aria-label="t('editor.nodeContextToolbar')"
    :style="toolbarStyle"
    @mousedown.stop
    @keydown.esc.stop.prevent="$emit('close')"
  >
    <button
      class="context-btn"
      type="button"
      :title="t('editor.addChildNode')"
      :aria-label="t('editor.addChildNode')"
      @click="$emit('addChild')"
    >
      ⨣
    </button>
    <button
      class="context-btn"
      type="button"
      :title="t('editor.addSpouseNode')"
      :aria-label="t('editor.addSpouseNode')"
      @click="$emit('addSpouse')"
    >
      ⨢
    </button>
    <button
      class="context-btn"
      type="button"
      :title="t('editor.duplicateNode')"
      :aria-label="t('editor.duplicateNode')"
      @click="$emit('duplicateNode')"
    >
      ⧉
    </button>
    <button
      class="context-btn danger"
      type="button"
      :title="t('editor.deleteNode')"
      :aria-label="t('editor.deleteNode')"
      @click="$emit('deleteNode')"
    >
      ×
    </button>
  </div>
</template>

<script setup lang="ts">
/**
 * @file NodeContextToolbar.vue - 节点上下文工具条
 * @brief 单选节点时显示在节点附近，承载与当前节点强相关的快捷动作。
 */
import { computed } from 'vue'
import { useViewportStore } from '@/stores/viewportStore'
import { useI18n } from '@/i18n'
import { getNodeVisualBounds, worldToScreen } from '@/utils/coords'
import type { PersonNode } from '@/types'

const TOOLBAR_W = 80
const TOOLBAR_H = 80
const GAP = 10
const EDGE_PADDING = 8

const props = defineProps<{
  selectedNode: PersonNode | null
  canvasContainerRef: HTMLElement | null
  connecting: boolean
  draggingNodeId: string | null
}>()

defineEmits<{
  addChild: []
  addSpouse: []
  duplicateNode: []
  deleteNode: []
  close: []
}>()

const viewport = useViewportStore()
const { t } = useI18n()

const visible = computed(() => {
  return !!props.selectedNode && !props.connecting && !props.draggingNodeId && !!props.canvasContainerRef
})

const toolbarStyle = computed(() => {
  const node = props.selectedNode
  const container = props.canvasContainerRef
  if (!node || !container) return {}

  const bounds = getNodeVisualBounds(node)
  const anchor = worldToScreen(
    {
      x: bounds.left + bounds.width,
      y: bounds.top + bounds.height / 2,
    },
    viewport.panX,
    viewport.panY,
    viewport.zoom
  )

  let left = anchor.x + GAP
  let top = anchor.y - TOOLBAR_H / 2

  if (left + TOOLBAR_W + EDGE_PADDING > container.clientWidth) {
    const leftAnchor = worldToScreen(
      {
        x: bounds.left,
        y: bounds.top + bounds.height / 2,
      },
      viewport.panX,
      viewport.panY,
      viewport.zoom
    )
    left = leftAnchor.x - TOOLBAR_W - GAP
  }

  left = Math.max(EDGE_PADDING, Math.min(container.clientWidth - TOOLBAR_W - EDGE_PADDING, left))
  top = Math.max(EDGE_PADDING, Math.min(container.clientHeight - TOOLBAR_H - EDGE_PADDING, top))

  return {
    left: `${left}px`,
    top: `${top}px`,
  }
})
</script>

<style scoped>
.node-context-toolbar {
  position: absolute;
  box-sizing: border-box;
  display: grid;
  grid-template-columns: repeat(2, 30px);
  grid-template-rows: repeat(2, 30px);
  place-content: center;
  gap: 6px;
  width: 80px;
  height: 80px;
  padding: 6px;
  border: 1px solid var(--border-default);
  border-radius: 8px;
  background: var(--bg-panel);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.22);
  z-index: 180;
}

.context-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: 1px solid var(--border-light);
  border-radius: 6px;
  background: var(--bg-element);
  color: var(--text-body);
  font-size: 16px;
  line-height: 1;
  font-family: var(--font-serif);
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}

.context-btn:hover,
.context-btn:focus-visible {
  outline: none;
  background: var(--bg-element-hover);
  border-color: var(--accent-blue);
}

.context-btn.danger:hover,
.context-btn.danger:focus-visible {
  border-color: var(--danger);
  background: var(--danger);
  color: #fff;
}
</style>
