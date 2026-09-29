/**
 * @file types.ts - 吸附算法类型
 */

/** 吸附参考点类型 */
export type SnapAnchor = 'left' | 'right' | 'top' | 'bottom' | 'centerX' | 'centerY'
  | 'midX' | 'midY' | 'spacingX' | 'spacingY'

/** 一条吸附结果 */
export interface SnapResult {
  /** 吸附后的坐标值（世界坐标系，锚点坐标） */
  value: number
  /** 吸附到哪条参考线（世界坐标） */
  guideLine: number
  /** 吸附类型 */
  anchor: SnapAnchor
  /** 吸附来源：grid（网格）或 node（节点间） */
  source: 'grid' | 'node'
  /** 对齐的目标节点 ID（source=node 时有效） */
  targetNodeId?: string
  /** 中点对齐时的第二个目标节点 ID */
  targetNodeId2?: string
  /** 菱形标记 X 坐标（世界坐标，中点对齐时有效） */
  markerX?: number
  /** 菱形标记 Y 坐标（世界坐标，中点对齐时有效） */
  markerY?: number
}

/** 一次吸附的完整结果（X + Y 方向） */
export interface SnapPair {
  x: SnapResult | null
  y: SnapResult | null
  /** 所有 X 方向辅助线（含 x，用于渲染多条同时触发等距对齐的辅助线） */
  guidesX: SnapResult[]
  /** 所有 Y 方向辅助线（含 y，用于渲染多条同时触发等距对齐的辅助线） */
  guidesY: SnapResult[]
}

export interface SnapRect {
  left: number
  right: number
  top: number
  bottom: number
  centerX: number
  centerY: number
}

export interface SnapCandidate {
  line: number
  anchor: SnapAnchor
  targetNodeId: string
  targetNodeId2?: string
  markerX?: number
  markerY?: number
}
