/**
 * @file interaction.ts
 * @brief 定义交互延迟、历史记录、连线偏移、框选和测试节点相关常量。
 * @author 项目维护者
 * @date 2026-08-26
 */

/** @brief 历史记录合并窗口，同一节点在此时间内的连续编辑合并为一条。 */
export const HISTORY_MERGE_WINDOW_MS = 500
/** @brief 通用防抖延迟。 */
export const DEBOUNCE_MS = 300
/** @brief 节点手柄隐藏延迟。 */
export const HANDLE_HIDE_DELAY_MS = 150
/** @brief 继续上次会话时的加载延迟。 */
export const LOADING_DELAY_MS = 100

/** @brief 最大撤销和重做步数。 */
export const MAX_HISTORY = 50

/** @brief 配偶连线相对节点中心的 Y 方向偏移。 */
export const SPOUSE_EDGE_Y_OFFSET = 8

/** @brief 触发框选所需的最小拖拽距离，单位为像素。 */
export const SELECTION_DRAG_THRESHOLD = 3

/** @brief 测试节点生成时的 X 方向间距。 */
export const TEST_NODE_COL_SPACING = 220
/** @brief 测试节点生成时的 Y 方向间距。 */
export const TEST_NODE_ROW_SPACING = 120
/** @brief 测试节点生成时每行的列数。 */
export const TEST_NODE_COLS = 3
