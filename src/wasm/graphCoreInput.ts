/**
 * @file graphCoreInput.ts
 * @brief 将前端族谱节点和边转换为 C++ 图核心可消费的输入结构。
 * @author 项目维护者
 * @date 2026-08-26
 */

import type { GenealogyEdge, GenealogyNode } from '@/types'
import { getNodeVisualSize, hasNodeAvatar } from '@/utils/coords'

/**
 * @typedef GraphCoreEdgeType
 * @brief 表示 C++ 图核心使用的边类型数值。
 */
export type GraphCoreEdgeType = 0 | 1

/**
 * @interface GraphCoreNodeInput
 * @brief 表示传给 C++ 图核心的节点输入结构。
 */
export interface GraphCoreNodeInput {
  /** @brief 节点在输入数组中的索引。 */
  node_index: number
  /** @brief 节点视觉宽度。 */
  width: number
  /** @brief 节点视觉高度。 */
  height: number
  /** @brief 标记节点是否带头像。 */
  hasAvatar: boolean
}

/**
 * @interface GraphCoreEdgeInput
 * @brief 表示传给 C++ 图核心的边输入结构。
 */
export interface GraphCoreEdgeInput {
  /** @brief 边在输入数组中的索引。 */
  edge_index: number
  /** @brief 源节点索引。 */
  source: number
  /** @brief 目标节点索引。 */
  target: number
  /** @brief C++ 图核心使用的边类型。 */
  type: GraphCoreEdgeType
}

/**
 * @interface GraphCoreInput
 * @brief 表示传给 C++ 图核心的完整输入结构。
 */
export interface GraphCoreInput {
  /** @brief 图核心节点输入列表。 */
  nodes: GraphCoreNodeInput[]
  /** @brief 图核心边输入列表。 */
  edges: GraphCoreEdgeInput[]
}

/**
 * @interface GraphCoreIdMaps
 * @brief 保存前端字符串 ID 与图核心数组索引之间的双向映射。
 */
export interface GraphCoreIdMaps {
  /** @brief 节点 ID 到节点索引的映射。 */
  nodeIdToIndex: Map<string, number>
  /** @brief 节点索引到节点 ID 的映射。 */
  indexToNodeId: string[]
  /** @brief 边 ID 到边索引的映射。 */
  edgeIdToIndex: Map<string, number>
  /** @brief 边索引到边 ID 的映射。 */
  indexToEdgeId: string[]
}

/**
 * @interface GraphCoreSnapshot
 * @brief 表示一次图核心输入构建后的输入数据、ID 映射和诊断信息。
 */
export interface GraphCoreSnapshot {
  /** @brief 图核心输入数据。 */
  input: GraphCoreInput
  /** @brief 前端 ID 与图核心索引之间的映射。 */
  maps: GraphCoreIdMaps
  /** @brief 构建输入过程中产生的诊断信息。 */
  diagnostics: string[]
}

/**
 * @brief 将前端边类型转换为 C++ 图核心边类型数值。
 * @param type 前端族谱边类型。
 * @return C++ 图核心使用的边类型数值。
 */
export function toGraphCoreEdgeType(type: GenealogyEdge['type']): GraphCoreEdgeType {
  return type === 'spouse' ? 1 : 0
}

/**
 * @brief 构建 C++ 图核心输入快照。
 * @param nodes 前端族谱节点列表。
 * @param edges 前端族谱边列表。
 * @return 图核心输入快照。
 */
export function buildGraphCoreSnapshot(
  nodes: readonly GenealogyNode[],
  edges: readonly GenealogyEdge[]
): GraphCoreSnapshot {
  const nodeIdToIndex = new Map<string, number>()
  const indexToNodeId: string[] = []
  const edgeIdToIndex = new Map<string, number>()
  const indexToEdgeId: string[] = []
  const diagnostics: string[] = []

  const inputNodes = nodes.map((node, nodeIndex) => {
    nodeIdToIndex.set(node.id, nodeIndex)
    indexToNodeId.push(node.id)
    const hasAvatar = hasNodeAvatar(node)
    const visualSize = getNodeVisualSize(node)

    return {
      node_index: nodeIndex,
      width: visualSize.width,
      height: visualSize.height,
      hasAvatar,
    }
  })

  const inputEdges: GraphCoreEdgeInput[] = []

  for (const edge of edges) {
    const source = nodeIdToIndex.get(edge.source)
    const target = nodeIdToIndex.get(edge.target)

    if (source === undefined || target === undefined) {
      diagnostics.push(`edge ${edge.id} references a missing node`)
      continue
    }

    const edgeIndex = inputEdges.length
    edgeIdToIndex.set(edge.id, edgeIndex)
    indexToEdgeId.push(edge.id)

    inputEdges.push({
      edge_index: edgeIndex,
      source,
      target,
      type: toGraphCoreEdgeType(edge.type),
    })
  }

  return {
    input: {
      nodes: inputNodes,
      edges: inputEdges,
    },
    maps: {
      nodeIdToIndex,
      indexToNodeId,
      edgeIdToIndex,
      indexToEdgeId,
    },
    diagnostics,
  }
}

/**
 * @brief 构建 C++ 图核心输入 JSON 字符串。
 * @param nodes 前端族谱节点列表。
 * @param edges 前端族谱边列表。
 * @return 图核心输入 JSON 字符串。
 */
export function buildGraphCoreInputJson(
  nodes: readonly GenealogyNode[],
  edges: readonly GenealogyEdge[]
): string {
  return JSON.stringify(buildGraphCoreSnapshot(nodes, edges).input)
}
