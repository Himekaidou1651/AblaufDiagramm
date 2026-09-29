/**
 * @file node.ts
 * @brief 定义人员节点尺寸、排版、颜色、手柄、头像和快捷创建相关常量。
 * @author 项目维护者
 * @date 2026-08-26
 */

/** @brief 默认节点宽度，单位为世界像素。 */
export const DEFAULT_NODE_WIDTH = 180
/** @brief 默认节点高度，单位为世界像素。 */
export const DEFAULT_NODE_HEIGHT = 100

/** @brief 节点水平内边距，与 .node-body padding 保持一致。 */
export const NODE_PADDING_X = 14
/** @brief 节点垂直内边距，与 .node-body padding 保持一致。 */
export const NODE_PADDING_Y = 10

/** @brief 头像宽度。 */
export const AVATAR_WIDTH = 90
/** @brief 头像右侧到文字起始位置的间隙。 */
export const AVATAR_GAP = 6
/** @brief 有头像时节点视觉区域的额外高度。 */
export const AVATAR_EXTRA_HEIGHT = 20

/** @brief 文字行间间距。 */
export const LINE_GAP = 2

/** @brief 默认文字行高系数。 */
export const LINE_HEIGHT_RATIO = 1.3
/** @brief 附加信息行的行高系数。 */
export const EXTRA_LINE_HEIGHT_RATIO = 1.2
/** @brief 基线距 em-box 顶部的比例。 */
export const BASELINE_RATIO = 0.8

/** @brief 姓名字体大小。 */
export const TEXT_SIZE_NAME = 14
/** @brief 本名字体大小。 */
export const TEXT_SIZE_NATIVE_NAME = 13
/** @brief 头衔字体大小。 */
export const TEXT_SIZE_TITLE = 11
/** @brief 时间字体大小。 */
export const TEXT_SIZE_PERIOD = 10
/** @brief 附加信息字体大小。 */
export const TEXT_SIZE_EXTRA = 9

/** @brief 姓名字重。 */
export const TEXT_WEIGHT_NAME = 700
/** @brief 本名字重。 */
export const TEXT_WEIGHT_NATIVE_NAME = 400
/** @brief 头衔字重。 */
export const TEXT_WEIGHT_TITLE = 500
/** @brief 时间字重。 */
export const TEXT_WEIGHT_PERIOD = 400
/** @brief 附加信息字重。 */
export const TEXT_WEIGHT_EXTRA = 400

/** @brief 姓名字段建议最大字符数。 */
export const MAX_CHARS_NAME = 12
/** @brief 本名字段建议最大字符数。 */
export const MAX_CHARS_NATIVE_NAME = 14
/** @brief 头衔字段建议最大字符数。 */
export const MAX_CHARS_TITLE = 18
/** @brief 时间字段建议最大字符数。 */
export const MAX_CHARS_PERIOD = 16
/** @brief 附加信息字段建议最大字符数。 */
export const MAX_CHARS_EXTRA = 12

/** @brief 默认节点底色。 */
export const DEFAULT_NODE_COLOR = '#cba6f7'
/** @brief 文字亮度阈值，低于此值时使用深色文字。 */
export const LUMINANCE_THRESHOLD = 0.55

/** @brief 相对亮度公式中的红色通道系数。 */
export const LUM_R_COEFF = 0.299
/** @brief 相对亮度公式中的绿色通道系数。 */
export const LUM_G_COEFF = 0.587
/** @brief 相对亮度公式中的蓝色通道系数。 */
export const LUM_B_COEFF = 0.114

/** @brief 添加块时节点距画布左上角的间距。 */
export const NODE_SPAWN_MARGIN = 200

/** @brief 复制节点时使用的基础偏移。 */
export const DUPLICATE_OFFSET_BASE = 40
/** @brief 多选复制时每个额外节点的偏移增量。 */
export const DUPLICATE_OFFSET_STEP = 20

/** @brief 头像选择区域的 X 方向偏移。 */
export const AVATAR_SEL_OFFSET_X = -(AVATAR_WIDTH / 2)
/** @brief 头像选择区域的 Y 方向偏移。 */
export const AVATAR_SEL_OFFSET_Y = -(AVATAR_EXTRA_HEIGHT / 2)
/** @brief 头像选择区域的额外宽度。 */
export const AVATAR_SEL_EXTRA_W = AVATAR_WIDTH
/** @brief 头像选择区域的额外高度。 */
export const AVATAR_SEL_EXTRA_H = AVATAR_EXTRA_HEIGHT

/** @brief 手柄距节点边缘的偏移。 */
export const HANDLE_OFFSET = 9
/** @brief 手柄圆点大小。 */
export const HANDLE_DOT_SIZE = 16
/** @brief 手柄加号图标大小。 */
export const HANDLE_PLUS_SIZE = 8

/** @brief 节点编号圆标大小。 */
export const NODE_BADGE_SIZE = 24
/** @brief 节点编号圆标字体大小。 */
export const NODE_BADGE_FONT_SIZE = 12

/** @brief 子节点默认 X 偏移，使子节点居中于父节点。 */
export const CHILD_NODE_X_OFFSET = 90
/** @brief 子节点默认 Y 偏移，表示父节点下方间距。 */
export const CHILD_NODE_Y_OFFSET = 120
/** @brief 快速创建子节点时使用的默认高度。 */
export const CHILD_NODE_DEFAULT_HEIGHT = DEFAULT_NODE_HEIGHT

/** @brief 配偶节点与源节点之间的默认水平间距。 */
export const SPOUSE_NODE_GAP = 80
/** @brief 配偶节点贴近画布边界时保留的安全留白。 */
export const SPOUSE_NODE_CANVAS_PADDING = 40
