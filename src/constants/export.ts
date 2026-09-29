/**
 * @file export.ts
 * @brief 定义项目导入、图片导出和跨域图片处理相关常量。
 * @author 项目维护者
 * @date 2026-08-26
 */

/** @brief 导出包围盒内边距。 */
export const EXPORT_PADDING = 60
/** @brief Canvas 最大边长。 */
export const CANVAS_MAX_DIM = 8192

/** @brief 最大导入文件大小。 */
export const MAX_IMPORT_FILE_SIZE = 10 * 1024 * 1024

/** @brief 导入取消检测延迟。 */
export const IMPORT_CANCEL_DETECT_MS = 300

/** @brief WebP 导出质量。 */
export const WEBP_EXPORT_QUALITY = 0.85 as const

/** @brief JSON 文件的 MIME 类型。 */
export const MIME_JSON = 'application/json' as const

/** @brief 项目文件读写使用的文本编码。 */
export const FILE_ENCODING_UTF8 = 'utf-8'

/** @brief 图片跨域代理请求超时。 */
export const IMAGE_PROXY_TIMEOUT_MS = 8000
/** @brief 图片 CORS 直连加载超时。 */
export const IMAGE_CORS_TIMEOUT_MS = 5000
/** @brief 图片代理回退超时。 */
export const IMAGE_PROXY_FALLBACK_TIMEOUT_MS = 10000

/** @brief 导出图片和 SVG 的最大边长。 */
export const MAX_EXPORT_DIMENSION = 8000
