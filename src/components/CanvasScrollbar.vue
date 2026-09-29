<template>
  <!-- 水平滑动条 -->
  <div
    v-if="showHorizontal"
    class="canvas-scrollbar horizontal"
    ref="hTrackRef"
    @mousedown.prevent="onTrackClick($event, 'horizontal')"
  >
    <div
      class="scrollbar-thumb"
      :style="hThumbStyle"
      @mousedown.prevent.stop="onThumbDragStart($event, 'horizontal')"
    />
  </div>

  <!-- 垂直滑动条 -->
  <div
    v-if="showVertical"
    class="canvas-scrollbar vertical"
    ref="vTrackRef"
    @mousedown.prevent="onTrackClick($event, 'vertical')"
  >
    <div
      class="scrollbar-thumb"
      :style="vThumbStyle"
      @mousedown.prevent.stop="onThumbDragStart($event, 'vertical')"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * @file CanvasScrollbar.vue - 画布滚动条组件
 * @brief 提供水平和垂直方向的画布滚动条，支持拖动滑块和点击轨道跳转。
 *        滚动条滑块大小和位置随视口缩放和世界范围动态计算。
 * @author 自动生成
 * @date 2026-07-31
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useViewportStore } from '@/stores/viewportStore'
import { useCanvasStore } from '@/stores/canvasStore'
import {
  CANVAS_DEFAULT_WIDTH,
  CANVAS_DEFAULT_HEIGHT,
  SCROLLBAR_MIN_THUMB_SIZE,
  SCROLLBAR_DEFAULT_TRACK_SIZE,
} from '@/constants/constant'

const viewport = useViewportStore()
const canvasStore = useCanvasStore()

// ===== Props =====
const props = defineProps<{
  /** B14 fix: 由父组件传入画布容器引用，直接观察而非依赖轨道元素可见性 */
  canvasContainerRef: HTMLElement | null
}>()

// ===== 轨道元素引用 =====
/** 水平滚动条轨道 DOM 引用 */
const hTrackRef = ref<HTMLElement | null>(null)
/** 垂直滚动条轨道 DOM 引用 */
const vTrackRef = ref<HTMLElement | null>(null)

// ===== 容器尺寸（通过 ResizeObserver 追踪，响应式更新） =====
/** 画布容器尺寸，通过 ResizeObserver 响应式更新 */
const canvasSize = ref({ width: CANVAS_DEFAULT_WIDTH, height: CANVAS_DEFAULT_HEIGHT })
let resizeObserver: ResizeObserver | null = null

/**
 * @brief 获取当前画布容器尺寸
 * @returns 画布容器的宽高
 */
function getCanvasSize() {
  return canvasSize.value
}

// ===== 是否显示滑动条 =====
/** 水平滑动条是否可见：当视口完全覆盖画布矩形时隐藏 */
const showHorizontal = computed(() => {
  const { width } = getCanvasSize()
  return width / viewport.zoom < canvasStore.width
})

/** 垂直滑动条是否可见：当视口完全覆盖画布矩形时隐藏 */
const showVertical = computed(() => {
  const { height } = getCanvasSize()
  return height / viewport.zoom < canvasStore.height
})

// ===== 辅助计算 =====
/**
 * @brief 获取当前视口在世界空间中的可见范围
 * @returns 视口的宽高（世界单位）和中心点坐标
 */
function getViewportRect() {
  const { width, height } = getCanvasSize()
  return {
    worldW: width / viewport.zoom,
    worldH: height / viewport.zoom,
    /** 视口中心在世界空间的 X 坐标 */
    centerX: (width / 2 - viewport.panX) / viewport.zoom,
    /** 视口中心在世界空间的 Y 坐标 */
    centerY: (height / 2 - viewport.panY) / viewport.zoom
  }
}

/**
 * @brief 计算指定方向滚动条轨道的像素长度
 * @param orientation - 滚动条方向：'horizontal' 或 'vertical'
 * @returns 轨道像素长度，默认 200
 */
function getTrackSize(orientation: 'horizontal' | 'vertical'): number {
  if (orientation === 'horizontal') {
    return hTrackRef.value?.clientWidth ?? SCROLLBAR_DEFAULT_TRACK_SIZE
  } else {
    return vTrackRef.value?.clientHeight ?? SCROLLBAR_DEFAULT_TRACK_SIZE
  }
}

// ===== 滑块样式 =====
const hThumbStyle = computed(() => {
  const trackW = getTrackSize('horizontal')
  const { worldW, centerX } = getViewportRect()
  const canvasW = canvasStore.width
  const canvasMinX = canvasStore.x

  // 滑块大小 = 视口宽 / 画布宽 * 轨道宽
  const thumbW = Math.max(SCROLLBAR_MIN_THUMB_SIZE, (worldW / canvasW) * trackW)
  // 滑块位置 = (视口中心 - 画布左边界) / 画布宽 * 轨道宽 - 滑块宽/2
  const ratio = (centerX - canvasMinX) / canvasW
  const left = ratio * trackW - thumbW / 2

  return {
    width: `${thumbW}px`,
    left: `${Math.max(0, Math.min(trackW - thumbW, left))}px`
  }
})

const vThumbStyle = computed(() => {
  const trackH = getTrackSize('vertical')
  const { worldH, centerY } = getViewportRect()
  const canvasH = canvasStore.height
  const canvasMinY = canvasStore.y

  const thumbH = Math.max(SCROLLBAR_MIN_THUMB_SIZE, (worldH / canvasH) * trackH)
  const ratio = (centerY - canvasMinY) / canvasH
  const top = ratio * trackH - thumbH / 2

  return {
    height: `${thumbH}px`,
    top: `${Math.max(0, Math.min(trackH - thumbH, top))}px`
  }
})

