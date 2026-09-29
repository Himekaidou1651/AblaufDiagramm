/**
 * @file ExportCanvasElement.ts
 * @brief 在克隆画布体系中创建供 html-to-image 截取的离屏画布对象。
 * @author 项目维护者
 * @date 2026-08-26
 */
import { createApp, h, nextTick } from 'vue'
import type { App } from 'vue'
import CanvasMirrorContent from '@/components/canvas/CanvasMirrorContent.vue'
import { useCanvasStore } from '@/stores/canvasStore'
import { pinia } from '@/stores/pinia'

/**
 * @interface ExportCanvasBounds
 * @brief 表示导出画布在世界坐标中的边界和尺寸。
 */
export interface ExportCanvasBounds {
  /** @brief 画布左上角 X 坐标。 */
  x: number
  /** @brief 画布左上角 Y 坐标。 */
  y: number
  /** @brief 画布宽度。 */
  w: number
  /** @brief 画布高度。 */
  h: number
}

/**
 * @interface PreparedExportCanvasElement
 * @brief 表示已准备好的离屏导出元素及其清理函数。
 */
export interface PreparedExportCanvasElement {
  /** @brief 可传入导出服务的根元素。 */
  element: HTMLElement
  /** @brief 导出时使用的画布边界。 */
  bounds: ExportCanvasBounds
  /** @brief 卸载离屏应用并移除宿主元素的清理函数。 */
  cleanup: () => void
}

/**
 * @brief 创建离屏导出宿主元素。
 * @param bounds 导出画布边界。
 * @return 已挂载到 body 的离屏宿主元素。
 */
function createOffscreenExportHost(bounds: ExportCanvasBounds): HTMLElement {
  const host = document.createElement('div')
  host.style.position = 'fixed'
  host.style.left = '-100000px'
  host.style.top = '0'
  host.style.width = `${bounds.w}px`
  host.style.height = `${bounds.h}px`
  host.style.overflow = 'hidden'
  host.style.pointerEvents = 'none'
  host.style.zIndex = '-1'
  document.body.appendChild(host)
  return host
}

/**
 * @brief 准备用于图片导出的离屏画布元素。
 * @return 已挂载的导出元素、边界和清理函数。
 */
export async function prepareExportCanvasElement(): Promise<PreparedExportCanvasElement> {
  const canvas = useCanvasStore()
  const bounds: ExportCanvasBounds = {
    x: canvas.x,
    y: canvas.y,
    w: canvas.width,
    h: canvas.height,
  }

  const host = createOffscreenExportHost(bounds)
  let app: App<Element> | null = null

  const cleanup = () => {
    app?.unmount()
    app = null
    host.remove()
  }

  try {
    app = createApp({
      render: () => h(CanvasMirrorContent, {
        width: bounds.w,
        height: bounds.h,
        spaceHeld: false,
        snapX: null,
        snapY: null,
        snapGuidesX: [],
        snapGuidesY: [],
        mode: 'canvas',
      }),
    })
    app.use(pinia)
    app.mount(host)
    await nextTick()

    const element = host.firstElementChild
    if (!(element instanceof HTMLElement)) {
      throw new Error('Export canvas element was not mounted')
    }

    return {
      element,
      bounds,
      cleanup,
    }
  } catch (error) {
    cleanup()
    throw error
  }
}
