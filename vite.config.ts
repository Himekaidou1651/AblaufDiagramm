/**
 * @file vite.config.ts - Vite 构建配置
 * @brief Vite 开发服务器和构建配置。包含 Vue 插件、路径别名 @ → src/、
 *        以及图片代理中间件（绕过外部图片 CORS 限制）。
 * @author 自动生成
 * @date 2026-07-31
 */
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

/**
 * @brief 图片代理中间件：绕过外部图片的 CORS 限制，在服务端抓取后返回
 * @description 提供 /api/proxy-image?url=... 端点。包含域名白名单/黑名单校验、
 *              响应大小限制（5MB）、超时控制（10s）、Content-Type 白名单。\n * @returns Vite 插件对象
 */
function imageProxyMiddleware(): any {
  // 安全限制
  /** 最大响应大小：5MB */
  const MAX_RESPONSE_SIZE = 5 * 1024 * 1024
  /** 请求超时：10s */
  const REQUEST_TIMEOUT_MS = 10_000
  /** 允许代理的 Content-Type */
  const ALLOWED_CONTENT_TYPES = [
    'image/png', 'image/jpeg', 'image/webp', 'image/gif',
    'image/svg+xml', 'image/bmp', 'image/tiff'
  ]
  /** 域名白名单（为空则允许所有） */
  const ALLOWED_DOMAINS: string[] = []
  /** 域名黑名单 */
  const BLOCKED_DOMAINS: string[] = []

  /**
   * @brief 校验目标 URL 的域名是否在白名单中且不在黑名单中
   * @param urlStr - 目标 URL
   * @returns 是否允许代理
   */
  function isAllowedDomain(urlStr: string): boolean {
    try {
      const hostname = new URL(urlStr).hostname.toLowerCase()
      if (BLOCKED_DOMAINS.some(d => hostname === d || hostname.endsWith('.' + d))) {
        return false
      }
      if (ALLOWED_DOMAINS.length > 0) {
        return ALLOWED_DOMAINS.some(d => hostname === d || hostname.endsWith('.' + d))
      }
      return true
    } catch {
      return false
    }
  }

  return {
    name: 'image-proxy',
    configureServer(server: any) {
      server.middlewares.use('/api/proxy-image', async (req: any, res: any) => {
        const reqUrl = new URL(req.url!, `http://${req.headers.host}`)
        const targetUrl = reqUrl.searchParams.get('url')
        if (!targetUrl) {
          res.statusCode = 400
          res.end('Missing "url" parameter')
          return
        }
        // 仅允许 http/https
        if (!/^https?:\/\//i.test(targetUrl)) {
          res.statusCode = 400
          res.end('Invalid URL scheme')
          return
        }
        // 域名白名单/黑名单校验
        if (!isAllowedDomain(targetUrl)) {
          res.statusCode = 403
          res.end('Domain not allowed')
          return
        }
        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

          const fetchResp = await fetch(targetUrl, {
            headers: { 'User-Agent': 'AblaufDiagramm/1.0' },
            signal: controller.signal
          })
          clearTimeout(timeoutId)

          if (!fetchResp.ok) {
            res.statusCode = fetchResp.status
            res.end(`Upstream error: ${fetchResp.statusText}`)
            return
          }

          // 校验 Content-Type 仅允许图片类型
          const ct = fetchResp.headers.get('content-type') || ''
          if (!ALLOWED_CONTENT_TYPES.some(allowed => ct.toLowerCase().startsWith(allowed))) {
            res.statusCode = 415
            res.end('Unsupported media type')
            return
          }

          // 校验响应大小
          const contentLength = fetchResp.headers.get('content-length')
          if (contentLength && parseInt(contentLength) > MAX_RESPONSE_SIZE) {
            res.statusCode = 413
            res.end('Response too large')
            return
          }

          const buffer = Buffer.from(await fetchResp.arrayBuffer())
          if (buffer.length > MAX_RESPONSE_SIZE) {
            res.statusCode = 413
            res.end('Response too large')
            return
          }

          res.setHeader('Content-Type', ct)
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.setHeader('Cache-Control', 'public, max-age=86400')
          res.end(buffer)
        } catch (e: any) {
          if (e.name === 'AbortError') {
            res.statusCode = 504
            res.end('Proxy request timeout')
          } else {
            res.statusCode = 502
            res.end(`Proxy fetch failed: ${e.message}`)
          }
        }
      })
    }
  }
}

export default defineConfig({
  base: './',
  plugins: [vue(), imageProxyMiddleware()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