// ===== 交互逻辑 =====
/** 当前拖拽方向，null 表示未拖拽 */
let dragging: 'horizontal' | 'vertical' | null = null
/** 拖拽开始时的鼠标位置 */
let dragStartMouse = 0
/** 拖拽开始时的平移量 */
let dragStartPan = 0

/**
 * @brief 点击滚动条轨道时，将视口跳转到对应位置
 * @param event - 鼠标点击事件
 * @param orientation - 滚动条方向：'horizontal' 或 'vertical'
 */
function onTrackClick(event: MouseEvent, orientation: 'horizontal' | 'vertical') {
  const trackSize = getTrackSize(orientation)
  const { width, height } = getCanvasSize()
  const trackEl = orientation === 'horizontal' ? hTrackRef.value : vTrackRef.value
  if (!trackEl) return

  const rect = trackEl.getBoundingClientRect()
  const clickPos = orientation === 'horizontal'
    ? event.clientX - rect.left
    : event.clientY - rect.top

  const canvasDim = orientation === 'horizontal' ? canvasStore.width : canvasStore.height
  const canvasMin = orientation === 'horizontal' ? canvasStore.x : canvasStore.y
  const viewportDim = orientation === 'horizontal' ? width : height

  const thumbSize = (viewportDim / viewport.zoom) / canvasDim * trackSize
  const thumbHalf = Math.max(SCROLLBAR_MIN_THUMB_SIZE, thumbSize) / 2

  // B9 fix: 分母为零保护（极小视口下滑块可能撑满轨道）
  if (trackSize <= thumbHalf * 2) return

  // 计算目标视口中心（世界坐标）
  const ratio = (clickPos - thumbHalf) / (trackSize - thumbHalf * 2)
  const worldTarget = canvasMin + ratio * canvasDim

  // 将世界坐标目标点移动到屏幕中心
  if (orientation === 'horizontal') {
    viewport.panX = width / 2 - worldTarget * viewport.zoom
  } else {
    viewport.panY = height / 2 - worldTarget * viewport.zoom
  }
  // 钳制（使用已存储的容器尺寸）
  viewport.clampPan(0, 0)
}

/**
 * @brief 滑块拖拽开始，记录起始状态并注册全局鼠标事件
 * @param event - 鼠标按下事件
 * @param orientation - 滚动条方向：'horizontal' 或 'vertical'
 */
function onThumbDragStart(event: MouseEvent, orientation: 'horizontal' | 'vertical') {
  dragging = orientation
  dragStartMouse = orientation === 'horizontal' ? event.clientX : event.clientY
  dragStartPan = orientation === 'horizontal' ? viewport.panX : viewport.panY

  window.addEventListener('mousemove', onThumbDrag)
  window.addEventListener('mouseup', onThumbDragEnd)
}

/**
 * @brief 滑块拖拽过程中更新视口平移
 * @description 滑块在世界空间中的移动量 = 屏幕像素差 / 滑块比例
 * @param event - 鼠标移动事件
 */
function onThumbDrag(event: MouseEvent) {
  if (!dragging) return
  const currentMouse = dragging === 'horizontal' ? event.clientX : event.clientY
  const delta = currentMouse - dragStartMouse

  const trackSize = getTrackSize(dragging)
  const canvasDim = dragging === 'horizontal' ? canvasStore.width : canvasStore.height
  const worldDelta = (delta / trackSize) * canvasDim * viewport.zoom

  if (dragging === 'horizontal') {
    viewport.panX = dragStartPan - worldDelta
  } else {
    viewport.panY = dragStartPan - worldDelta
  }
  // 钳制（使用已存储的容器尺寸）
  viewport.clampPan(0, 0)
}

/**
 * @brief 滑块拖拽结束，清理全局鼠标事件监听
 */
function onThumbDragEnd() {
  dragging = null
  window.removeEventListener('mousemove', onThumbDrag)
  window.removeEventListener('mouseup', onThumbDragEnd)
}

onMounted(() => {
  // B14 fix: 直接观察画布容器元素，不再依赖 hTrackRef 的可见性
  const container = props.canvasContainerRef
  if (container) {
    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        canvasSize.value = {
          width: entry.contentRect.width,
          height: entry.contentRect.height
        }
        // 同步容器尺寸到 viewportStore，使所有 zoom/pan 方法自动钳制
        viewport.setContainerSize(entry.contentRect.width, entry.contentRect.height)
      }
    })
    resizeObserver.observe(container)
  }
})

onUnmounted(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
  window.removeEventListener('mousemove', onThumbDrag)
  window.removeEventListener('mouseup', onThumbDragEnd)
})
</script>

<style scoped>
/* 水平滑动条 */
.canvas-scrollbar.horizontal {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 10px;
  height: 10px;
  background: var(--scrollbar-track);
  cursor: pointer;
  z-index: 10;
}

/* 垂直滑动条 */
.canvas-scrollbar.vertical {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 10px;
  width: 10px;
  background: var(--scrollbar-track);
  cursor: pointer;
  z-index: 10;
}

.scrollbar-thumb {
  position: absolute;
  background: var(--scrollbar-thumb);
  border-radius: 5px;
  transition: background 0.1s;
}

.canvas-scrollbar.horizontal .scrollbar-thumb {
  top: 1px;
  height: 8px;
  border-radius: 4px;
}

.canvas-scrollbar.vertical .scrollbar-thumb {
  left: 1px;
  width: 8px;
  border-radius: 4px;
}

.scrollbar-thumb:hover {
  background: var(--scrollbar-thumb-hover);
}

/* 角落交汇处 */
.canvas-scrollbar.horizontal {
  right: 10px; /* 为垂直条留空间 */
}
</style>
