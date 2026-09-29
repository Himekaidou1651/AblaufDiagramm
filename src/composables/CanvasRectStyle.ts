/**
 * @file CanvasRectStyle.ts
 * @brief 统一计算真实画布和离屏克隆画布的矩形与网格背景样式。
 * @author 项目维护者
 * @date 2026-08-26
 */
import { computed, type Ref } from 'vue'
import { useCanvasStore } from '@/stores/canvasStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useViewportStore } from '@/stores/viewportStore'
import { getGridSize } from '@/constants/constant'

/**
 * @brief 计算稳定的正模结果。
 * @param n 被取模的数值。
 * @param m 模数。
 * @return 位于 0 到 m 之间的模结果。
 */
function posMod(n: number, m: number): number {
  return ((n % m) + m) % m
}

/**
 * @brief 计算画布定位尺寸和网格背景样式。
 * @param zoomOverride 可选的缩放比例覆盖值。
 * @return 响应式 CSS 样式对象。
 */
export function CanvasRectStyle(zoomOverride?: Ref<number>) {
  const canvas = useCanvasStore()
  const viewport = useViewportStore()
  const settings = useSettingsStore()

  return computed(() => {
    const base: Record<string, string> = {
      left: canvas.x + 'px',
      top: canvas.y + 'px',
      width: canvas.width + 'px',
      height: canvas.height + 'px',
    }

    if (!settings.showGrid) return base

    const zoom = zoomOverride?.value ?? viewport.zoom
    const worldGridSize = getGridSize(zoom)
    const gs = worldGridSize
    const lw = 1 / zoom
    const offX = posMod(gs - posMod(canvas.x, gs), gs) - lw / 2
    const offY = posMod(gs - posMod(canvas.y, gs), gs) - lw / 2

    const gbSize = 100
    const lwb = 2 / zoom
    const offXb = posMod(gbSize - posMod(canvas.x, gbSize), gbSize) - lwb / 2
    const offYb = posMod(gbSize - posMod(canvas.y, gbSize), gbSize) - lwb / 2

    const showGridB = zoom > 0.10

    const gridGradients = showGridB
      ? [
          `linear-gradient(to right, var(--grid-line) ${lw}px, transparent ${lw}px)`,
          `linear-gradient(to bottom, var(--grid-line) ${lw}px, transparent ${lw}px)`,
          `linear-gradient(to right, var(--grid-line) ${lwb}px, transparent ${lwb}px)`,
          `linear-gradient(to bottom, var(--grid-line) ${lwb}px, transparent ${lwb}px)`,
        ]
      : [
          `linear-gradient(to right, var(--grid-line) ${lw}px, transparent ${lw}px)`,
          `linear-gradient(to bottom, var(--grid-line) ${lw}px, transparent ${lw}px)`,
        ]

    return {
      ...base,
      backgroundImage: gridGradients.join(',\n      '),
      backgroundSize: showGridB
        ? `${gs}px ${gs}px, ${gs}px ${gs}px, ${gbSize}px ${gbSize}px, ${gbSize}px ${gbSize}px`
        : `${gs}px ${gs}px`,
      backgroundPosition: showGridB
        ? `${offX}px ${offY}px, ${offX}px ${offY}px, ${offXb}px ${offYb}px, ${offXb}px ${offYb}px`
        : `${offX}px ${offY}px`,
    }
  })
}
