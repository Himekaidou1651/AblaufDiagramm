/**
 * @file index.ts
 * @brief 定义族谱编辑器的基础几何类型、领域模型类型和类型守卫。
 * @author 项目维护者
 * @date 2026-08-26
 */

/**
 * @interface AbsolutePosition
 * @brief 表示坐标纸中的绝对位置。
 */
export interface AbsolutePosition {
  /** @brief X 坐标。 */
  x: number
  /** @brief Y 坐标。 */
  y: number
}

/** @deprecated 请使用 AbsolutePosition。 */
export type Position = AbsolutePosition

/**
 * @interface Size
 * @brief 表示二维尺寸。
 */
export interface Size {
  /** @brief 宽度。 */
  width: number
  /** @brief 高度。 */
  height: number
}

/**
 * @typedef NodeKind
 * @brief 表示族谱节点类型。
 */
export type NodeKind = 'person'

/**
 * @typedef EdgeType
 * @brief 表示族谱关系边类型。
 */
export type EdgeType = 'parent' | 'spouse'

/**
 * @interface PersonData
 * @brief 表示人员节点可编辑的业务数据。
 */
export interface PersonData {
  /** @brief 姓名。 */
  name: string
  /** @brief 本名或原名。 */
  nativeName?: string
  /** @brief 第二本名或补充原名。 */
  nativeName2?: string
  /** @brief 头衔或身份说明。 */
  title: string
  /** @brief 生卒、任期或相关时间段。 */
  period: string
  /** @brief 附加说明。 */
  extra?: string
  /** @brief 头像图片地址或数据 URL。 */
  avatar?: string
  /** @brief 节点主题颜色。 */
  color?: string
  /** @brief 节点编号或徽标文本。 */
  badge?: string
}

/**
 * @interface PersonNode
 * @brief 表示族谱中的人员节点。
 */
export interface PersonNode {
  /** @brief 节点唯一 ID。 */
  id: string
  /** @brief 节点类型。 */
  kind: 'person'
  /** @brief 节点位置。 */
  position: Position
  /** @brief 节点存储尺寸。 */
  size: Size
  /** @brief 人员业务数据。 */
  data: PersonData
}

/**
 * @typedef GenealogyNode
 * @brief 表示族谱图中的节点联合类型。
 */
export type GenealogyNode = PersonNode

/**
 * @interface GenealogyEdge
 * @brief 表示族谱图中的关系边。
 */
export interface GenealogyEdge {
  /** @brief 边唯一 ID。 */
  id: string
  /** @brief 源节点 ID。 */
  source: string
  /** @brief 目标节点 ID。 */
  target: string
  /** @brief 关系边类型。 */
  type: EdgeType
}

/**
 * @interface Viewport
 * @brief 表示画布视口偏移和缩放状态。
 */
export interface Viewport {
  /** @brief 视口 X 方向偏移。 */
  x: number
  /** @brief 视口 Y 方向偏移。 */
  y: number
  /** @brief 视口缩放比例。 */
  zoom: number
}

/** @deprecated 请使用 PersonNode。 */
export type GraphNode = PersonNode

/** @deprecated 请使用 GenealogyEdge。 */
export type GraphEdge = GenealogyEdge

/**
 * @brief 判断图谱节点是否为人员节点。
 * @param node 待判断的图谱节点。
 * @return 为人员节点时返回 true，否则返回 false。
 */
export function isPersonNode(node: GenealogyNode): node is PersonNode {
  return node.kind === 'person'
}
