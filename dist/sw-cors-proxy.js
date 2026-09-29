/**
 * Service Worker：拦截跨域图片请求，注入 CORS 响应头，使 canvas 能正常读取。
 * 由 export 流程按需注册/注销。
 */
self.addEventListener('fetch', (event) => {
  const url = event.request.url
  // 仅处理对图片扩展名的 GET 请求
  if (!/\.(png|jpg|jpeg|gif|svg|webp|bmp|ico)(\?|#|$)/i.test(url)) return

  // 用 SW 自身发起无 CORS 的请求（SW 内 fetch 不受浏览器同源策略限制）
  event.respondWith(
    fetch(event.request, { mode: 'no-cors' })
      .then(r => r.blob())
      .then(blob => {
        // 重新构造 Response，注入 CORS 头
        return new Response(blob, {
          status: 200,
          headers: {
            'Content-Type': blob.type || 'image/png',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET',
            'Cache-Control': 'public, max-age=86400'
          }
        })
      })
      .catch(() => {
        // 回退到原始请求
        return fetch(event.request)
      })
  )
})
