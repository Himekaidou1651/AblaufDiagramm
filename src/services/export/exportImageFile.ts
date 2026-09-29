import { toPng, toSvg } from 'html-to-image'
import { WEBP_EXPORT_QUALITY, MAX_EXPORT_DIMENSION } from '@/constants/constant'
import { prepareExportCanvasElement, type PreparedExportCanvasElement } from '@/composables/ExportCanvasElement'
import { formatDateForFilename, triggerDownload } from '@/services/project/projectDownload'
import { embedCrossOriginImages } from './embedImages'
import { exportFilter, forceWhiteCanvasBackground, stripSelectionClasses } from './exportDomCleanup'

interface ExportImageDeps {
  setError(message: string): void
  getErrorMessage(error: unknown): string
  t(key: string, args?: (string | number)[]): string
}

export async function exportPngFile(deps: ExportImageDeps): Promise<void> {
  let prepared: PreparedExportCanvasElement | null = null
  try {
    prepared = await prepareExportCanvasElement()
    const element = prepared.element
    const bounds = prepared.bounds
    const restoreImages = await embedCrossOriginImages(element)
    const restoreSelection = stripSelectionClasses(element)
    const restoreBackground = forceWhiteCanvasBackground(element)

    try {
      const scale = 2
      const w = bounds.w * scale
      const h = bounds.h * scale
      if (w > MAX_EXPORT_DIMENSION || h > MAX_EXPORT_DIMENSION) {
        deps.setError(`Export size is too large (${Math.round(w)}x${Math.round(h)}px)`)
        return
      }

      const dataUrl = await toPng(element, {
        width: w,
        height: h,
        pixelRatio: scale,
        backgroundColor: '#ffffff',
        skipFonts: true,
        filter: exportFilter,
      })
      const img = await loadImage(dataUrl)
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      canvas.getContext('2d')!.drawImage(img, 0, 0)

      const blob = await canvasToBlob(canvas, 'image/png')
      if (!blob) {
        deps.setError('Failed to generate image')
        return
      }
      await triggerDownload(
        blob,
        `${deps.t('export.prefix')}${formatDateForFilename(new Date())}.png`,
        'image/png',
      )
    } finally {
      restoreBackground()
      restoreSelection()
      restoreImages()
    }
  } catch (err) {
    deps.setError(`PNG export failed: ${deps.getErrorMessage(err)}`)
  } finally {
    prepared?.cleanup()
  }
}

export async function exportSvgFile(deps: ExportImageDeps): Promise<void> {
  let prepared: PreparedExportCanvasElement | null = null
  try {
    prepared = await prepareExportCanvasElement()
    const element = prepared.element
    const bounds = prepared.bounds
    const restoreImages = await embedCrossOriginImages(element)
    const restoreSelection = stripSelectionClasses(element)
    const restoreBackground = forceWhiteCanvasBackground(element)

    try {
      if (bounds.w > MAX_EXPORT_DIMENSION || bounds.h > MAX_EXPORT_DIMENSION) {
        deps.setError(`Export size is too large (${Math.round(bounds.w)}x${Math.round(bounds.h)}px)`)
        return
      }

      const dataUrl = await toSvg(element, {
        width: bounds.w,
        height: bounds.h,
        backgroundColor: '#ffffff',
        skipFonts: true,
        filter: exportFilter,
      })
      const svgText = decodeURIComponent(
        dataUrl.replace(/^data:image\/svg\+xml(?:;charset=utf-?8)?,/, ''),
      )
      const parser = new DOMParser()
      const svgDoc = parser.parseFromString(svgText, 'image/svg+xml')
      const svgEl = svgDoc.documentElement
      svgEl.setAttribute('viewBox', `0 0 ${bounds.w} ${bounds.h}`)
      svgEl.setAttribute('width', String(bounds.w))
      svgEl.setAttribute('height', String(bounds.h))

      const croppedSvg = new XMLSerializer().serializeToString(svgDoc)
      await triggerDownload(
        new Blob([croppedSvg], { type: 'image/svg+xml' }),
        `${deps.t('export.prefix')}${formatDateForFilename(new Date())}.svg`,
        'image/svg+xml',
      )
    } finally {
      restoreBackground()
      restoreSelection()
      restoreImages()
    }
  } catch (err) {
    deps.setError(`SVG export failed: ${deps.getErrorMessage(err)}`)
  } finally {
    prepared?.cleanup()
  }
}

export async function exportWebpFile(deps: ExportImageDeps): Promise<void> {
  let prepared: PreparedExportCanvasElement | null = null
  try {
    prepared = await prepareExportCanvasElement()
    const element = prepared.element
    const bounds = prepared.bounds
    const restoreImages = await embedCrossOriginImages(element)
    const restoreSelection = stripSelectionClasses(element)
    const restoreBackground = forceWhiteCanvasBackground(element)

    try {
      const scale = 2
      const w = bounds.w * scale
      const h = bounds.h * scale
      if (w > MAX_EXPORT_DIMENSION || h > MAX_EXPORT_DIMENSION) {
        deps.setError(`Export size is too large (${Math.round(w)}x${Math.round(h)}px)`)
        return
      }

      const dataUrl = await toPng(element, {
        width: w,
        height: h,
        pixelRatio: scale,
        backgroundColor: '#ffffff',
        skipFonts: true,
        filter: exportFilter,
      })
      const img = await loadImage(dataUrl)
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      canvas.getContext('2d')!.drawImage(img, 0, 0)

      const blob = await canvasToBlob(canvas, 'image/webp', WEBP_EXPORT_QUALITY)
      if (!blob) {
        deps.setError('Failed to generate WebP')
        return
      }
      await triggerDownload(
        blob,
        `${deps.t('export.prefix')}${formatDateForFilename(new Date())}.webp`,
        'image/webp',
      )
    } finally {
      restoreBackground()
      restoreSelection()
      restoreImages()
    }
  } catch (err) {
    deps.setError(`WebP export failed: ${deps.getErrorMessage(err)}`)
  } finally {
    prepared?.cleanup()
  }
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = url
  })
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number,
): Promise<Blob | null> {
  return new Promise(resolve => canvas.toBlob(resolve, type, quality))
}
