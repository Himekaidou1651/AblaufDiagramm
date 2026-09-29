/**
 * @file CanvasMirrorPreview.ts
 * @brief 管理开发者模式下的画布镜像预览尺寸和显示状态。
 * @author 项目维护者
 * @date 2026-08-26
 */

import { nextTick, onMounted, onUnmounted, ref, watch, type Ref } from 'vue'
import { useSettingsStore } from '@/stores/settingsStore'

/**
 * @brief 提供画布镜像预览的尺寸监听和显示状态。
 * @param canvasRef 画布容器元素的模板引用。
 * @return 镜像预览尺寸和显示开关状态。
 */
export function CanvasMirrorPreview(canvasRef: Ref<HTMLElement | null>) {
  const settings = useSettingsStore()

  /** @brief 镜像预览使用的画布容器尺寸。 */
  const mirrorSize = ref({ width: 0, height: 0 })

  /** @brief 标记是否显示画布镜像预览。 */
  const showCanvasMirrorPreview = ref(false)

  /** @brief 监听画布容器尺寸变化的观察器。 */
  let mirrorResizeObserver: ResizeObserver | null = null

  /**
   * @brief 在关闭开发者模式时同步隐藏镜像预览。
   */
  watch(
    () => settings.developerMode,
    (enabled) => {
      if (!enabled) {
        showCanvasMirrorPreview.value = false
      }
    }
  )

  onMounted(() => {
    nextTick(() => {
      const el = canvasRef.value
      if (!el) return

      /**
       * @brief 根据当前画布容器刷新镜像预览尺寸。
       * @return 无返回值。
       */
      const updateMirrorSize = () => {
        mirrorSize.value = {
          width: el.clientWidth,
          height: el.clientHeight,
        }
      }
      updateMirrorSize()
      mirrorResizeObserver = new ResizeObserver(updateMirrorSize)
      mirrorResizeObserver.observe(el)
    })
  })

  /**
   * @brief 组件卸载时释放尺寸观察器。
   */
  onUnmounted(() => {
    mirrorResizeObserver?.disconnect()
    mirrorResizeObserver = null
  })

  return {
    mirrorSize,
    showCanvasMirrorPreview,
  }
}
