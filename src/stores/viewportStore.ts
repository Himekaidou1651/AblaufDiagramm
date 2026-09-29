/**
 * @file viewportStore.ts - 视口状态管理
 * @brief 管理画布的平移（pan）和缩放（zoom）状态。
 *        提供以屏幕某点为中心的缩放算法，以及 CSS transform 字符串的直接生成。
 * @author 自动生成
 * @date 2026-07-31
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { GraphNode, Viewport } from '@/types'
import { MIN_ZOOM, MAX_ZOOM, ZOOM_STEP, ZOOM_PRECISION } from '@/constants/constant'
import { useCanvasStore } from '@/stores/canvasStore'
import { getNodeVisualBounds } from '@/utils/coords'

const FIT_PADDING = 64

export const useViewportStore = defineStore('viewport', () => {
  // ===== 状态 =====
  /** 画布平移偏移量 X（屏幕像素） */
  const panX = ref(0)
  /** 画布平移偏移量 Y（屏幕像素） */
  const panY = ref(0)
  /** 缩放级别 */
  const zoom = ref(1)
  /** 画布容器宽度（像素），由外部 ResizeObserver 更新 */
  const containerW = ref(0)
  /** 画布容器高度（像素），由外部 ResizeObserver 更新 */
  const containerH = ref(0)

  // ===== 外部 store =====
  const canvasStore = useCanvasStore()

  // ===== 计算属性 =====
  /** 视口状态对象 */
  const viewport = computed<Viewport>(() => ({
    x: panX.value,
    y: panY.value,
    zoom: zoom.value
  }))

  /** CSS transform 字符串，直接用于画布层 */
  const canvasTransform = computed(() => {
    return `translate(${panX.value}px, ${panY.value}px) scale(${zoom.value})`
  })

  // ===== 动作 =====

  /**
   * @brief 更新画布容器尺寸（供 ResizeObserver 回调使用）
   * @param w - 容器宽度（像素）
   * @param h - 容器高度（像素）
   */
  function setContainerSize(w: number, h: number) {
    containerW.value = w
    containerH.value = h
  }

  /**
   * @brief 内部钳制：使用存储的容器尺寸限制 pan 偏移
   * @description 若容器尺寸尚未初始化（=0），则跳过钳制。
   *              考虑画布矩形的实际世界坐标偏移（canvasStore.x / canvasStore.y），
   *              确保画布矩形始终可见且不会露出大片空白。
   *              当画布矩形小于视口时：将画布限制在视口范围内（不与视口边界分离）。
   *              当画布矩形大于视口时：限制 pan 偏移，使画布边缘不会离开视口边界。
   */
  function _clampPan() {
    const vw = containerW.value
    const vh = containerH.value
    if (vw <= 0 || vh <= 0) return

    const z = zoom.value
    const cx = canvasStore.x
    const cy = canvasStore.y
    const cw = canvasStore.width
    const ch = canvasStore.height

    // 画布屏幕空间边界（考虑画布世界坐标偏移）
    // screenLeft   = panX + cx * z
    // screenRight  = panX + (cx + cw) * z
    // screenTop    = panY + cy * z
    // screenBottom = panY + (cy + ch) * z
    const canvasScreenW = cw * z
    const canvasScreenH = ch * z

    // 水平方向钳制
    if (canvasScreenW <= vw) {
      // 画布完全在视口内：禁止拖出视口，确保画布矩形完整可见
      // panX 下限：画布左边缘 >= 视口左边缘 → panX >= -cx * z
      // panX 上限：画布右边缘 <= 视口右边缘 → panX <= vw - (cx + cw) * z
      panX.value = Math.max(-cx * z, Math.min(vw - (cx + cw) * z, panX.value))
    } else {
      // 画布大于视口：禁止拖出画布边界，确保视口边缘不露出画布外空白
      // panX 上限：画布左边缘 <= 视口左边缘 → panX <= -cx * z
      // panX 下限：画布右边缘 >= 视口右边缘 → panX >= vw - (cx + cw) * z
      panX.value = Math.max(vw - (cx + cw) * z, Math.min(-cx * z, panX.value))
    }

    // 垂直方向钳制
    if (canvasScreenH <= vh) {
      // 画布完全在视口内：禁止拖出视口
      panY.value = Math.max(-cy * z, Math.min(vh - (cy + ch) * z, panY.value))
    } else {
      // 画布大于视口：禁止拖出画布边界
      panY.value = Math.max(vh - (cy + ch) * z, Math.min(-cy * z, panY.value))
    }
  }

  /**
   * @brief 平移：累加偏移量
   * @param dx - X 方向偏移（屏幕像素）
   * @param dy - Y 方向偏移（屏幕像素）
   */
  function pan(dx: number, dy: number) {
    panX.value += dx
    panY.value += dy
    _clampPan()
  }

  /**
   * @brief 缩放：以屏幕某点为中心缩放
   * @description 调整平移量使该屏幕点对应的世界坐标保持不变。
   *              worldX = (screenX - panX) / oldZoom
   *              newPanX = screenX - worldX * newZoom
   * @param screenX - 缩放中心屏幕 X 坐标
   * @param screenY - 缩放中心屏幕 Y 坐标
   * @param delta - 缩放增量因子
   */
  function zoomAt(screenX: number, screenY: number, delta: number) {
    const oldZoom = zoom.value
    const newZoom = clampZoom(oldZoom * delta)

    const worldX = (screenX - panX.value) / oldZoom
    const worldY = (screenY - panY.value) / oldZoom

    panX.value = screenX - worldX * newZoom
    panY.value = screenY - worldY * newZoom
    zoom.value = newZoom
    _clampPan()
  }

  /**
   * @brief 重置视口到默认状态
   */
  function reset() {
    panX.value = 0
    panY.value = 0
    zoom.value = 1
    _clampPan()
  }

  /**
   * @brief 步进放大
   * @description 以当前缩放倍数为基础，增加一个步长（ZOOM_STEP），不超过 MAX_ZOOM。
   */
  function zoomIn() {
    const newZoom = clampZoom(zoom.value + ZOOM_STEP)
    // 以视口中心为缩放中心
    const centerX = window.innerWidth / 2
    const centerY = window.innerHeight / 2
    const oldZoom = zoom.value
    const worldX = (centerX - panX.value) / oldZoom
    const worldY = (centerY - panY.value) / oldZoom
    panX.value = centerX - worldX * newZoom
    panY.value = centerY - worldY * newZoom
    zoom.value = newZoom
    _clampPan()
  }

  /**
   * @brief 步进缩小
   * @description 以当前缩放倍数为基础，减少一个步长（ZOOM_STEP），不低于 MIN_ZOOM。
   */
  function zoomOut() {
    const newZoom = clampZoom(zoom.value - ZOOM_STEP)
    const centerX = window.innerWidth / 2
    const centerY = window.innerHeight / 2
    const oldZoom = zoom.value
    const worldX = (centerX - panX.value) / oldZoom
    const worldY = (centerY - panY.value) / oldZoom
    panX.value = centerX - worldX * newZoom
    panY.value = centerY - worldY * newZoom
    zoom.value = newZoom
    _clampPan()
  }

  /**
   * @brief 直接设置缩放倍数（以视口中心为缩放中心）
   * @param newZoom - 目标缩放倍数，会被 clampZoom 限制
   */
  function setZoom(newZoom: number) {
    const clamped = clampZoom(newZoom)
    const centerX = window.innerWidth / 2
    const centerY = window.innerHeight / 2
    const oldZoom = zoom.value
    const worldX = (centerX - panX.value) / oldZoom
    const worldY = (centerY - panY.value) / oldZoom
    panX.value = centerX - worldX * clamped
    panY.value = centerY - worldY * clamped
    zoom.value = clamped
    _clampPan()
  }

  /**
   * @brief 将 pan 偏移量钳制在画布边界内（同时更新容器尺寸）
   * @param viewportW - 视口宽度（像素），若为 0 则使用已存储值
   * @param viewportH - 视口高度（像素），若为 0 则使用已存储值
   */
  function clampPan(viewportW: number, viewportH: number) {
    if (viewportW > 0) containerW.value = viewportW
    if (viewportH > 0) containerH.value = viewportH
    _clampPan()
  }

  function fitBounds(bounds: { minX: number; minY: number; maxX: number; maxY: number }, padding = FIT_PADDING) {
    const vw = containerW.value || window.innerWidth
    const vh = containerH.value || window.innerHeight
    const width = Math.max(1, bounds.maxX - bounds.minX)
    const height = Math.max(1, bounds.maxY - bounds.minY)
    const usableW = Math.max(1, vw - padding * 2)
    const usableH = Math.max(1, vh - padding * 2)
    const nextZoom = clampZoom(Math.min(usableW / width, usableH / height))
    const centerX = (bounds.minX + bounds.maxX) / 2
    const centerY = (bounds.minY + bounds.maxY) / 2

    zoom.value = nextZoom
    panX.value = vw / 2 - centerX * nextZoom
    panY.value = vh / 2 - centerY * nextZoom
    _clampPan()
  }

  function fitCanvas() {
    fitBounds({
      minX: canvasStore.x,
      minY: canvasStore.y,
      maxX: canvasStore.x + canvasStore.width,
      maxY: canvasStore.y + canvasStore.height,
    })
  }

  function fitContent(nodes: GraphNode[]) {
    const bounds = nodes.reduce<null | { minX: number; minY: number; maxX: number; maxY: number }>((acc, node) => {
      if (node.kind !== 'person') return acc
      const nodeBounds = getNodeVisualBounds(node)
      const next = {
        minX: nodeBounds.left,
        minY: nodeBounds.top,
        maxX: nodeBounds.left + nodeBounds.width,
        maxY: nodeBounds.top + nodeBounds.height,
      }
      if (!acc) return next
      return {
        minX: Math.min(acc.minX, next.minX),
        minY: Math.min(acc.minY, next.minY),
        maxX: Math.max(acc.maxX, next.maxX),
        maxY: Math.max(acc.maxY, next.maxY),
      }
    }, null)

    if (!bounds) {
      fitCanvas()
      return
    }

    fitBounds(bounds)
  }

  return {
    // 状态
    panX,
    panY,
    zoom,
    containerW,
    containerH,
    // 计算
    viewport,
    canvasTransform,
    // 动作
    pan,
    zoomAt,
    reset,
    zoomIn,
    zoomOut,
    setZoom,
    clampPan,
    setContainerSize,
    fitCanvas,
    fitContent,
  }
})

/**
 * @brief 将 zoom 值限制在 [MIN_ZOOM, MAX_ZOOM] 范围内
 * @param z - 原始缩放值
 * @returns 限制后的缩放值，精度为小数点后 2 位
 */
function clampZoom(z: number): number {
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Math.round(z * ZOOM_PRECISION) / ZOOM_PRECISION))
}
