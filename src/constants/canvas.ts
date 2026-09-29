/**
 * @file canvas.ts
 * @brief 定义画布、网格、世界边界、缩放和吸附相关常量。
 * @author 项目维护者
 * @date 2026-08-26
 */

/** @brief 网格点间距，保留用于兼容旧调用。 */
export const GRID_SIZE = 40

/** @brief 网格线宽度，单位为屏幕像素。 */
export const GRID_LINE_WIDTH = 1

/**
 * @brief 根据当前缩放级别返回自适应网格边长。
 * @param zoom 当前视口缩放比例。
 * @return 世界坐标单位下的网格边长。
 */
export function getGridSize(zoom: number): number {
  if (zoom <= 0.50) return 100
  if (zoom <= 1.00) return 50
  if (zoom <= 2.00) return 25
  return 10
}

/** @brief 大网格的固定间距，单位为世界坐标。 */
export const GRID_B_SIZE = 100

/**
 * @brief 判断当前缩放级别是否显示大网格。
 * @param zoom 当前视口缩放比例。
 * @return 需要显示大网格时返回 true，否则返回 false。
 */
export function shouldShowGridB(zoom: number): boolean {
  return zoom > 0.10
}

/** @brief 默认画布宽度。 */
export const CANVAS_DEFAULT_WIDTH = 800
/** @brief 默认画布高度。 */
export const CANVAS_DEFAULT_HEIGHT = 600

/** @brief 画布矩形初始宽度。 */
export const CANVAS_INITIAL_WIDTH = 1000
/** @brief 画布矩形初始高度。 */
export const CANVAS_INITIAL_HEIGHT = 1000
/** @brief 画布矩形最小宽度。 */
export const CANVAS_MIN_WIDTH = 200
/** @brief 画布矩形最小高度。 */
export const CANVAS_MIN_HEIGHT = 200
/** @brief 画布矩形伸展步长。 */
export const CANVAS_EXPAND_STEP = 100
/** @brief 画布矩形包裹节点时使用的内边距。 */
export const CANVAS_FIT_PADDING = 100

/** @brief 可交互世界的总尺寸。 */
export const WORLD_SIZE = 16000
/** @brief 可交互世界的半尺寸。 */
export const WORLD_HALF = WORLD_SIZE / 2

/** @brief 允许的最小缩放比例。 */
export const MIN_ZOOM = 0.1
/** @brief 允许的最大缩放比例。 */
export const MAX_ZOOM = 10.0
/** @brief 缩放按钮和键盘缩放使用的步长。 */
export const ZOOM_STEP = 0.1
/** @brief 缩放值舍入时使用的精度倍数。 */
export const ZOOM_PRECISION = 100

/** @brief 鼠标滚轮缩放因子。 */
export const WHEEL_ZOOM_FACTOR = 0.92
/** @brief 触控板缩放因子。 */
export const TRACKPAD_ZOOM_FACTOR = 0.96

/** @brief 吸附阈值，单位为屏幕像素。 */
export const SNAP_THRESHOLD_PX = 15
