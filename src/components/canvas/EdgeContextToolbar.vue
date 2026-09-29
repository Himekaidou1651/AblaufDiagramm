<template>
  <div
    v-if="visible"
    class="edge-context-toolbar"
    role="toolbar"
    :aria-label="t('editor.edgeContextToolbar')"
    :style="toolbarStyle"
    @mousedown.stop
    @keydown.esc.stop.prevent="$emit('close')"
  >
    <button
      class="edge-context-btn toggle-btn"
      type="button"
      :title="toggleTitle"
      :aria-label="toggleTitle"
      @click="$emit('edgeTypeChange', nextEdgeType)"
    >
      ⇄
    </button>
    <button
      class="edge-context-btn danger"
      type="button"
      :title="t('editor.deleteSelectedEdge')"
      :aria-label="t('editor.deleteSelectedEdge')"
      @click="$emit('deleteEdge')"
    >
      ×
    </button>
  </div>
</template>

<script setup lang="ts">
/**
 * @file EdgeContextToolbar.vue
 * @brief 单选关系线时显示在连线附近，提供线类型切换和删除快捷动作。
 * @author 项目维护者
 * @date 2026-08-26
 */

import { computed } from 'vue'
import { useGraphStore } from '@/stores/graphStore'
import { useViewportStore } from '@/stores/viewportStore'
import { useI18n } from '@/i18n'
import { getEdgePath, type EdgePathOptions } from '@/utils/edgePath'
import { getNodeVisualBounds, worldToScreen } from '@/utils/coords'
import type { EdgeType, GenealogyEdge, Position } from '@/types'

const TOOLBAR_W = 84
const TOOLBAR_H = 40
const GAP = 10
const EDGE_PADDING = 8

const props = defineProps<{
  selectedEdge: GenealogyEdge | null
  selectedNodeExists: boolean
  canvasContainerRef: HTMLElement | null
  connecting: boolean
  draggingNodeId: string | null
}>()

defineEmits<{
  edgeTypeChange: [value: EdgeType]
  deleteEdge: []
  close: []
}>()

const graph = useGraphStore()
const viewport = useViewportStore()
const { t } = useI18n()

const visible = computed(() => {
  return !!props.selectedEdge &&
    !props.selectedNodeExists &&
    !props.connecting &&
    !props.draggingNodeId &&
    !!props.canvasContainerRef &&
    !!edgeAnchor.value
})

const nextEdgeType = computed<EdgeType>(() => {
  return props.selectedEdge?.type === 'parent' ? 'spouse' : 'parent'
})

const toggleTitle = computed(() => {
  return props.selectedEdge?.type === 'parent'
    ? t('editor.changeToSpouseEdge')
    : t('editor.changeToParentEdge')
})

const edgeAnchor = computed<Position | null>(() => {
  const edge = props.selectedEdge
  if (!edge) return null

  const source = graph.getNode(edge.source)
  const target = graph.getNode(edge.target)
  if (!source || !target) return null

  const options: EdgePathOptions = {
    edgeId: edge.id,
    sourceId: edge.source,
    targetId: edge.target,
    parentEdges: graph.edges
      .filter(candidate => candidate.type === 'parent')
      .map(candidate => ({
        id: candidate.id,
        source: candidate.source,
        target: candidate.target,
      })),
  }
  const pathData = getEdgePath(
    getNodeVisualBounds(source),
    getNodeVisualBounds(target),
    edge.type,
    options
  )

  return getPolylineMidpoint(parsePathPoints(pathData)) ?? {
    x: (source.position.x + target.position.x) / 2,
    y: (source.position.y + target.position.y) / 2,
  }
})

const toolbarStyle = computed(() => {
  const anchor = edgeAnchor.value
  const container = props.canvasContainerRef
  if (!anchor || !container) return {}

  const screenAnchor = worldToScreen(anchor, viewport.panX, viewport.panY, viewport.zoom)
  let left = screenAnchor.x - TOOLBAR_W / 2
  let top = screenAnchor.y - TOOLBAR_H - GAP

  if (top < EDGE_PADDING) {
    top = screenAnchor.y + GAP
  }

  left = Math.max(EDGE_PADDING, Math.min(container.clientWidth - TOOLBAR_W - EDGE_PADDING, left))
  top = Math.max(EDGE_PADDING, Math.min(container.clientHeight - TOOLBAR_H - EDGE_PADDING, top))

  return {
    left: `${left}px`,
    top: `${top}px`,
  }
})

/**
 * @brief 从当前项目生成的 M/L 折线路径中解析坐标点。
 * @param pathData SVG 路径字符串。
 * @return 折线路径坐标点列表。
 */
function parsePathPoints(pathData: string): Position[] {
  const matches = pathData.matchAll(/[ML]\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/g)
  return Array.from(matches, match => ({
    x: Number.parseFloat(match[1]),
    y: Number.parseFloat(match[2]),
  }))
}

/**
 * @brief 计算折线路径按长度计的中点。
 * @param points 折线路径坐标点列表。
 * @return 路径中点；路径为空时返回 null。
 */
function getPolylineMidpoint(points: Position[]): Position | null {
  if (points.length === 0) return null
  if (points.length === 1) return points[0]

  let total = 0
  for (let i = 1; i < points.length; i++) {
    total += distance(points[i - 1], points[i])
  }

  if (total === 0) return points[0]

  let walked = 0
  const half = total / 2
  for (let i = 1; i < points.length; i++) {
    const previous = points[i - 1]
    const current = points[i]
    const segmentLength = distance(previous, current)
    if (walked + segmentLength >= half) {
      const ratio = (half - walked) / segmentLength
      return {
        x: previous.x + (current.x - previous.x) * ratio,
        y: previous.y + (current.y - previous.y) * ratio,
      }
    }
    walked += segmentLength
  }

  return points[points.length - 1]
}

/**
 * @brief 计算两个点之间的距离。
 * @param a 起点。
 * @param b 终点。
 * @return 两点距离。
 */
function distance(a: Position, b: Position): number {
  return Math.hypot(b.x - a.x, b.y - a.y)
}
</script>

<style scoped>
.edge-context-toolbar {
  position: absolute;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 6px;
  width: 84px;
  height: 40px;
  padding: 4px 6px;
  border: 1px solid var(--border-default);
  border-radius: 8px;
  background: var(--bg-panel);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.22);
  z-index: 180;
}

.edge-context-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 30px;
  border: 1px solid var(--border-light);
  border-radius: 6px;
  background: var(--bg-element);
  color: var(--text-body);
  font-size: 12px;
  line-height: 1;
  font-family: var(--font-serif);
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}

.edge-context-btn:hover,
.edge-context-btn:focus-visible {
  outline: none;
  background: var(--bg-element-hover);
  border-color: var(--accent-blue);
}

.toggle-btn,
.edge-context-btn.danger {
  width: 30px;
  font-size: 16px;
}

.edge-context-btn.danger:hover,
.edge-context-btn.danger:focus-visible {
  border-color: var(--danger);
  background: var(--danger);
  color: #fff;
}
</style>
