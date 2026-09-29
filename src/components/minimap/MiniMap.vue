<template>
  <div class="minimap-wrapper" :class="{ collapsed: !visible, 'is-inert': canvasGestureActive }">
    <button
      class="minimap-toggle"
      :title="visible ? t('minimap.hide') : t('minimap.show')"
      @click="toggle"
    >
      {{ visible ? '−' : '＋' }}
    </button>

    <div v-show="visible" class="minimap-body">
      <canvas
        ref="canvasRef"
        class="minimap-canvas"
        :width="realW"
        :height="realH"
        @mousedown="onMouseDown"
        @mousemove="onMouseMove"
        @mouseup="onMouseUp"
        @mouseleave="onMouseUp"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * @file MiniMap.vue - 小地图组件
 * @brief 提供画布全局缩略图导航功能。在右下角显示所有节点的缩略视图。
 */
import { ref, watch, onMounted } from 'vue'
import { useViewportStore } from '@/stores/viewportStore'
import { useCanvasStore } from '@/stores/canvasStore'
import { useGraphStore } from '@/stores/graphStore'
import { useThemeStore } from '@/stores/themeStore'
import { t } from '@/i18n'
import {
  CANVAS_DEFAULT_HEIGHT,
  CANVAS_DEFAULT_WIDTH,
  MINIMAP_CSS_HEIGHT,
  MINIMAP_CSS_WIDTH,
  MINIMAP_DPR,
} from '@/constants/constant'
import { computeWorldBounds } from './minimapGeometry'
import { clearMiniMap, drawEmptyMiniMap, drawMiniMap } from './minimapRenderer'
import { MiniMapNavigation } from '@/composables/MiniMapNavigation'
import { RafDraw } from '@/composables/RafDraw'

const realW = MINIMAP_CSS_WIDTH * MINIMAP_DPR
const realH = MINIMAP_CSS_HEIGHT * MINIMAP_DPR
const realSize = { width: realW, height: realH }

const viewport = useViewportStore()
const canvasStore = useCanvasStore()
const graph = useGraphStore()
const theme = useThemeStore()

const props = defineProps<{
  /** B11 fix: 由父组件传入画布容器引用，避免脆弱的多层 parentElement 链 */
  canvasContainerRef: HTMLElement | null
  /** 画布上是否正在拖拽块：为 true 时小地图完全忽略鼠标事件，拖拽只作用于块。 */
  canvasGestureActive?: boolean
}>()

const visible = ref(true)
const canvasRef = ref<HTMLCanvasElement | null>(null)

function getCanvasSize() {
  const el = props.canvasContainerRef
  if (!el) return { width: CANVAS_DEFAULT_WIDTH, height: CANVAS_DEFAULT_HEIGHT }
  return {
    width: el.clientWidth,
    height: el.clientHeight,
  }
}

function getBounds() {
  return computeWorldBounds(graph.nodes, canvasStore)
}

function draw() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const bounds = getBounds()
  const isDark = theme.isDark
  clearMiniMap(ctx, realSize, isDark)

  if (graph.nodes.length === 0) {
    drawEmptyMiniMap(ctx, realSize, isDark)
    return
  }

  drawMiniMap({
    ctx,
    bounds,
    realSize,
    screenSize: getCanvasSize(),
    canvasRect: canvasStore,
    nodes: graph.nodes,
    edges: graph.edges,
    getNode: id => graph.getNode(id),
    viewport,
    isDark,
  })
}

const { scheduleDraw } = RafDraw(draw)
const { onMouseDown, onMouseMove, onMouseUp } = MiniMapNavigation({
  getBounds,
  getCanvasSize,
  realSize,
  viewport,
  isCanvasGestureActive: () => props.canvasGestureActive === true,
})

function toggle() {
  visible.value = !visible.value
}

watch(() => graph.nodes.length, scheduleDraw)
watch(() => graph.edges.length, scheduleDraw)
watch(() => [viewport.panX, viewport.panY, viewport.zoom], scheduleDraw)
watch(() => graph.nodes.map(n => `${n.position.x},${n.position.y}`).join('|'), scheduleDraw)
watch(() => theme.isDark, scheduleDraw)

onMounted(() => {
  scheduleDraw()
})
</script>

<style scoped>
.minimap-wrapper {
  position: absolute;
  bottom: 12px;
  right: 22px;
  z-index: 100;
  transition: all 0.25s ease;
}

.minimap-wrapper.collapsed {
  min-width: 0;
  min-height: 0;
}

/* 画布拖拽手势进行中：小地图完全不参与鼠标交互，事件直接落到画布上 */
.minimap-wrapper.is-inert {
  pointer-events: none;
}

.minimap-toggle {
  position: absolute;
  top: -26px;
  right: 4px;
  width: 22px;
  height: 22px;
  border-radius: 4px;
  border: 1px solid var(--border-default);
  background: var(--bg-input);
  color: var(--text-body);
  cursor: pointer;
  font-size: 14px;
  line-height: 20px;
  text-align: center;
  padding: 0;
  z-index: 2;
  transition: all 0.2s ease;
}

.minimap-toggle:hover {
  background: var(--bg-element);
  border-color: var(--accent-blue);
}

.minimap-wrapper.collapsed .minimap-toggle {
  position: relative;
  top: auto;
  right: auto;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  font-size: 16px;
  line-height: 30px;
}

.minimap-body {
  overflow: hidden;
  border-radius: 8px;
  border: 1px solid var(--border-default);
  background: var(--canvas-bg);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.minimap-canvas {
  display: block;
  width: 200px;
  height: 150px;
  cursor: pointer;
}
</style>
