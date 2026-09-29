'use strict'

const MAX_RESPONSE_SIZE = 5 * 1024 * 1024
const REQUEST_TIMEOUT_MS = 10_000
const ALLOWED_CONTENT_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'image/bmp',
  'image/tiff',
]

function isAllowedUrl(urlString) {
  try {
    const url = new URL(urlString)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

async function proxyImage(urlString) {
  if (!isAllowedUrl(urlString)) {
    throw new Error('Only http and https image URLs are allowed')
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(urlString, {
      headers: { 'User-Agent': 'AblaufDiagramm/1.0' },
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`Upstream error: ${response.status} ${response.statusText}`)
    }

    const contentType = (response.headers.get('content-type') || '').toLowerCase()
    const allowedType = ALLOWED_CONTENT_TYPES.find((type) => contentType.startsWith(type))
    if (!allowedType) {
      throw new Error('The upstream response is not an allowed image type')
    }

    const contentLength = response.headers.get('content-length')
    if (contentLength && Number.parseInt(contentLength, 10) > MAX_RESPONSE_SIZE) {
      throw new Error('The image response is too large')
    }

    const buffer = Buffer.from(await response.arrayBuffer())
    if (buffer.length > MAX_RESPONSE_SIZE) {
      throw new Error('The image response is too large')
    }

    return {
      contentType: allowedType,
      data: buffer.toString('base64'),
    }
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error('Image proxy request timed out')
    }
    throw error instanceof Error ? error : new Error(String(error))
  } finally {
    clearTimeout(timeoutId)
  }
}

module.exports = { proxyImage }
