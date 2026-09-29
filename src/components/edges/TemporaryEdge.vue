<template>
  <g v-if="connection.connecting && connection.sourceAnchor" class="temporary-edge-group">
    <!-- 源端小圆 -->
    <circle
      :cx="src.x"
      :cy="src.y"
      :r="SVG_TEMP_DOT_RADIUS"
      fill="var(--accent-blue)"
      opacity="0.7"
    />
    <!-- 连线 -->
    <path
      :d="pathData"
      stroke="var(--accent-blue)"
      :stroke-width="SVG_TEMP_EDGE_WIDTH"
      :stroke-dasharray="SVG_TEMP_DASH_PATTERN"
      fill="none"
      stroke-linecap="round"
    />
    <!-- 鼠标端小圆 -->
    <circle
      :cx="tgt.x"
      :cy="tgt.y"
      :r="SVG_TEMP_DOT_RADIUS"
      fill="var(--accent-blue)"
      opacity="0.7"
    />
  </g>
</template>

<script setup lang="ts">
/**
 * @file TemporaryEdge.vue - 临时连线组件
 * @brief 在用户拖拽连线过程中显示从源锚点到鼠标位置的临时虚线。
 *        使用正交折线路径（先垂直走至少 40px，再水平拐到目标）。
 * @author 自动生成
 * @date 2026-07-31
 */
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useConnectionStore } from '@/stores/connectionStore'
import {
  SVG_TEMP_DOT_RADIUS,
  SVG_TEMP_EDGE_WIDTH,
  SVG_TEMP_DASH_PATTERN,
  SVG_TEMP_MIN_SEGMENT,
} from '@/constants/constant'

const connection = useConnectionStore()
const { connecting, sourceAnchor, mouseWorld } = storeToRefs(connection)

/** 临时连线起点（源锚点） */
const src = computed(() => sourceAnchor.value ?? { x: 0, y: 0 })
/** 临时连线终点（鼠标世界坐标） */
const tgt = computed(() => mouseWorld.value)

/**
 * @brief 计算临时连线的 SVG path 数据
 * @description 生成正交折线路径：先从源点垂直走一段（至少 40px），再水平拐到目标。
 * @returns SVG path d 属性字符串，未连线时返回空字符串
 */
const pathData = computed(() => {
  if (!connecting.value || !sourceAnchor.value) return ''
  const s = sourceAnchor.value
  const t = mouseWorld.value

  // 统一正交折线：先垂直走一段（至少 40px），再水平拐到目标
  const dy = t.y - s.y
  const midY = dy >= 0
    ? s.y + Math.max(dy / 2, SVG_TEMP_MIN_SEGMENT)
    : s.y - Math.max(-dy / 2, SVG_TEMP_MIN_SEGMENT)

  return [
    `M ${s.x.toFixed(1)} ${s.y.toFixed(1)}`,
    `L ${s.x.toFixed(1)} ${midY.toFixed(1)}`,
    `L ${t.x.toFixed(1)} ${midY.toFixed(1)}`,
    `L ${t.x.toFixed(1)} ${t.y.toFixed(1)}`
  ].join(' ')
})
</script>
