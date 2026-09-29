/**
 * @file PanelResize.ts
 * @brief 封装左/右侧面板分隔条的拖拽调整宽度逻辑。
 * @author 项目维护者
 * @date 2026-08-26
 */

import { ref, type Ref } from 'vue'
import { useSettingsStore } from '@/stores/settingsStore'
import { PANEL_MIN_WIDTH, PANEL_MAX_WIDTH } from '@/constants/constant'

/**
 * @brief 将数值限制在指定范围内。
 * @param value 待限制的数值。
 * @param min 最小值。
 * @param max 最大值。
 * @return 限制后的数值。
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/**
 * @brief 创建面板分隔条拖拽状态和鼠标处理器。
 * @param canvasContainerRef 画布容器元素的模板引用。
 * @return 当前拖拽方向和分隔条鼠标按下事件处理器。
 */
export function PanelResize(canvasContainerRef: Ref<HTMLElement | null>) {
  const settings = useSettingsStore()

  /** @brief 当前拖拽中的分隔条方向。 */
  const splitterDragging = ref<'left' | 'right' | null>(null)

  /**
   * @brief 启动分隔条拖拽并按鼠标位置调整面板宽度。
   * @param event 鼠标按下事件。
   * @param side 拖拽方向。
   * @return 无返回值。
   */
  function onSplitterMouseDown(event: MouseEvent, side: 'left' | 'right') {
    event.preventDefault()
    splitterDragging.value = side

    const onMouseMove = (e: MouseEvent) => {
      if (!splitterDragging.value) return
      const container = canvasContainerRef.value?.parentElement
      if (!container) return
      const rect = container.getBoundingClientRect()

      if (splitterDragging.value === 'left') {
        const w = clamp(e.clientX - rect.left, PANEL_MIN_WIDTH, PANEL_MAX_WIDTH)
        settings.leftPanelWidth = w
      } else {
        const w = clamp(rect.right - e.clientX, PANEL_MIN_WIDTH, PANEL_MAX_WIDTH)
        settings.rightPanelWidth = w
      }
    }

    const onMouseUp = () => {
      splitterDragging.value = null
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  return { splitterDragging, onSplitterMouseDown }
}
