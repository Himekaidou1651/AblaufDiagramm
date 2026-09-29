/**
 * @file projectDownload.ts
 * @brief 提供项目文件名日期格式化和浏览器下载触发工具。
 * @author 项目维护者
 * @date 2026-08-26
 */

import { MIME_JSON } from '@/constants/constant'

/**
 * @brief 格式化日期为适合文件名的时间字符串。
 * @param date 待格式化的日期。
 * @return 文件名友好的日期时间字符串。
 */
export function formatDateForFilename(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  const ss = String(date.getSeconds()).padStart(2, '0')
  return `${y}-${m}-${d}_${hh}-${mm}-${ss}`
}

export function sanitizeFilename(filename: string): string {
  const safe = filename
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/[. ]+$/g, '')
    .trim()
  return safe || 'untitled'
}

/**
 * @brief 触发浏览器下载指定内容。
 * @param content 待下载的字符串或 Blob 内容。
 * @param filename 下载文件名。
 * @return 无返回值。
 */
export async function triggerDownload(
  content: string | Blob,
  filename: string,
  mimeType = MIME_JSON,
): Promise<void> {
  const safeFilename = sanitizeFilename(filename)
  const desktopApi = typeof window !== 'undefined' ? window.desktopAPI : undefined
  if (desktopApi?.exportFile) {
    const data = typeof content === 'string' ? content : await content.arrayBuffer()
    await desktopApi.exportFile({ filename: safeFilename, mimeType, data })
    return
  }

  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')

  try {
    a.href = url
    a.download = safeFilename
    document.body.appendChild(a)
    a.click()
  } finally {
    if (a.parentNode) {
      a.parentNode.removeChild(a)
    }
    URL.revokeObjectURL(url)
  }
}
