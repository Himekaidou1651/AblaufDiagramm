import { readonly, ref } from 'vue'

export type ToastKind = 'success' | 'error'

export interface ToastMessage {
  id: number
  kind: ToastKind
  message: string
  hint?: string
}

const messages = ref<ToastMessage[]>([])
let nextToastId = 1

function dismiss(id: number) {
  messages.value = messages.value.filter(message => message.id !== id)
}

function push(kind: ToastKind, message: string, hint?: string): number {
  const id = nextToastId++
  messages.value = [...messages.value, { id, kind, message, hint }]
  if (kind === 'success') {
    window.setTimeout(() => dismiss(id), 2500)
  }
  return id
}

/** @brief 返回全局 Toast 消息投递接口。 */
export function useToast() {
  return {
    messages: readonly(messages),
    success: (message: string) => push('success', message),
    error: (message: string, hint?: string) => push('error', message, hint),
    dismiss,
  }
}
