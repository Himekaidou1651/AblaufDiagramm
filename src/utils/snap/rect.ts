/**
 * @file rect.ts - 吸附算法矩形工具
 */

import type { GenealogyNode, Position } from '@/types'
import { getNodeVisualBounds } from '@/utils/coords'
import type { SnapRect } from './types'

/**
 * @brief 计算节点矩形（用于对齐吸附）
 */
export function getNodeRect(position: Position, size: { width: number; height: number }): SnapRect {
  const left = position.x
  const right = position.x + size.width
  const top = position.y
  const bottom = position.y + size.height
  const centerX = position.x + size.width / 2
  const centerY = position.y + size.height / 2
  return { left, right, top, bottom, centerX, centerY }
}

/** 计算节点的视觉矩形（包含头像扩张），position 为存储的左上角，渲染时居中 */
export function getVisualNodeRect(node: GenealogyNode): SnapRect {
  const bounds = getNodeVisualBounds(node)
  return {
    left: bounds.left,
    right: bounds.left + bounds.width,
    top: bounds.top,
    bottom: bounds.top + bounds.height,
    centerX: node.position.x,
    centerY: node.position.y,
  }
}
