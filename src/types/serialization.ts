/**
 * @file serialization.ts - 序列化类型定义
 * @brief 定义项目文件的导入/导出数据结构（ProjectFile），
 *        以及节点和连线的序列化格式（SerializedNode/SerializedEdge）。
 * @author 自动生成
 * @date 2026-07-31
 */

// ===== 序列化类型定义 =====

import type { EdgeType, PersonData } from './index'

/**
 * @brief 项目文件：完整的导入/导出数据结构
 */
export interface ProjectFile {
  /** 文件格式版本 */
  version: string
  /** 项目标题 */
  title?: string
  /** ISO 时间戳 */
  exportedAt: string
  /** 视口状态 */
  viewport: {
    x: number
    y: number
    zoom: number
  }
  /** 画布矩形 */
  canvas: {
    x: number
    y: number
    width: number
    height: number
  }
  /** 节点列表 */
  nodes: SerializedNode[]
  /** 连线列表 */
  edges: SerializedEdge[]
}

/**
 * @brief 序列化节点
 */
export interface SerializedNode {
  id: string
  kind: 'person'
  position: { x: number; y: number }
  size: { width: number; height: number }
  data?: PersonData
}

/**
 * @brief 序列化连线
 */
export interface SerializedEdge {
  id: string
  source: string
  target: string
  type: EdgeType
}

/**
 * @brief 将人员数据转换为稳定的 JSON 序列化结构。
 * @param data 当前人员节点数据。
 * @return 包含所有可持久化字段的人员数据。
 */
export function serializePersonData(data: PersonData): PersonData {
  return {
    name: data.name,
    nativeName: data.nativeName,
    nativeName2: data.nativeName2,
    title: data.title,
    period: data.period,
    extra: data.extra,
    avatar: data.avatar,
    color: data.color,
    badge: data.badge,
  }
}

/**
 * @brief 从外部 JSON 数据恢复人员数据，并保留头像地址。
 * @param data 未知的外部人员数据。
 * @return 可安全写入运行时节点的人员数据。
 */
export function deserializePersonData(data: unknown): PersonData {
  const raw = typeof data === 'object' && data !== null
    ? data as Record<string, unknown>
    : {}

  return {
    name: typeof raw.name === 'string' ? raw.name : '',
    nativeName: typeof raw.nativeName === 'string' ? raw.nativeName : undefined,
    nativeName2: typeof raw.nativeName2 === 'string' ? raw.nativeName2 : undefined,
    title: typeof raw.title === 'string' ? raw.title : '',
    period: typeof raw.period === 'string' ? raw.period : '',
    extra: typeof raw.extra === 'string' ? raw.extra : undefined,
    avatar: typeof raw.avatar === 'string' ? raw.avatar : undefined,
    color: typeof raw.color === 'string' ? raw.color : undefined,
    badge: typeof raw.badge === 'string' ? raw.badge : undefined,
  }
}

