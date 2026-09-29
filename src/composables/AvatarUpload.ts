/**
 * @file AvatarUpload.ts
 * @brief 处理检查器中的头像文件选择、缩放压缩和错误提示。
 * @author 项目维护者
 * @date 2026-08-26
 */

import { ref } from 'vue'

/** @brief 头像导出数据的最大边长。 */
const AVATAR_MAX_SIZE = 200

/**
 * @typedef Translate
 * @brief 国际化翻译函数类型。
 */
type Translate = (key: string, args?: (string | number)[]) => string

/**
 * @brief 从未知错误对象中提取头像处理错误消息。
 * @param error 待解析的错误对象。
 * @param t 国际化翻译函数。
 * @return 可展示的错误消息。
 */
function getErrorMessage(error: unknown, t: Translate): string {
  return error instanceof Error ? error.message : t('import.unknownError')
}

/**
 * @brief 提供头像上传、读取、缩放压缩和错误状态管理。
 * @param t 国际化翻译函数。
 * @param onAvatarReady 头像数据 URL 准备完成后的回调。
 * @return 头像错误状态、错误重置函数和文件变更处理器。
 */
export function AvatarUpload(t: Translate, onAvatarReady: (dataUri: string) => void) {
  /** @brief 当前头像上传或处理错误消息。 */
  const avatarError = ref('')

  /**
   * @brief 清空头像错误消息。
   * @return 无返回值。
   */
  function resetAvatarError() {
    avatarError.value = ''
  }

  /**
   * @brief 处理头像文件选择事件，并输出压缩后的头像数据 URL。
   * @param event 文件输入框变更事件。
   * @return 无返回值。
   */
  function onAvatarFileChange(event: Event) {
    const input = event.target as HTMLInputElement
    try {
      avatarError.value = ''
      const file = input.files?.[0]
      if (!file) {
        input.value = ''
        return
      }
      if (!file.type.startsWith('image/')) {
        avatarError.value = t('editor.avatar.invalidFile')
        input.value = ''
        return
      }

      const reader = new FileReader()
      reader.onerror = () => {
        avatarError.value = t('editor.avatar.readFailed')
      }
      reader.onabort = () => {
        avatarError.value = t('editor.avatar.readFailed')
      }
      reader.onload = () => {
        try {
          if (typeof reader.result !== 'string') {
            throw new Error('FileReader result is not a data URL')
          }

          const img = new Image()
          img.onload = () => {
            try {
              let w = img.naturalWidth
              let h = img.naturalHeight
              if (!w || !h) {
                throw new Error('Image has no readable size')
              }
              const maxDim = Math.max(w, h)
              if (maxDim > AVATAR_MAX_SIZE) {
                const ratio = AVATAR_MAX_SIZE / maxDim
                w = Math.round(w * ratio)
                h = Math.round(h * ratio)
              }
              const canvas = document.createElement('canvas')
              canvas.width = w
              canvas.height = h
              const ctx = canvas.getContext('2d')
              if (!ctx) {
                throw new Error('Canvas 2D context is unavailable')
              }
              ctx.drawImage(img, 0, 0, w, h)
              const hasAlpha = file.type === 'image/png' || file.type === 'image/webp'
              onAvatarReady(canvas.toDataURL(hasAlpha ? 'image/png' : 'image/jpeg', 0.85))
            } catch (err) {
              avatarError.value = `${t('editor.avatar.processFailed')}：${getErrorMessage(err, t)}`
            }
          }
          img.onerror = () => {
            avatarError.value = t('editor.avatar.loadFailed')
          }
          img.src = reader.result
        } catch (err) {
          avatarError.value = `${t('editor.avatar.readFailed')}：${getErrorMessage(err, t)}`
        }
      }

      reader.readAsDataURL(file)
      input.value = ''
    } catch (err) {
      avatarError.value = `${t('editor.avatar.processFailed')}：${getErrorMessage(err, t)}`
      input.value = ''
    }
  }

  return {
    avatarError,
    resetAvatarError,
    onAvatarFileChange,
  }
}
