/**
 * @file embedImages.ts
 * @brief 在导出前等待图片加载，并将可处理的跨域图片嵌入为 data URI。
 * @author 项目维护者
 * @date 2026-08-26
 */

import {
  IMAGE_CORS_TIMEOUT_MS,
  IMAGE_PROXY_FALLBACK_TIMEOUT_MS,
  IMAGE_PROXY_TIMEOUT_MS,
} from '@/constants/constant'

/** @brief 跨域图片无法嵌入时使用的透明占位符。 */
const TRANSPARENT_PIXEL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='

/**
 * @brief 通过代理加载跨域图片并转为 data URI。
 * @param url 待加载的图片 URL。
 * @return 图片内容的 data URI。
 */
export async function loadImageViaProxy(url: string): Promise<string> {
  const desktopApi = window.desktopAPI
  if (desktopApi) {
    const result = await desktopApi.proxyImage(url)
    return `data:${result.contentType};base64,${result.data}`
  }

  const proxies = [
    `/api/proxy-image?url=${encodeURIComponent(url)}`,
    `https://corsproxy.io/?${encodeURIComponent(url)}`,
  ]
  for (const proxyUrl of proxies) {
    try {
      const ctrl = new AbortController()
      const t = setTimeout(() => ctrl.abort(), IMAGE_PROXY_TIMEOUT_MS)
      const resp = await fetch(proxyUrl, { signal: ctrl.signal })
      clearTimeout(t)
      if (!resp.ok) continue
      const blob = await resp.blob()
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = () => reject(new Error('Blob read failed'))
        reader.readAsDataURL(blob)
      })
    } catch {
      /* 尝试下一个代理。 */
    }
  }
  throw new Error('All proxies failed')
}

/**
 * @brief 等待元素内图片加载完成，并将跨域图片转为 data URI。
 * @param element 待处理的导出根元素。
 * @return 恢复原始图片地址和背景图片样式的函数。
 */
export async function embedCrossOriginImages(element: HTMLElement): Promise<() => void> {
  const imgs = Array.from(element.querySelectorAll('img'))
  const originals = new Map<HTMLImageElement, string>()
  const bgOriginals = new Map<HTMLElement, string>()

  await Promise.all(
    imgs.map(async (img) => {
      const src = img.src
      if (!src || src.startsWith('data:') || src.startsWith('blob:')) return

      originals.set(img, src)

      if (!img.complete) {
        await new Promise<void>((resolve) => {
          img.onload = () => resolve()
          img.onerror = () => resolve()
        })
      }

      try {
        img.src = await loadImageWithCors(src)
      } catch {
        try {
          img.src = await Promise.race([
            loadImageViaProxy(src),
            new Promise<string>((_, reject) => setTimeout(() => reject(new Error('timeout')), IMAGE_PROXY_FALLBACK_TIMEOUT_MS)),
          ])
        } catch {
          img.src = TRANSPARENT_PIXEL
        }
      }
    })
  )

  const allElements = Array.from(element.querySelectorAll('*')) as HTMLElement[]
  allElements.unshift(element)
  const bgUrlRegex = /url\(["']?([^"')]+)["']?\)/g

  await Promise.all(
    allElements.map(async (el) => {
      const style = getComputedStyle(el)
      const bgImage = style.backgroundImage
      if (!bgImage || bgImage === 'none') return

      const urls: string[] = []
      let m: RegExpExecArray | null
      while ((m = bgUrlRegex.exec(bgImage)) !== null) {
        urls.push(m[1])
      }
      if (urls.length === 0) return

      const hasExternal = urls.some(u => u.startsWith('http://') || u.startsWith('https://'))
      if (!hasExternal) return

      const originalInline = el.style.backgroundImage
      bgOriginals.set(el, originalInline)

      let newBgImage = bgImage
      for (const url of urls) {
        try {
          const dataUri = await loadImageWithCors(url)
          newBgImage = newBgImage.replace(url, dataUri)
        } catch {
          // 单个 URL 失败不影响整体导出流程。
        }
      }

      el.style.backgroundImage = newBgImage
    })
  )

  return () => {
    for (const [img, src] of originals) {
      img.src = src
    }
    for (const [el, originalInline] of bgOriginals) {
      el.style.backgroundImage = originalInline
    }
  }
}

/**
 * @brief 使用 CORS 加载图片并绘制到临时 Canvas 后转为 data URI。
 * @param url 待加载的图片 URL。
 * @return 图片内容的 data URI。
 */
function loadImageWithCors(url: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const tmp = new Image()
    tmp.crossOrigin = 'anonymous'
    const t = setTimeout(() => reject(new Error('timeout')), IMAGE_CORS_TIMEOUT_MS)
    tmp.onload = () => {
      clearTimeout(t)
      try {
        const c = document.createElement('canvas')
        c.width = tmp.naturalWidth
        c.height = tmp.naturalHeight
        c.getContext('2d')!.drawImage(tmp, 0, 0)
        resolve(c.toDataURL('image/png'))
      } catch {
        reject(new Error('tainted'))
      }
    }
    tmp.onerror = () => {
      clearTimeout(t)
      reject(new Error('load failed'))
    }
    tmp.src = url
  })
}
