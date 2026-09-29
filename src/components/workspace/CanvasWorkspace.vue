<template>
  <main
    ref="canvasRef"
    class="canvas-area"
    :style="{ cursor: canvasCursor }"
    tabindex="0"
    @keydown="$emit('keyDown', $event)"
    @mousedown="$emit('canvasMouseDown', $event)"
  >
    <!-- 画布变换层 -->
    <div
      class="canvas-layer"
      :style="{ transform: viewport.canvasTransform }"
    >
      <!-- 画布外部背景层（覆盖画布矩形外的所有区域） -->
      <div class="canvas-outside-bg" />
      <!-- 画布矩形视觉（含背景网格，仅矩形区域内显示） -->
      <div
        class="canvas-rect"
        :style="canvasRectStyle"
      />
      <!-- SVG 连线层（在节点下方） -->
      <EdgeLayer />
      <!-- 节点渲染层 -->
      <NodeLayer
        ref="nodeLayerRef"
        :recent-node-id="recentNodeId"
        @node-drag-start="onNodeDragStart"
        @node-select="$emit('nodeSelect', $event)"
      />
      <!-- 吸附辅助线层（在节点上方） -->
      <SnapGuideLayer
        :snap-x="activeSnapX"
        :snap-y="activeSnapY"
        :snap-guides-x="activeSnapGuidesX"
        :snap-guides-y="activeSnapGuidesY"
        :zoom="viewport.zoom"
      />
    </div>

    <!-- 框选层 -->
    <SelectionLayer :container-ref="canvasRef" />

    <!-- 节点上下文工具条 -->
    <NodeContextToolbar
      :selected-node="selectedNode"
      :canvas-container-ref="canvasRef"
      :connecting="connection.connecting"
      :dragging-node-id="draggingNodeId"
      @add-child="$emit('addChild')"
      @add-spouse="$emit('addSpouse')"
      @duplicate-node="$emit('duplicateNode')"
      @delete-node="$emit('deleteNode')"
      @close="$emit('closeContextToolbar')"
    />

    <!-- 关系线上下文工具条 -->
    <EdgeContextToolbar
      :selected-edge="selectedEdge"
      :selected-node-exists="!!selectedNode"
      :canvas-container-ref="canvasRef"
      :connecting="connection.connecting"
      :dragging-node-id="draggingNodeId"
      @edge-type-change="$emit('edgeTypeChange', $event)"
      @delete-edge="$emit('deleteEdge')"
      @close="$emit('closeContextToolbar')"
    />

    <!-- 小地图 -->
    <MiniMap
      :canvas-container-ref="canvasRef"
      :canvas-gesture-active="draggingNodeId !== null"
    />

    <!-- 画布滑动条 -->
    <CanvasScrollbar :canvas-container-ref="canvasRef" />

    <!-- Space 拖拽提示 -->
    <div v-if="spaceHeld" class="space-hint">{{ t('editor.dragHint') }}</div>
  </main>
</template>

<script setup lang="ts">
/**
 * @file CanvasWorkspace.vue - 编辑器画布工作区
 * @brief 承载画布世界层和屏幕覆盖层，保持 Canvas 作为主工作区。
 */
import { onMounted, ref } from 'vue'
import { useViewportStore } from '@/stores/viewportStore'
import { useConnectionStore } from '@/stores/connectionStore'
import { useI18n } from '@/i18n'
import CanvasScrollbar from '@/components/CanvasScrollbar.vue'
import MiniMap from '@/components/minimap/MiniMap.vue'
import NodeLayer from '@/components/canvas/NodeLayer.vue'
import EdgeLayer from '@/components/canvas/EdgeLayer.vue'
import SelectionLayer from '@/components/canvas/SelectionLayer.vue'
import SnapGuideLayer from '@/components/canvas/SnapGuideLayer.vue'
import NodeContextToolbar from '@/components/canvas/NodeContextToolbar.vue'
import EdgeContextToolbar from '@/components/canvas/EdgeContextToolbar.vue'
import type { EdgeType, GenealogyEdge, PersonNode } from '@/types'
import type { SnapResult } from '@/utils/snap'

defineProps<{
  canvasCursor: string
  canvasRectStyle: Record<string, string>
  spaceHeld: boolean
  activeSnapX: SnapResult | null
  activeSnapY: SnapResult | null
  activeSnapGuidesX: SnapResult[]
  activeSnapGuidesY: SnapResult[]
  selectedNode: PersonNode | null
  selectedEdge: GenealogyEdge | null
  recentNodeId: string | null
  draggingNodeId: string | null
}>()

const emit = defineEmits<{
  canvasReady: [el: HTMLElement]
  keyDown: [event: KeyboardEvent]
  canvasMouseDown: [event: MouseEvent]
  nodeDragStart: [nodeId: string, event: MouseEvent]
  nodeSelect: [nodeId: string]
  addChild: []
  addSpouse: []
  duplicateNode: []
  deleteNode: []
  edgeTypeChange: [value: EdgeType]
  deleteEdge: []
  closeContextToolbar: []
}>()

const viewport = useViewportStore()
const connection = useConnectionStore()
const { t } = useI18n()
const canvasRef = ref<HTMLElement | null>(null)
const nodeLayerRef = ref<InstanceType<typeof NodeLayer> | null>(null)
void nodeLayerRef

function onNodeDragStart(nodeId: string, event: MouseEvent) {
  emit('nodeDragStart', nodeId, event)
}

onMounted(() => {
  if (canvasRef.value) {
    emit('canvasReady', canvasRef.value)
  }
})

defineExpose({ canvasRef })
</script>

<style scoped>
.canvas-area {
  flex: 1;
  position: relative;
  overflow: hidden;
  background-color: var(--canvas-bg);
  cursor: default;
  outline: none;
}

.canvas-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 0;
  height: 0;
  transform-origin: 0 0;
}

.canvas-rect {
  position: absolute;
  background-color: var(--canvas-layer-bg);
  background-origin: border-box;
  border: 1px solid var(--canvas-layer-border);
  pointer-events: none;
}

.canvas-outside-bg {
  position: absolute;
  top: -50000px;
  left: -50000px;
  width: 100000px;
  height: 100000px;
  background: var(--canvas-outside-bg);
  z-index: -1;
  pointer-events: none;
}

.space-hint {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 8px 20px;
  background: var(--space-hint-bg);
  border: 1px solid var(--border-light);
  border-radius: 8px;
  color: var(--text-dim);
  font-size: 14px;
  pointer-events: none;
  z-index: 100;
}
</style>
