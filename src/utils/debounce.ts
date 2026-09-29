/**
 * @file debounce.ts - 防抖工具函数
 * @brief 延迟执行回调，在等待期间重复调用会重置计时器。
 * @author 自动生成
 * @date 2026-07-31
 */

/**
 * 防抖工具函数：延迟执行回调，在等待期间重复调用会重置计时器。
 *
 * @param fn   要执行的函数
 * @param delay  延迟毫秒数
 * @returns 包装后的防抖函数（接受与原函数相同的参数，无返回值）
 */
export function debounce<T extends (...args: any[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null
  return (...args: Parameters<T>) => {
    if (timer !== null) {
      clearTimeout(timer)
    }
    timer = setTimeout(() => {
      timer = null
      fn(...args)
    }, delay)
  }
}
