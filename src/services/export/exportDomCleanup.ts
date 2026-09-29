/**
 * @file exportDomCleanup.ts
 * @brief 提供导出前 DOM 过滤、选中态清理和白底画布临时处理能力。
 * @author 项目维护者
 * @date 2026-08-26
 */

/** @brief 截图时排除的 UI 元素选择器列表。 */
export const EXPORT_FILTER_SELECTORS = [
  '.toolbar',
  '.left-panel',
  '.right-panel',
  '.minimap-wrapper',
  '.canvas-scrollbar',
  '.space-hint',
  '.selection-rect',
  '.canvas-outside-bg',
]

/**
 * @brief 判断节点是否应参与截图导出。
 * @param node 待判断的 DOM 节点。
 * @return 需要保留时返回 true，需要排除时返回 false。
 */
export function exportFilter(node: HTMLElement): boolean {
  for (const sel of EXPORT_FILTER_SELECTORS) {
    if (node.matches?.(sel)) return false
  }
  return true
}

/**
 * @brief 临时移除选中和拖拽样式，并返回恢复函数。
 * @param element 待清理的导出根元素。
 * @return 恢复被移除样式类的函数。
 */
export function stripSelectionClasses(element: HTMLElement): () => void {
  const modified: Array<{ el: Element; classes: string[] }> = []
  const targets = element.querySelectorAll('.is-selected, .is-dragging')
  for (const el of targets) {
    const removed: string[] = []
    if (el.classList.contains('is-selected')) {
      el.classList.remove('is-selected')
      removed.push('is-selected')
    }
    if (el.classList.contains('is-dragging')) {
      el.classList.remove('is-dragging')
      removed.push('is-dragging')
    }
    if (removed.length > 0) {
      modified.push({ el, classes: removed })
    }
  }
  return () => {
    for (const { el, classes } of modified) {
      el.classList.add(...classes)
    }
  }
}

/**
 * @brief 临时将离屏导出对象整理为白底并隐藏网格。
 * @param element 待处理的导出根元素。
 * @return 恢复原背景样式的函数。
 */
export function forceWhiteCanvasBackground(element: HTMLElement): () => void {
  const origAreaBg = element.style.backgroundColor
  element.style.backgroundColor = '#ffffff'

  const rectEl = element.querySelector('.canvas-rect') as HTMLElement | null
  const origRectBg = rectEl?.style.backgroundColor ?? ''
  const origRectBgImage = rectEl?.style.backgroundImage ?? ''

  if (rectEl) {
    rectEl.style.backgroundColor = '#ffffff'
    rectEl.style.backgroundImage = 'none'
  }

  return () => {
    element.style.backgroundColor = origAreaBg
    if (rectEl) {
      rectEl.style.backgroundColor = origRectBg
      rectEl.style.backgroundImage = origRectBgImage
    }
  }
}
