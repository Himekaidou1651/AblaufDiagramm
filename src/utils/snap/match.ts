/**
 * @file match.ts - 吸附候选匹配工具
 */

import type { SnapAnchor, SnapCandidate, SnapRect, SnapResult } from './types'

/**
 * @brief 根据锚点类型获取矩形对应坐标值
 * @description 中点/间距对齐的锚点（midX/spacingX/midY/spacingY）映射到 centerX/centerY。
 */
export function getRectValue(rect: SnapRect, anchor: SnapAnchor): number {
  switch (anchor) {
    case 'midX':
    case 'spacingX':
      return rect.centerX
    case 'midY':
    case 'spacingY':
      return rect.centerY
    default:
      return rect[anchor]
  }
}

/**
 * @brief 在候选对齐线中找到距离最近的一条或多条（等距时全部返回）
 */
export function findClosestAlignment(
  nodeRect: SnapRect,
  candidates: SnapCandidate[],
  threshold: number
): SnapResult[] {
  let bestDist = Infinity
  const best: SnapResult[] = []

  for (const c of candidates) {
    const anchorValue = getRectValue(nodeRect, c.anchor)
    const dist = Math.abs(anchorValue - c.line)

    if (dist < threshold) {
      if (dist < bestDist - 0.001) {
        bestDist = dist
        best.length = 0
        best.push({
          value: c.line,
          guideLine: c.line,
          anchor: c.anchor,
          source: 'node',
          targetNodeId: c.targetNodeId,
          targetNodeId2: c.targetNodeId2,
          markerX: c.markerX,
          markerY: c.markerY,
        })
      } else if (Math.abs(dist - bestDist) < 0.001) {
        if (!best.some(b => b.guideLine === c.line && b.anchor === c.anchor)) {
          best.push({
            value: c.line,
            guideLine: c.line,
            anchor: c.anchor,
            source: 'node',
            targetNodeId: c.targetNodeId,
            targetNodeId2: c.targetNodeId2,
            markerX: c.markerX,
            markerY: c.markerY,
          })
        }
      }
    }
  }

  return best
}

/**
 * @brief 在候选线列表中找到距离 coord 最近且在阈值内的线
 */
export function findClosestLine(
  coord: number,
  lines: number[],
  threshold: number,
  source: 'grid' | 'node'
): SnapResult | null {
  let bestDist = Infinity
  let bestLine: number | null = null

  for (const line of lines) {
    const dist = Math.abs(coord - line)
    if (dist < threshold && dist < bestDist) {
      bestDist = dist
      bestLine = line
    }
  }

  if (bestLine === null) return null

  return {
    value: bestLine,
    guideLine: bestLine,
    anchor: 'centerX',
    source,
  }
}
