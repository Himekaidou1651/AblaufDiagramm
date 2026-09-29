/**
 * @file textLayout.ts - 文字排版工具
 * @brief 提供 SVG 文字排版所需的多行布局计算（calculateTextLayout）
 *        和文字截断功能（truncateText），用于导出时在 SVG 中模拟 CSS 排版。
 * @author 自动生成
 * @date 2026-07-31
 */
import { NodeStyle } from '@/config/renderConfig'

/** 文字行定义 */
export interface TextRow {
  text: string
  size: number
  weight: number | string
  /** 可选：本行专用的行高系数，不指定则用 NodeStyle.lineHeightRatio */
  lineHeightRatio?: number
}

/** 排版后的文字行（含 Y 坐标） */
export interface LayoutRow extends TextRow {
  /** 本行底部 Y 坐标（相对于文字区域顶部） */
  y: number
}

/**
 * @brief 根据行高系数 + 行间距计算各行 Y 坐标
 * @description 每行高度 = fontSize × lineHeightRatio；行间距 = NodeStyle.lineGap。
 * @param rows - 文字行列表
 * @returns 含 Y 坐标的排版行列表
 */
export function calculateTextLayout(rows: TextRow[]): LayoutRow[] {
  let cursor = 0
  return rows.map((row, i) => {
    const lh = row.lineHeightRatio ?? NodeStyle.lineHeightRatio
    const h = row.size * lh
    cursor += h
    if (i < rows.length - 1) cursor += NodeStyle.lineGap
    return { ...row, y: cursor }
  })
}

/**
 * @brief 文字截断
 * @description SVG `<text>` 不支持 CSS `text-overflow: ellipsis`，
 *              需在生成 SVG 前手动裁剪。超长时末尾追加 …（U+2026）。
 * @param text - 原始文本
 * @param maxLen - 最大字符数
 * @returns 截断后的文本
 */
export function truncateText(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text
  return text.slice(0, maxLen - 1) + '\u2026'
}
