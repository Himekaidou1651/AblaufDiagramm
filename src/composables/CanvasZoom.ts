/**
 * @file CanvasZoom.ts
 * @brief 提供以光标位置为中心的鼠标滚轮和触控板缩放交互。
 * @author 项目维护者
 * @date 2026-08-26
 */
import { onMounted, onUnmounted, type Ref } from 'vue'
import { useViewportStore } from '@/stores/viewportStore'

/**
 * @interface ZoomOptions
 * @brief 表示画布缩放交互的配置项。
 */
export interface ZoomOptions {
  /** @brief 鼠标滚轮缩放因子。 */
  wheelFactor?: number

  /** @brief 触控板缩放因子。 */
  trackpadFactor?: number
}

/**
 * @brief 管理画布容器上的滚轮缩放监听。
 * @param containerRef 画布容器元素的模板引用。
 * @param opts 缩放配置。
 * @return 空对象，保持 composable 调用形态一致。
 */
export function CanvasZoom(
  containerRef: Ref<HTMLElement | null>,
  opts: ZoomOptions = {}
) {
  const viewport = useViewportStore()
  const wheelFactor = opts.wheelFactor ?? 0.92
  const trackpadFactor = opts.trackpadFactor ?? 0.96

  /**
   * @brief 处理滚轮事件，并以鼠标光标在画布容器中的位置为缩放中心。
   * @param event 滚轮事件。
   * @return 无返回值。
   */
  function onWheel(event: WheelEvent) {
    event.preventDefault()

    const el = containerRef.value
    if (!el) return

    // 更新容器尺寸，以便视口状态内部自动钳制偏移。
    viewport.setContainerSize(el.clientWidth, el.clientHeight)

    // 计算鼠标在画布容器内的屏幕坐标
    const rect = el.getBoundingClientRect()
    const screenX = event.clientX - rect.left
    const screenY = event.clientY - rect.top

    // 区分触控板（deltaMode === 1）和鼠标滚轮（deltaMode === 0）
    const isTrackpad = event.deltaMode === 1
    const baseFactor = isTrackpad ? trackpadFactor : wheelFactor

    // deltaY > 0 向下滚 → 缩小；< 0 向上滚 → 放大
    const factor = event.deltaY > 0 ? baseFactor : 1 / baseFactor

    viewport.zoomAt(screenX, screenY, factor)
  }

  /**
   * @brief 挂载滚轮监听。
   * @return 无返回值。
   */
  function attach() {
    const el = containerRef.value
    if (!el) return
    el.addEventListener('wheel', onWheel, { passive: false })
  }

  /**
   * @brief 卸载滚轮监听。
   * @return 无返回值。
   */
  function detach() {
    const el = containerRef.value
    if (!el) return
    el.removeEventListener('wheel', onWheel)
  }

  onMounted(attach)
  onUnmounted(detach)

  return {}
}
