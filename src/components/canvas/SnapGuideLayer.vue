<template>
  <svg
    class="snap-guide-layer"
    :style="{
      left: -WORLD_HALF + 'px',
      top: -WORLD_HALF + 'px',
      width: WORLD_SIZE + 'px',
      height: WORLD_SIZE + 'px',
    }"
    :viewBox="`${-WORLD_HALF} ${-WORLD_HALF} ${WORLD_SIZE} ${WORLD_SIZE}`"
  >
    <!-- X 方向吸附辅助线（垂直线，可能多条等距同时显示） -->
    <line
      v-for="(guide, i) in snapGuidesX"
      :key="'x-' + i + '-' + guide.guideLine"
      :x1="guide.guideLine"
      :y1="-WORLD_HALF"
      :x2="guide.guideLine"
      :y2="WORLD_HALF"
      :stroke="SNAP_GUIDE_COLOR"
      :stroke-width="guideLineWidth"
      :stroke-dasharray="isMidLike(guide.anchor) ? MID_DASH : EDGE_DASH"
      stroke-linecap="round"
    />
    <!-- X 方向中点吸附菱形标记 -->
    <polygon
      v-for="(guide, i) in snapGuidesX.filter(g => isMidLike(g.anchor))"
      :key="'dx-' + i + '-' + guide.guideLine"
      :points="diamondPoints(guide.markerX!, guide.markerY!, diamondSize)"
      :fill="SNAP_GUIDE_COLOR"
    />
    <!-- Y 方向吸附辅助线（水平线，可能多条等距同时显示） -->
    <line
      v-for="(guide, i) in snapGuidesY"
      :key="'y-' + i + '-' + guide.guideLine"
      :x1="-WORLD_HALF"
      :y1="guide.guideLine"
      :x2="WORLD_HALF"
      :y2="guide.guideLine"
      :stroke="SNAP_GUIDE_COLOR"
      :stroke-width="guideLineWidth"
      :stroke-dasharray="isMidLike(guide.anchor) ? MID_DASH : EDGE_DASH"
      stroke-linecap="round"
    />
    <!-- Y 方向中点吸附菱形标记 -->
    <polygon
      v-for="(guide, i) in snapGuidesY.filter(g => isMidLike(g.anchor))"
      :key="'dy-' + i + '-' + guide.guideLine"
      :points="diamondPoints(guide.markerX!, guide.markerY!, diamondSize)"
      :fill="SNAP_GUIDE_COLOR"
    />
  </svg>
</template>

<script setup lang="ts">
/**
 * @file SnapGuideLayer.vue - 吸附对齐辅助线渲染层
 * @brief 在拖拽节点触发吸附时绘制 PPT 风格的对齐辅助线。
 *        使用 SVG 世界坐标系，橙色实线/虚线样式，pointer-events: none。
 *        中点对齐时使用虚线 + 菱形标记（◇）。
 * @author 自动生成
 * @date 2026-08-08
 */
import { computed } from 'vue'
import type { SnapAnchor, SnapResult } from '@/utils/snap'
import { WORLD_SIZE, WORLD_HALF } from '@/constants/constant'

// ===== 样式常量 =====

/** 辅助线颜色：橙色（PPT 风格） */
const SNAP_GUIDE_COLOR = '#FF8C00'
/** 边缘对齐辅助线虚线样式 */
const EDGE_DASH = '4 3'
/** 中点对齐辅助线虚线样式 */
const MID_DASH = '6 4'
/** 菱形标记半边长（世界像素） */
const MID_MARKER_HALF = 6

// ===== Props =====

const props = defineProps<{
  /** X 方向当前激活的吸附结果（主要吸附，用于坐标修正） */
  snapX: SnapResult | null
  /** Y 方向当前激活的吸附结果（主要吸附，用于坐标修正） */
  snapY: SnapResult | null
  /** 所有 X 方向辅助线（含 snapX，用于同时渲染多条等距对齐线） */
  snapGuidesX: SnapResult[]
  /** 所有 Y 方向辅助线（含 snapY，用于同时渲染多条等距对齐线） */
  snapGuidesY: SnapResult[]
  /** 当前视口缩放比例（用于计算屏幕像素一致线宽） */
  zoom: number
}>()

// ===== 计算属性 =====

/** 辅助线宽度：随缩放反向缩放，保持屏幕像素一致（约 1.5px） */
const guideLineWidth = computed(() => 1.5 / props.zoom)

/** 菱形标记半边长：随缩放反向缩放 */
const diamondSize = computed(() => MID_MARKER_HALF / props.zoom)

// ===== 辅助函数 =====

/** 判断锚点是否为中点/间距对齐类型（虚线 + 菱形标记） */
function isMidLike(anchor: SnapAnchor): boolean {
  return anchor === 'midX' || anchor === 'spacingX' || anchor === 'midY' || anchor === 'spacingY'
}

/**
 * @brief 生成菱形（◇）的 SVG polygon points
 * @param cx - 中心 X
 * @param cy - 中心 Y
 * @param r - 半边长
 * @returns "x1,y1 x2,y2 x3,y3 x4,y4" 格式字符串
 */
function diamondPoints(cx: number, cy: number, r: number): string {
  return `${cx},${cy - r} ${cx + r},${cy} ${cx},${cy + r} ${cx - r},${cy}`
}
</script>

<style scoped>
.snap-guide-layer {
  position: absolute;
  pointer-events: none;
  z-index: 5;
}
</style>
