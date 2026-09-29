<template>
  <g
    class="genealogy-edge-group"
    :class="{ 'is-selected': selected }"
    @click.stop="onClick"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
  >
    <path
      :d="pathData"
      stroke="transparent"
      :stroke-width="SVG_EDGE_HIT_AREA_WIDTH"
      fill="none"
      class="edge-hit-area"
    />
    <path
      :d="pathData"
      :stroke="strokeColor"
      :stroke-width="SVG_EDGE_STROKE_WIDTH"
      fill="none"
      stroke-linecap="butt"
      :class="{ 'is-hovered': hovered }"
    />
  </g>
</template>

<script setup lang="ts">
/**
 * @file GenealogyPath.vue
 * @brief 渲染族谱画布中的关系连线，并处理连线悬停和选择交互。
 * @author 项目维护者
 * @date 2026-08-26
 */

import { computed, ref } from 'vue'
import { useGraphStore } from '@/stores/graphStore'
import { useSelectionStore } from '@/stores/selectionStore'
import { getEdgePath } from '@/utils/edgePath'
import type { EdgePathOptions } from '@/utils/edgePath'
import { getNodeVisualBounds } from '@/utils/coords'
import type { GenealogyEdge } from '@/types'
import { SVG_EDGE_HIT_AREA_WIDTH, SVG_EDGE_STROKE_WIDTH } from '@/constants/constant'

/**
 * @brief 定义关系连线组件的输入属性。
 */
const props = defineProps<{ edge: GenealogyEdge }>()
const graph = useGraphStore()
const selection = useSelectionStore()

/** @brief 标记当前连线是否处于鼠标悬停状态。 */
const hovered = ref(false)

/** @brief 判断当前连线是否已被选中。 */
const selected = computed(() => selection.isEdgeSelected(props.edge.id))

/**
 * @brief 根据源节点颜色计算连线描边颜色。
 * @return 连线描边颜色。
 */
const strokeColor = computed(() => {
  const srcNode = graph.getNode(props.edge.source)
  if (!srcNode || srcNode.kind !== 'person') return 'var(--text-muted)'
  return srcNode.data.color ?? 'var(--text-muted)'
})

/**
 * @brief 根据边类型和节点边界计算 SVG 路径数据。
 * @return 用于 path 元素的 SVG 路径字符串。
 */
const pathData = computed(() => {
  const src = graph.getNode(props.edge.source)
  const tgt = graph.getNode(props.edge.target)
  if (!src || !tgt) return ''

  const opts: EdgePathOptions = {
    edgeId: props.edge.id,
    sourceId: props.edge.source,
    targetId: props.edge.target,
    parentEdges: graph.edges
      .filter(edge => edge.type === 'parent')
      .map(edge => ({ id: edge.id, source: edge.source, target: edge.target })),
  }

  return getEdgePath(
    getNodeVisualBounds(src),
    getNodeVisualBounds(tgt),
    props.edge.type,
    opts
  )
})

/**
 * @brief 处理连线点击并更新选择状态。
 * @param event 鼠标点击事件。
 * @return 无返回值。
 */
function onClick(event: MouseEvent) {
  event.stopPropagation()
  if (event.ctrlKey || event.metaKey) {
    if (selection.isEdgeSelected(props.edge.id)) {
      selection.clearSelection()
    } else {
      selection.selectEdge(props.edge.id)
    }
  } else {
    selection.selectEdge(props.edge.id)
  }
}

/**
 * @brief 标记鼠标进入连线区域。
 * @return 无返回值。
 */
function onMouseEnter() {
  hovered.value = true
}

/**
 * @brief 标记鼠标离开连线区域。
 * @return 无返回值。
 */
function onMouseLeave() {
  hovered.value = false
}
</script>

<style scoped>
.edge-hit-area {
  cursor: pointer;
}

.genealogy-edge-group.is-selected path:not(.edge-hit-area) {
  stroke: var(--accent-blue) !important;
  filter: drop-shadow(0 0 4px rgba(137, 180, 250, 0.5));
}
</style>
