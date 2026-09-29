/**
 * @file CanvasPan.ts
 * @brief 提供鼠标中键拖拽和 Space+左键拖拽两种平移方式。
 * @author 项目维护者
 * @date 2026-08-26
 */
import { onMounted, onUnmounted, ref, type Ref } from 'vue'
import { useViewportStore } from '@/stores/viewportStore'

/**
 * @brief 管理画布平移交互和 Space 键状态。
 * @param containerRef 画布容器元素的模板引用。
 * @return Space 键按住状态。
 */
export function CanvasPan(containerRef: Ref<HTMLElement | null>) {
  const viewport = useViewportStore()

  /** @brief 是否正在平移中。 */
  let isPanning = false

  /** @brief 上次鼠标 X 位置。 */
  let lastX = 0

  /** @brief 上次鼠标 Y 位置。 */
  let lastY = 0

  /** @brief Space 键是否被按住。 */
  const spaceHeld = ref(false)

  /**
   * @brief 处理 Space 键按下并进入平移准备状态。
   * @param event 键盘按下事件。
   * @return 无返回值。
   */
  function onKeyDown(event: KeyboardEvent) {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
      return
    }
    if (event.code === 'Space') {
      event.preventDefault()
      spaceHeld.value = true
    }
  }

  /**
   * @brief 处理 Space 键释放并结束可能存在的平移状态。
   * @param event 键盘释放事件。
   * @return 无返回值。
   */
  function onKeyUp(event: KeyboardEvent) {
    if (event.code === 'Space') {
      spaceHeld.value = false
      if (isPanning) {
        isPanning = false
      }
    }
  }

  /**
   * @brief 处理鼠标按下并根据中键或 Space 加左键启动平移。
   * @param event 鼠标按下事件。
   * @return 无返回值。
   */
  function onMouseDown(event: MouseEvent) {
    if (event.button === 1) {
      event.preventDefault()
      startPan(event)
      return
    }

    if (event.button === 0 && spaceHeld.value) {
      event.preventDefault()
      startPan(event)
    }
  }

  /**
   * @brief 记录平移起始鼠标位置。
   * @param event 鼠标按下事件。
   * @return 无返回值。
   */
  function startPan(event: MouseEvent) {
    isPanning = true
    lastX = event.clientX
    lastY = event.clientY
  }

  /**
   * @brief 平移过程中按鼠标位移更新视口偏移。
   * @param event 鼠标移动事件。
   * @return 无返回值。
   */
  function onMouseMove(event: MouseEvent) {
    if (!isPanning) return
    const dx = event.clientX - lastX
    const dy = event.clientY - lastY
    lastX = event.clientX
    lastY = event.clientY
    viewport.pan(dx, dy)
    // 更新容器尺寸，确保视口偏移钳制使用最新尺寸。
    const el = containerRef.value
    if (el) {
      viewport.setContainerSize(el.clientWidth, el.clientHeight)
    }
  }

  /**
   * @brief 处理鼠标释放并结束平移。
   * @param _event 鼠标释放事件。
   * @return 无返回值。
   */
  function onMouseUp(_event: MouseEvent) {
    isPanning = false
  }

  /**
   * @brief 阻止鼠标中键默认自动滚动行为。
   * @param event 鼠标辅助点击事件。
   * @return 无返回值。
   */
  function preventMiddleClickScroll(event: MouseEvent) {
    if (event.button === 1) {
      event.preventDefault()
    }
  }

  /**
   * @brief 挂载画布和全局事件监听。
   * @return 无返回值。
   */
  function attach() {
    const el = containerRef.value
    if (!el) return
    el.addEventListener('mousedown', onMouseDown)
    el.addEventListener('auxclick', preventMiddleClickScroll)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  /**
   * @brief 卸载画布和全局事件监听。
   * @return 无返回值。
   */
  function detach() {
    const el = containerRef.value
    if (!el) return
    el.removeEventListener('mousedown', onMouseDown)
    el.removeEventListener('auxclick', preventMiddleClickScroll)
    window.removeEventListener('keydown', onKeyDown)
    window.removeEventListener('keyup', onKeyUp)
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
  }

  onMounted(attach)
  onUnmounted(detach)

  return { spaceHeld }
}
