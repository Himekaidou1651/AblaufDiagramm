/**
 * @file edgePath.ts
 * @brief 根据节点视觉边界和边类型生成族谱关系边的 SVG 折线路径。
 * @author 项目维护者
 * @date 2026-08-26
 */

import type { EdgeType } from '@/types'
import type { VisualBounds } from './coords'

/**
 * @interface EdgePathPeer
 * @brief 表示参与同源或同目标路径避让计算的父子边。
 */
export interface EdgePathPeer {
  /** @brief 边 ID。 */
  id: string
  /** @brief 源节点 ID。 */
  source: string
  /** @brief 目标节点 ID。 */
  target: string
}

/**
 * @interface EdgePathOptions
 * @brief 表示生成边路径时可选的上下文信息。
 */
export interface EdgePathOptions {
  /** @brief 当前边 ID。 */
  edgeId?: string
  /** @brief 当前边源节点 ID。 */
  sourceId?: string
  /** @brief 当前边目标节点 ID。 */
  targetId?: string
  /** @brief 当前图中所有父子边的简化列表。 */
  parentEdges?: EdgePathPeer[]
}

/**
 * @interface Point
 * @brief 表示 SVG 路径使用的二维坐标点。
 */
interface Point {
  /** @brief X 坐标。 */
  x: number
  /** @brief Y 坐标。 */
  y: number
}

/**
 * @brief 将坐标点格式化为 SVG path 坐标片段。
 * @param point 待格式化的坐标点。
 * @return 保留一位小数的坐标片段。
 */
function fmt(point: Point): string {
  return `${point.x.toFixed(1)} ${point.y.toFixed(1)}`
}

/**
 * @brief 将折线点列表转换为 SVG path 字符串。
 * @param points 折线路径点列表。
 * @return SVG path 字符串。
 */
function path(points: Point[]): string {
  if (points.length === 0) return ''
  return [`M ${fmt(points[0])}`, ...points.slice(1).map(p => `L ${fmt(p)}`)].join(' ')
}

/**
 * @brief 获取视觉边界的中心 X 坐标。
 * @param bounds 节点视觉边界。
 * @return 中心 X 坐标。
 */
function centerX(bounds: VisualBounds): number {
  return bounds.left + bounds.width / 2
}

/**
 * @brief 获取视觉边界的中心 Y 坐标。
 * @param bounds 节点视觉边界。
 * @return 中心 Y 坐标。
 */
function centerY(bounds: VisualBounds): number {
  return bounds.top + bounds.height / 2
}

/**
 * @brief 根据边类型生成父子或配偶关系边路径。
 * @param srcVisual 源节点视觉边界。
 * @param tgtVisual 目标节点视觉边界。
 * @param edgeType 关系边类型。
 * @param opts 路径生成上下文选项。
 * @return SVG path 字符串。
 */
export function getEdgePath(
  srcVisual: VisualBounds,
  tgtVisual: VisualBounds,
  edgeType: EdgeType = 'parent',
  opts: EdgePathOptions = {}
): string {
  if (edgeType === 'spouse') {
    return getSpouseEdgePath(srcVisual, tgtVisual)
  }

  return getParentEdgePath(srcVisual, tgtVisual, opts)
}

/**
 * @brief 生成父子关系边的折线路径。
 * @param srcVisual 源节点视觉边界。
 * @param tgtVisual 目标节点视觉边界。
 * @param opts 路径生成上下文选项。
 * @return SVG path 字符串。
 */
function getParentEdgePath(
  srcVisual: VisualBounds,
  tgtVisual: VisualBounds,
  opts: EdgePathOptions
): string {
  const sx = centerX(srcVisual)
  const sy = srcVisual.top + srcVisual.height
  const tx = centerX(tgtVisual)
  const ty = tgtVisual.top

  const parentEdges = opts.parentEdges ?? []
  const sameSource = parentEdges
    .filter(edge => edge.source === opts.sourceId)
    .sort((a, b) => a.target.localeCompare(b.target))
  const sameTarget = parentEdges
    .filter(edge => edge.target === opts.targetId)
    .sort((a, b) => a.source.localeCompare(b.source))

  const hasSharedSource = sameSource.length > 1
  const hasSharedTarget = sameTarget.length > 1
  const verticalGap = Math.max(24, Math.abs(ty - sy) * 0.22)
  const sourceTrunkY = Math.min(sy + verticalGap, ty - 18)
  const targetJoinY = Math.max(ty - verticalGap, sy + 18)

  if (hasSharedSource && hasSharedTarget && sourceTrunkY < targetJoinY) {
    return path([
      { x: sx, y: sy },
      { x: sx, y: sourceTrunkY },
      { x: tx, y: sourceTrunkY },
      { x: tx, y: targetJoinY },
      { x: tx, y: ty },
    ])
  }

  if (hasSharedSource) {
    return path([
      { x: sx, y: sy },
      { x: sx, y: sourceTrunkY },
      { x: tx, y: sourceTrunkY },
      { x: tx, y: ty },
    ])
  }

  if (hasSharedTarget) {
    return path([
      { x: sx, y: sy },
      { x: sx, y: targetJoinY },
      { x: tx, y: targetJoinY },
      { x: tx, y: ty },
    ])
  }

  const midY = (sy + ty) / 2
  return path([
    { x: sx, y: sy },
    { x: sx, y: midY },
    { x: tx, y: midY },
    { x: tx, y: ty },
  ])
}

/**
 * @brief 生成配偶关系边的折线路径。
 * @param srcVisual 源节点视觉边界。
 * @param tgtVisual 目标节点视觉边界。
 * @return SVG path 字符串。
 */
function getSpouseEdgePath(srcVisual: VisualBounds, tgtVisual: VisualBounds): string {
  const srcCX = centerX(srcVisual)
  const tgtCX = centerX(tgtVisual)
  const srcCY = centerY(srcVisual)
  const tgtCY = centerY(tgtVisual)
  const midY = (srcCY + tgtCY) / 2

  if (tgtCX < srcCX) {
    const start = { x: tgtVisual.left + tgtVisual.width, y: tgtCY }
    const end = { x: srcVisual.left, y: srcCY }
    return path([
      start,
      { x: start.x, y: midY },
      { x: end.x, y: midY },
      end,
    ])
  }

  const start = { x: srcVisual.left + srcVisual.width, y: srcCY }
  const end = { x: tgtVisual.left, y: tgtCY }
  return path([
    start,
    { x: start.x, y: midY },
    { x: end.x, y: midY },
    end,
  ])
}
