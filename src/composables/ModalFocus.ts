import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import type { Ref } from 'vue'

export interface ModalFocusOptions {
  containerRef: Ref<HTMLElement | null>
  active: Ref<boolean>
  initialFocusRef?: Ref<HTMLElement | null>
  onRequestClose: () => void
  closeOnEscape?: boolean
  closeOnOverlay?: boolean
}

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

/** 当前打开的弹窗数量，供编辑器全局快捷键守卫使用。 */
export const openModalCount = ref(0)
const modalStack: symbol[] = []

/**
 * @brief 为弹窗提供初始聚焦、焦点循环、关闭和焦点还原。
 */
export function ModalFocus(options: ModalFocusOptions): {
  onOverlayClick: (event: MouseEvent) => void
} {
  const modalId = Symbol('modal')
  let restoreTarget: HTMLElement | null = null
  let countedAsOpen = false

  function focusInitialElement() {
    const target = options.initialFocusRef?.value
      ?? options.containerRef.value?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)
      ?? options.containerRef.value
    target?.focus()
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
      target.select()
    }
  }

  function focusableElements(): HTMLElement[] {
    return Array.from(
      options.containerRef.value?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? [],
    ).filter(element => !element.hasAttribute('disabled') && element.getClientRects().length > 0)
  }

  function onKeyDown(event: KeyboardEvent) {
    if (!options.active.value || modalStack.at(-1) !== modalId) return

    if (event.key === 'Escape') {
      event.stopPropagation()
      if (options.closeOnEscape !== false) {
        event.preventDefault()
        options.onRequestClose()
      }
      return
    }

    if (event.key !== 'Tab') return
    const elements = focusableElements()
    if (elements.length === 0) {
      event.preventDefault()
      options.containerRef.value?.focus()
      return
    }

    const first = elements[0]
    const last = elements[elements.length - 1]
    const activeElement = document.activeElement
    if (event.shiftKey && (activeElement === first || !options.containerRef.value?.contains(activeElement))) {
      event.preventDefault()
      last?.focus()
    } else if (!event.shiftKey && activeElement === last) {
      event.preventDefault()
      first?.focus()
    }
  }

  function open() {
    restoreTarget = document.activeElement instanceof HTMLElement ? document.activeElement : null
    if (!countedAsOpen) {
      openModalCount.value += 1
      modalStack.push(modalId)
      countedAsOpen = true
    }
    document.addEventListener('keydown', onKeyDown, true)
    void nextTick(focusInitialElement)
  }

  function close() {
    document.removeEventListener('keydown', onKeyDown, true)
    if (countedAsOpen) {
      openModalCount.value = Math.max(0, openModalCount.value - 1)
      const stackIndex = modalStack.lastIndexOf(modalId)
      if (stackIndex >= 0) modalStack.splice(stackIndex, 1)
      countedAsOpen = false
    }
    const target = restoreTarget
    restoreTarget = null
    void nextTick(() => {
      if (target?.isConnected) target.focus()
    })
  }

  watch(options.active, active => {
    if (active) open()
    else close()
  }, { immediate: true })

  onBeforeUnmount(close)

  function onOverlayClick(event: MouseEvent) {
    if (options.closeOnOverlay === false || event.target !== event.currentTarget) return
    options.onRequestClose()
  }

  return { onOverlayClick }
}
