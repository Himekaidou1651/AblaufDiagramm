/**
 * @file midlineSnap.ts - 中点和等距吸附候选
 */

import type { GenealogyNode } from '@/types'
import { SNAP_THRESHOLD_PX } from '@/constants/constant'
import type { SnapAnchor, SnapCandidate, SnapRect } from './types'
import { getVisualNodeRect } from './rect'

interface RawMidLine extends SnapCandidate {
  targetNodeId2: string
  markerX: number
  markerY: number
  dist: number
}

/**
 * @brief 生成中点/中垂线/间距均分候选对齐线
 */
export function generateMidLines(
  excludeNodeId: string,
  nodeRect: SnapRect,
  allNodes: GenealogyNode[],
  zoom: number,
  direction: 'X' | 'Y'
): SnapCandidate[] {
  const threshold = SNAP_THRESHOLD_PX / zoom
  const raw: RawMidLine[] = []
  const personNodes = allNodes.filter(n => n.kind === 'person' && n.id !== excludeNodeId)

  for (let i = 0; i < personNodes.length; i++) {
    for (let j = i + 1; j < personNodes.length; j++) {
      const a = getVisualNodeRect(personNodes[i])
      const b = getVisualNodeRect(personNodes[j])

      if (direction === 'X') {
        collectHorizontalMidLines(raw, nodeRect, personNodes[i].id, personNodes[j].id, a, b, threshold)
      } else {
        collectVerticalMidLines(raw, nodeRect, personNodes[i].id, personNodes[j].id, a, b, threshold)
      }
    }
  }

  raw.sort((a, b) => a.dist - b.dist)
  const deduped: RawMidLine[] = []
  for (const item of raw) {
    const isDuplicate = deduped.some(
      d => Math.abs(d.line - item.line) < 1 && d.anchor === item.anchor
    )
    if (!isDuplicate) deduped.push(item)
  }

  return deduped.map(({ line, anchor, targetNodeId, targetNodeId2, markerX, markerY }) => ({
    line, anchor, targetNodeId, targetNodeId2, markerX, markerY,
  }))
}

function collectHorizontalMidLines(
  raw: RawMidLine[],
  nodeRect: SnapRect,
  firstId: string,
  secondId: string,
  a: SnapRect,
  b: SnapRect,
  threshold: number
) {
  const midX = (a.centerX + b.centerX) / 2
  const distMid = Math.abs(nodeRect.centerX - midX)
  const markerY = (a.centerY + b.centerY) / 2
  if (distMid < threshold) {
    raw.push(makeRawMidLine(midX, 'midX', firstId, secondId, midX, markerY, distMid))
  }

  if (a.right < b.left) {
    const spacingX = (a.right + b.left) / 2
    const distSp = Math.abs(nodeRect.centerX - spacingX)
    if (distSp < threshold) {
      raw.push(makeRawMidLine(spacingX, 'spacingX', firstId, secondId, spacingX, markerY, distSp))
    }
  } else if (b.right < a.left) {
    const spacingX = (b.right + a.left) / 2
    const distSp = Math.abs(nodeRect.centerX - spacingX)
    if (distSp < threshold) {
      raw.push(makeRawMidLine(spacingX, 'spacingX', secondId, firstId, spacingX, markerY, distSp))
    }
  }
}

function collectVerticalMidLines(
  raw: RawMidLine[],
  nodeRect: SnapRect,
  firstId: string,
  secondId: string,
  a: SnapRect,
  b: SnapRect,
  threshold: number
) {
  const midY = (a.centerY + b.centerY) / 2
  const distMid = Math.abs(nodeRect.centerY - midY)
  const markerX = (a.centerX + b.centerX) / 2
  if (distMid < threshold) {
    raw.push(makeRawMidLine(midY, 'midY', firstId, secondId, markerX, midY, distMid))
  }

  if (a.bottom < b.top) {
    const spacingY = (a.bottom + b.top) / 2
    const distSp = Math.abs(nodeRect.centerY - spacingY)
    if (distSp < threshold) {
      raw.push(makeRawMidLine(spacingY, 'spacingY', firstId, secondId, markerX, spacingY, distSp))
    }
  } else if (b.bottom < a.top) {
    const spacingY = (b.bottom + a.top) / 2
    const distSp = Math.abs(nodeRect.centerY - spacingY)
    if (distSp < threshold) {
      raw.push(makeRawMidLine(spacingY, 'spacingY', secondId, firstId, markerX, spacingY, distSp))
    }
  }
}

function makeRawMidLine(
  line: number,
  anchor: SnapAnchor,
  targetNodeId: string,
  targetNodeId2: string,
  markerX: number,
  markerY: number,
  dist: number
): RawMidLine {
  return { line, anchor, targetNodeId, targetNodeId2, markerX, markerY, dist }
}
