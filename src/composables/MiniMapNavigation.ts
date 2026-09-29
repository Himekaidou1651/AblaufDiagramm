/**
 * @file MiniMapNavigation.ts
 * @brief 提供小地图点击定位和拖拽视口导航能力。
 *        画布上存在进行中的拖拽手势（例如拖块）时，小地图完全忽略鼠标事件。
 * @author 项目维护者
 * @date 2026-08-26
 */

import { ref } from 'vue'
import { MINIMAP_DPR } from '@/constants/constant'
import type { MiniMapBounds, SizeLike, ViewportLike } from '@/components/minimap/minimapGeometry'
import {
  computeViewportRect,
  getEffectiveScale,
  isInsideViewport,
  miniToWorld,
} from '@/components/minimap/minimapGeometry'

/**
 * @interface MiniMapNavigationDeps
 * @brief 表示小地图导航所需的几何尺寸和视口依赖。
 */
interface MiniMapNavigationDeps {
  /** @brief 获取小地图中真实内容边界。 */
  getBounds(): MiniMapBounds

  /** @brief 获取画布容器尺寸。 */
  getCanvasSize(): SizeLike

  /** @brief 真实画布尺寸。 */
  realSize: SizeLike

  /** @brief 可读写并可平移钳制的视口状态。 */
  viewport: ViewportLike & {
    pan(dx: number, dy: number): void
    clampPan(width: number, height: number): void
  }

  /**
   * @brief 判断画布上是否存在进行中的拖拽手势（例如拖块）。
   * @return 存在进行中的画布手势时返回 true。
   */
  isCanvasGestureActive?(): boolean
}

/**
 * @brief 创建小地图导航交互处理器。
 * @param deps 小地图导航所需依赖。
 * @return 拖拽状态和鼠标事件处理器。
 */
export function MiniMapNavigation(deps: MiniMapNavigationDeps) {
  /** @brief 标记当前是否正在拖拽小地图视口框。 */
  const isDragging = ref(false)

  /** @brief 上一次拖拽采样的小地图坐标。 */
  let dragStartMini = { mx: 0, my: 0 }

  /**
   * @brief 判断当前是否应完全忽略小地图交互。
   * @return 画布手势进行中时返回 true。
   */
  function isIgnored() {
    return deps.isCanvasGestureActive?.() === true
  }

  /**
   * @brief 将鼠标事件位置转换为小地图坐标。
   * @param e 鼠标事件。
   * @return 小地图坐标。
   */
  function getMiniCoords(e: MouseEvent) {
    return {
      mx: e.offsetX * MINIMAP_DPR,
      my: e.offsetY * MINIMAP_DPR,
    }
  }

  /**
   * @brief 将视口偏移限制在画布范围内。
   * @return 无返回值。
   */
  function clampViewportToCanvasBounds() {
    const { width, height } = deps.getCanvasSize()
    deps.viewport.clampPan(width, height)
  }

  /**
   * @brief 将主视口中心导航到指定小地图坐标对应的位置。
   * @param mx 小地图 X 坐标。
   * @param my 小地图 Y 坐标。
   * @return 无返回值。
   */
  function navigateTo(mx: number, my: number) {
    const bounds = deps.getBounds()
    const { wx, wy } = miniToWorld(mx, my, bounds, deps.realSize, deps.viewport.zoom)
    const screenSize = deps.getCanvasSize()

    deps.viewport.panX = screenSize.width / 2 - wx * deps.viewport.zoom
    deps.viewport.panY = screenSize.height / 2 - wy * deps.viewport.zoom
    clampViewportToCanvasBounds()
  }

  /**
   * @brief 按小地图拖拽距离移动主视口。
   * @param deltaMiniX 小地图 X 方向拖拽距离。
   * @param deltaMiniY 小地图 Y 方向拖拽距离。
   * @return 无返回值。
   */
  function dragViewport(deltaMiniX: number, deltaMiniY: number) {
    const bounds = deps.getBounds()
    clampViewportToCanvasBounds()
    const scale = getEffectiveScale(bounds, deps.realSize, deps.viewport.zoom)
    const worldDx = deltaMiniX / scale
    const worldDy = deltaMiniY / scale
    deps.viewport.pan(-worldDx * deps.viewport.zoom, -worldDy * deps.viewport.zoom)
  }

  /**
   * @brief 处理小地图鼠标按下事件，启动视口拖拽或跳转导航。
   * @param e 鼠标按下事件。
   * @return 无返回值。
   */
  function onMouseDown(e: MouseEvent) {
    // 画布拖块等手势进行中：完全不考虑小地图，事件一律放行给画布
    if (isIgnored()) return

    e.stopPropagation()
    e.preventDefault()
    if (e.button !== 0) return

    const bounds = deps.getBounds()
    const { mx, my } = getMiniCoords(e)
    const vr = computeViewportRect(bounds, deps.realSize, deps.viewport, deps.getCanvasSize())

    if (isInsideViewport(mx, my, vr)) {
      isDragging.value = true
      dragStartMini = { mx, my }
    } else {
      navigateTo(mx, my)
    }
  }

  /**
   * @brief 处理小地图鼠标移动事件，并在拖拽时同步主视口。
   * @param e 鼠标移动事件。
   * @return 无返回值。
   */
  function onMouseMove(e: MouseEvent) {
    // 仅在小地图自身拖拽视口框时拦截事件，其余情况放行，避免打断画布上的拖拽
    if (isIgnored() || !isDragging.value) return

    e.stopPropagation()
    const { mx, my } = getMiniCoords(e)
    dragViewport(mx - dragStartMini.mx, my - dragStartMini.my)
    dragStartMini = { mx, my }
  }

  /**
   * @brief 处理小地图鼠标释放事件并结束拖拽。
   * @param e 鼠标释放事件。
   * @return 无返回值。
   */
  function onMouseUp(e: MouseEvent) {
    if (!isDragging.value) return

    e.stopPropagation()
    isDragging.value = false
  }

  return {
    isDragging,
    onMouseDown,
    onMouseMove,
    onMouseUp,
  }
}
