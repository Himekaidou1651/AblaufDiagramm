/**
 * @file RafDraw.ts
 * @brief 使用 requestAnimationFrame 合并绘制请求并在卸载时取消待执行绘制。
 * @author 项目维护者
 * @date 2026-08-26
 */

import { onUnmounted } from 'vue'

/**
 * @brief 创建基于 requestAnimationFrame 的绘制调度器。
 * @param draw 实际执行绘制的回调函数。
 * @return 绘制调度函数和取消函数。
 */
export function RafDraw(draw: () => void) {
  /** @brief 当前待执行的 requestAnimationFrame 标识。 */
  let rafId = 0

  /**
   * @brief 安排下一帧绘制，并合并同一帧内的重复请求。
   * @return 无返回值。
   */
  function scheduleDraw() {
    if (rafId) return
    rafId = requestAnimationFrame(() => {
      rafId = 0
      draw()
    })
  }

  /**
   * @brief 取消尚未执行的绘制请求。
   * @return 无返回值。
   */
  function cancelDraw() {
    if (rafId) {
      cancelAnimationFrame(rafId)
      rafId = 0
    }
  }

  onUnmounted(cancelDraw)

  return { scheduleDraw, cancelDraw }
}
