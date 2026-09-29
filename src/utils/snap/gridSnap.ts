/**
 * @file gridSnap.ts - 网格交点吸附
 */

import type { Position } from '@/types'
import { getGridSize, GRID_B_SIZE, shouldShowGridB, SNAP_THRESHOLD_PX } from '@/constants/constant'
import type { SnapPair } from './types'
import { findClosestLine } from './match'

/**
 * @brief 第二类吸附：节点正中心吸附到网格交点
 */
export function snapToGrid(nodeCenter: Position, zoom: number): SnapPair {
  const threshold = SNAP_THRESHOLD_PX / zoom
  const gridSize = getGridSize(zoom)

  const candidatesX = collectGridLines(nodeCenter.x, gridSize, zoom)
  const candidatesY = collectGridLines(nodeCenter.y, gridSize, zoom)

  const snapX = findClosestLine(nodeCenter.x, candidatesX, threshold, 'grid')
  const snapY = findClosestLine(nodeCenter.y, candidatesY, threshold, 'grid')

  if (snapX) snapX.anchor = 'centerX'
  if (snapY) snapY.anchor = 'centerY'

  return { x: snapX, y: snapY, guidesX: [], guidesY: [] }
}

/**
 * @brief 收集节点中心附近的所有候选网格线位置
 */
export function collectGridLines(coord: number, smallGridSize: number, zoom: number): number[] {
  const lines: number[] = []

  const smallNearest = Math.round(coord / smallGridSize) * smallGridSize
  lines.push(smallNearest)
  for (let i = -2; i <= 2; i++) {
    const line = smallNearest + i * smallGridSize
    if (!lines.includes(line)) lines.push(line)
  }

  if (shouldShowGridB(zoom)) {
    const bigNearest = Math.round(coord / GRID_B_SIZE) * GRID_B_SIZE
    for (let i = -2; i <= 2; i++) {
      const line = bigNearest + i * GRID_B_SIZE
      if (!lines.includes(line)) lines.push(line)
    }
  }

  return lines
}
