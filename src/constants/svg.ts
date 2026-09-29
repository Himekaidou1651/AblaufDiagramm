/**
 * @file svg.ts
 * @brief 定义 SVG 连线、临时连线和默认视口相关渲染常量。
 * @author 项目维护者
 * @date 2026-08-26
 */

/** @brief SVG 关系边描边宽度。 */
export const SVG_EDGE_STROKE_WIDTH = 10
/** @brief SVG 边线不可见点击区域宽度。 */
export const SVG_EDGE_HIT_AREA_WIDTH = 20
/** @brief SVG 临时线目标圆半径。 */
export const SVG_TEMP_DOT_RADIUS = 4
/** @brief SVG 临时线宽度。 */
export const SVG_TEMP_EDGE_WIDTH = 2
/** @brief SVG 临时线虚线样式。 */
export const SVG_TEMP_DASH_PATTERN = '6 3'
/** @brief SVG 临时线最小区段长度。 */
export const SVG_TEMP_MIN_SEGMENT = 40
/** @brief 无节点时使用的 SVG 默认 ViewBox。 */
export const SVG_VIEWBOX_DEFAULT = { x: -2000, y: -2000, w: 4000, h: 4000 } as const
/** @brief SVG ViewBox 内边距。 */
export const SVG_VIEWBOX_PAD = 400
