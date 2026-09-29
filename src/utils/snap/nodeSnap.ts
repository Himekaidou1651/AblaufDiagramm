/**
 * @file nodeSnap.ts - 节点间吸附
 */

import type { GenealogyNode } from '@/types'
import { SNAP_THRESHOLD_PX } from '@/constants/constant'
import type { SnapCandidate, SnapPair, SnapRect, SnapResult } from './types'
import { findClosestAlignment } from './match'
import { generateMidLines } from './midlineSnap'
import { getVisualNodeRect } from './rect'

/**
 * @brief 第一类吸附：拖拽节点与其它节点边缘/中心对齐
 */
export function snapToNodes(
  nodeId: string,
  nodeRect: SnapRect,
  allNodes: GenealogyNode[],
  zoom: number
): SnapPair {
  const threshold = SNAP_THRESHOLD_PX / zoom

  if (!Array.isArray(allNodes)) return { x: null, y: null, guidesX: [], guidesY: [] }

  const candidates = allNodes.filter(
    n => n.id !== nodeId && n.kind === 'person'
  )

  const xCandidates: SnapCandidate[] = []
  const yCandidates: SnapCandidate[] = []

  for (const target of candidates) {
    const tr = getVisualNodeRect(target)
    collectEdgeCandidates(target.id, tr, xCandidates, yCandidates)
  }

  const allEdgeX = findClosestAlignment(nodeRect, xCandidates, threshold)
  const allEdgeY = findClosestAlignment(nodeRect, yCandidates, threshold)

  let snapX: SnapResult | null = null
  let snapY: SnapResult | null = null
  let guidesX: SnapResult[] = allEdgeX
  let guidesY: SnapResult[] = allEdgeY

  if (allEdgeX.length > 0) {
    snapX = allEdgeX[0]
  } else {
    const allMidX = findClosestAlignment(nodeRect, generateMidLines(nodeId, nodeRect, allNodes, zoom, 'X'), threshold)
    if (allMidX.length > 0) {
      snapX = allMidX[0]
      guidesX = allMidX
    }
  }

  if (allEdgeY.length > 0) {
    snapY = allEdgeY[0]
  } else {
    const allMidY = findClosestAlignment(nodeRect, generateMidLines(nodeId, nodeRect, allNodes, zoom, 'Y'), threshold)
    if (allMidY.length > 0) {
      snapY = allMidY[0]
      guidesY = allMidY
    }
  }

  return { x: snapX, y: snapY, guidesX, guidesY }
}

function collectEdgeCandidates(
  targetNodeId: string,
  tr: SnapRect,
  xCandidates: SnapCandidate[],
  yCandidates: SnapCandidate[]
) {
  xCandidates.push({ line: tr.left, anchor: 'left', targetNodeId })
  xCandidates.push({ line: tr.right, anchor: 'right', targetNodeId })
  xCandidates.push({ line: tr.centerX, anchor: 'centerX', targetNodeId })
  xCandidates.push({ line: tr.right, anchor: 'left', targetNodeId })
  xCandidates.push({ line: tr.left, anchor: 'right', targetNodeId })

  yCandidates.push({ line: tr.top, anchor: 'top', targetNodeId })
  yCandidates.push({ line: tr.bottom, anchor: 'bottom', targetNodeId })
  yCandidates.push({ line: tr.centerY, anchor: 'centerY', targetNodeId })
  yCandidates.push({ line: tr.bottom, anchor: 'top', targetNodeId })
  yCandidates.push({ line: tr.top, anchor: 'bottom', targetNodeId })
}
