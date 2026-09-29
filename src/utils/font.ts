/**
 * @file font.ts - 字体栈配置
 * @brief 定义全局字体栈
 * @author 自动生成
 * @date 2026-07-31
 */

/**
 * @brief 正文字体栈
 * @description 衬线风格，按文字系统逐级回退
 */
export const FONT_SERIF = [
  'Times New Roman',
  'SimSun',
  '宋体',
  'Songti SC',
  'STSong',
  'Batang',
  'AppleMyungjo',
  'UnBatang',
  'Segoe UI',
  'Noto Sans',
  'Noto Sans Cuneiform',
  'serif',
].join(', ')

/**
 * @brief 等宽字体栈
 */
export const FONT_MONO = [
  'Cascadia Code',
  'Fira Code',
  'JetBrains Mono',
  'Consolas',
  'Noto Sans Mono SC',
  'Noto Sans Mono',
  'monospace',
].join(', ')
