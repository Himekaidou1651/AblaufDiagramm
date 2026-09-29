/**
 * @file KeyboardShortcuts.ts
 * @brief 封装编辑器的全局键盘快捷键逻辑（撤销/重做/删除/复制/全选/Escape）。
 * @author 项目维护者
 * @date 2026-08-26
 */

import { useHistoryStore } from '@/stores/historyStore'
import { useSelectionStore } from '@/stores/selectionStore'
import { useConnectionStore } from '@/stores/connectionStore'
import { useViewportStore } from '@/stores/viewportStore'
import { openModalCount } from '@/composables/ModalFocus'

/**
 * @brief 创建编辑器键盘快捷键处理器。
 * @param onDuplicate 可选的复制选中节点回调。
 * @return 画布级键盘事件处理器和全局键盘事件处理器。
 */
export function KeyboardShortcuts(onDuplicate?: () => void) {
  const history = useHistoryStore()
  const selection = useSelectionStore()
  const connection = useConnectionStore()
  const viewport = useViewportStore()

  /**
   * @brief 处理画布级键盘快捷键。
   * @param event 键盘事件。
   * @return 无返回值。
   */
  function onKeyDown(event: KeyboardEvent) {
    if (openModalCount.value > 0) return

    // Ctrl+Z：撤销
    if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
      event.preventDefault()
      history.undo()
      return
    }

    // Ctrl+Y 或 Ctrl+Shift+Z：重做
    if ((event.ctrlKey || event.metaKey) && (event.key === 'y' || (event.key === 'z' && event.shiftKey))) {
      event.preventDefault()
      history.redo()
      return
    }

    // Delete / Backspace：删除选中节点
    if (event.key === 'Delete' || event.key === 'Backspace') {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return
      }
      event.preventDefault()
      selection.deleteSelected()
      return
    }

    // Ctrl+D：复制选中节点
    if ((event.ctrlKey || event.metaKey) && event.key === 'd') {
      event.preventDefault()
      onDuplicate?.()
      return
    }

    // Ctrl+A：全选
    if ((event.ctrlKey || event.metaKey) && event.key === 'a') {
      event.preventDefault()
      selection.selectAll()
      return
    }

    // Escape：取消选中 或 取消连线
    if (event.key === 'Escape') {
      if (connection.connecting) {
        connection.cancelConnection()
      } else {
        selection.clearSelection()
      }
    }
  }

  /**
   * @brief 处理全局键盘快捷键，包括缩放和删除选中项。
   * @param event 键盘事件。
   * @return 无返回值。
   */
  function onGlobalKeyDown(event: KeyboardEvent) {
    if (openModalCount.value > 0) return

    // Ctrl+= 或 Ctrl++：放大
    if ((event.ctrlKey || event.metaKey) && (event.key === '=' || event.key === '+')) {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return
      }
      event.preventDefault()
      viewport.zoomIn()
      return
    }

    // Ctrl+-：缩小
    if ((event.ctrlKey || event.metaKey) && event.key === '-') {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return
      }
      event.preventDefault()
      viewport.zoomOut()
      return
    }

    // Ctrl+0：重置缩放
    if ((event.ctrlKey || event.metaKey) && event.key === '0') {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return
      }
      event.preventDefault()
      viewport.reset()
      return
    }

    // Delete / Backspace：删除选中节点
    if (event.key === 'Delete' || event.key === 'Backspace') {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return
      }
      if (selection.hasSelection) {
        event.preventDefault()
        selection.deleteSelected()
      }
    }
  }

  return { onKeyDown, onGlobalKeyDown }
}
