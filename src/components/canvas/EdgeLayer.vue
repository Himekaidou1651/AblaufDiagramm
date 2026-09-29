<template>
  <svg
    class="edge-svg"
    :style="{ left: vb.x + 'px', top: vb.y + 'px', width: vb.w + 'px', height: vb.h + 'px' }"
    :viewBox="`${vb.x} ${vb.y} ${vb.w} ${vb.h}`"
    xmlns="http://www.w3.org/2000/svg"
  >
    <GenealogyPath
      v-for="edge in graph.edges"
      :key="edge.id"
      :edge="edge"
    />
    <TemporaryEdge v-if="connection.connecting" />
  </svg>
</template>

<script setup lang="ts">
/**
 * @file EdgeLayer.vue - 边线渲染图层
 * @brief 使用 SVG viewBox 动态裁剪技术，仅渲染视口范围内的边线节点。
 *        通过计算所有节点和临时连线的最小包围盒来确定 SVG viewBox，
 *        避免渲染全量 SVG 带来的性能问题。
 * @author 自动生成
 * @date 2026-07-31
 */
import { computed } from 'vue'
import { useGraphStore } from '@/stores/graphStore'
import { useConnectionStore } from '@/stores/connectionStore'
import GenealogyPath from '@/components/edges/GenealogyPath.vue'
import TemporaryEdge from '@/components/edges/TemporaryEdge.vue'
import { SVG_VIEWBOX_DEFAULT, SVG_VIEWBOX_PAD } from '@/constants/constant'
import { getNodeVisualBounds } from '@/utils/coords'

const graph = useGraphStore()
const connection = useConnectionStore()

/**
 * @brief 动态计算 SVG viewBox
 * @description 根据所有节点和临时连线计算最小包围盒，加上 padding 后作为 viewBox。
 *              当没有节点且无连线时，返回默认范围 (-2000, -2000, 4000, 4000)。
 * @returns SVG viewBox 参数 { x, y, w, h }
 */
const vb = computed(() => {
  const nodes = graph.nodes
  // 没有节点也没有连线 → 使用默认范围
  if (nodes.length === 0 && !connection.connecting) {
    return { x: SVG_VIEWBOX_DEFAULT.x, y: SVG_VIEWBOX_DEFAULT.y, w: SVG_VIEWBOX_DEFAULT.w, h: SVG_VIEWBOX_DEFAULT.h }
  }

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity

  for (const n of nodes) {
    const vb = getNodeVisualBounds(n)
    minX = Math.min(minX, vb.left)
    minY = Math.min(minY, vb.top)
    maxX = Math.max(maxX, vb.left + vb.width)
    maxY = Math.max(maxY, vb.top + vb.height)
  }

  // 连线中时，覆盖鼠标位置和源锚点
  if (connection.connecting && connection.sourceAnchor) {
    const a = connection.sourceAnchor
    const m = connection.mouseWorld
    if (!Number.isFinite(minX)) { minX = a.x; maxX = a.x; minY = a.y; maxY = a.y }
    minX = Math.min(minX, a.x, m.x)
    maxX = Math.max(maxX, a.x, m.x)
    minY = Math.min(minY, a.y, m.y)
    maxY = Math.max(maxY, a.y, m.y)
  }

  // B10 fix: 仅 Branch 节点或空数据时 minX 可能为 Infinity，使用默认值
  if (!Number.isFinite(minX)) {
    return { x: SVG_VIEWBOX_DEFAULT.x, y: SVG_VIEWBOX_DEFAULT.y, w: SVG_VIEWBOX_DEFAULT.w, h: SVG_VIEWBOX_DEFAULT.h }
  }

  const pad = SVG_VIEWBOX_PAD
  return {
    x: minX - pad,
    y: minY - pad,
    w: maxX - minX + pad * 2,
    h: maxY - minY + pad * 2
  }
})
</script>

<style scoped>
.edge-svg {
  position: absolute;
  z-index: 0;
  overflow: visible;
}
</style>
