/**
 * @file renderConfig.ts - 统一渲染配置
 * @brief Vue 渲染和导出 SVG/PNG 双方引用的唯一视觉配置源。
 *        修改节点样式、字体、颜色……只需改这一处，不会出现"画布正常、导出错误"。
 *        底层常量从 @/constants/constant 导入。
 * @author 自动生成
 * @date 2026-07-31
 */
import {
  DEFAULT_NODE_WIDTH,
  DEFAULT_NODE_HEIGHT,
  NODE_PADDING_X,
  NODE_PADDING_Y,
  AVATAR_WIDTH,
  AVATAR_GAP,
  AVATAR_EXTRA_HEIGHT,
  LINE_GAP,
  LINE_HEIGHT_RATIO,
  EXTRA_LINE_HEIGHT_RATIO,
  BASELINE_RATIO,
  TEXT_SIZE_NAME,
  TEXT_SIZE_NATIVE_NAME,
  TEXT_SIZE_TITLE,
  TEXT_SIZE_PERIOD,
  TEXT_SIZE_EXTRA,
  TEXT_WEIGHT_NAME,
  TEXT_WEIGHT_NATIVE_NAME,
  TEXT_WEIGHT_TITLE,
  TEXT_WEIGHT_PERIOD,
  TEXT_WEIGHT_EXTRA,
  MAX_CHARS_NAME,
  MAX_CHARS_NATIVE_NAME,
  MAX_CHARS_TITLE,
  MAX_CHARS_PERIOD,
  MAX_CHARS_EXTRA,
  DEFAULT_NODE_COLOR,
  LUMINANCE_THRESHOLD,
  GRID_SIZE,
  EXPORT_PADDING,
  CANVAS_MAX_DIM,
} from '@/constants/constant'

export const NodeStyle = {
  /** 默认节点尺寸（与 graphStore.addPersonNode 默认值一致） */
  width: DEFAULT_NODE_WIDTH,
  height: DEFAULT_NODE_HEIGHT,

  /** 节点内边距（与 PersonNode.vue .node-body 一致：padding: 10px 14px） */
  paddingX: NODE_PADDING_X,
  paddingY: NODE_PADDING_Y,

  /** 头像宽度（与 PersonNode.vue .node-avatar 一致） */
  avatarWidth: AVATAR_WIDTH,
  /** 头像右侧到文字起始的间隙（Vue: paddingLeft 96 = avatarWidth 90 + gap 6） */
  avatarGap: AVATAR_GAP,
  /** 有头像时节点额外扩高（与 PersonNode.vue nodeStyle dh 一致） */
  avatarExtraHeight: AVATAR_EXTRA_HEIGHT,
  /** 文字行间间距（与 PersonNode.vue .node-body gap: 2px 一致） */
  lineGap: LINE_GAP,

  /** 各文本行规格（与 PersonNode.vue CSS 一致） */
  text: {
    name:       { size: TEXT_SIZE_NAME,       weight: TEXT_WEIGHT_NAME },
    nativeName: { size: TEXT_SIZE_NATIVE_NAME, weight: TEXT_WEIGHT_NATIVE_NAME },
    title:      { size: TEXT_SIZE_TITLE,      weight: TEXT_WEIGHT_TITLE },
    period:     { size: TEXT_SIZE_PERIOD,     weight: TEXT_WEIGHT_PERIOD },
    extra:      { size: TEXT_SIZE_EXTRA,      weight: TEXT_WEIGHT_EXTRA },
  },

  /** 默认行高系数（与 PersonNode.vue line-height: 1.3 一致） */
  lineHeightRatio: LINE_HEIGHT_RATIO,
  /** extra 行行高系数（与 PersonNode.vue .node-extra line-height: 1.2 一致） */
  extraLineHeightRatio: EXTRA_LINE_HEIGHT_RATIO,
  /** 基线比率：基线距 em-box 顶部的比例（≈0.8，匹配 CSS 默认基线位置） */
  baselineRatio: BASELINE_RATIO,

  /** 各字段建议最大字符数（用于 SVG 截断，CSS 用 text-overflow: ellipsis） */
  maxChars: {
    name:       MAX_CHARS_NAME,
    nativeName: MAX_CHARS_NATIVE_NAME,
    title:      MAX_CHARS_TITLE,
    period:     MAX_CHARS_PERIOD,
    extra:      MAX_CHARS_EXTRA,
  },

  /** 默认节点底色 */
  defaultColor: DEFAULT_NODE_COLOR,

  /** 文字亮度阈值：低于此值用深色文字，高于此值用浅色文字 */
  luminanceThreshold: LUMINANCE_THRESHOLD,
} as const

/** 导出 SVG 使用的字体栈（匹配系统字体 + Noto Sans 覆盖 Unicode 16.0）—— 注意不能含双引号，否则会破坏 SVG XML 属性 */
export const ExportFontFamily =
  `Times New Roman, SimSun, Songti SC, STSong, Noto Sans, Noto Sans Cuneiform, serif`

// 以下常量从 @/constants/constant 重导出，保持向后兼容
export { GRID_SIZE, EXPORT_PADDING, CANVAS_MAX_DIM }
