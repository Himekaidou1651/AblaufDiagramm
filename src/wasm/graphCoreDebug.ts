/**
 * @file graphCoreDebug.ts
 * @brief 将 C++ 图核心输入结构格式化为调试面板可读文本。
 * @author 项目维护者
 * @date 2026-08-26
 */

import type { GraphCoreEdgeInput, GraphCoreInput, GraphCoreNodeInput } from '@/wasm/graphCoreInput'

/** @brief 图核心调试输出默认最多展示的节点或边数量。 */
export const DEFAULT_GRAPH_CORE_DEBUG_LIMIT = 200

/**
 * @interface GraphCoreDebugOptions
 * @brief 表示图核心调试输出的截断配置。
 */
export interface GraphCoreDebugOptions {
  /** @brief 最多展示的节点数量。 */
  maxNodes?: number
  /** @brief 最多展示的边数量。 */
  maxEdges?: number
}

/**
 * @brief 将图核心边类型数值格式化为可读文本。
 * @param type 图核心边类型数值。
 * @return 边类型文本。
 */
export function formatGraphCoreEdgeType(type: GraphCoreEdgeInput['type']): string {
  return type === 1 ? 'Spouse' : 'Parent'
}

/**
 * @brief 格式化单个图核心节点。
 * @param node 图核心节点输入。
 * @return 节点调试文本。
 */
export function formatGraphCoreNode(node: GraphCoreNodeInput): string {
  return `Node {node_index = ${node.node_index}, width = ${node.width}, height = ${node.height}, hasAvatar = ${node.hasAvatar ? 'true' : 'false'} }`
}

/**
 * @brief 格式化单条图核心边。
 * @param edge 图核心边输入。
 * @return 边调试文本。
 */
export function formatGraphCoreEdge(edge: GraphCoreEdgeInput): string {
  return `Edge {edge_index = ${edge.edge_index}, source = ${edge.source}, target = ${edge.target}, type = ${formatGraphCoreEdgeType(edge.type)} }`
}

/**
 * @brief 计算在指定最大数量下实际可展示的条目数。
 * @param total 条目总数。
 * @param maxItems 最大展示数量。
 * @return 实际展示数量。
 */
function getVisibleCount(total: number, maxItems?: number): number {
  if (maxItems === undefined) {
    return total
  }

  if (!Number.isFinite(maxItems)) {
    return total
  }

  return Math.max(0, Math.min(total, Math.floor(maxItems)))
}

/**
 * @brief 格式化截断提示行。
 * @param remaining 被截断的剩余数量。
 * @param itemName 被截断的条目类型。
 * @return 截断提示文本。
 */
function formatTruncationLine(remaining: number, itemName: 'node' | 'edge'): string {
  return `... truncated ${remaining} more ${itemName}(s)`
}

/**
 * @brief 格式化完整图核心调试输出。
 * @param input 图核心输入数据。
 * @param options 调试输出截断配置。
 * @return 完整图核心调试文本。
 */
export function formatGraphCoreDump(
  input: GraphCoreInput,
  options: GraphCoreDebugOptions = {}
): string {
  const visibleNodeCount = getVisibleCount(input.nodes.length, options.maxNodes)
  const visibleEdgeCount = getVisibleCount(input.edges.length, options.maxEdges)
  const lines = [
    `GraphCore {nodeCount = ${input.nodes.length}, edgeCount = ${input.edges.length} }`,
    'nodes:',
  ]

  if (input.nodes.length === 0) {
    lines.push('  <empty>')
  } else {
    for (let index = 0; index < visibleNodeCount; index++) {
      const node = input.nodes[index]
      lines.push(`  [${index}] ${formatGraphCoreNode(node)}`)
    }
    if (visibleNodeCount < input.nodes.length) {
      lines.push(`  ${formatTruncationLine(input.nodes.length - visibleNodeCount, 'node')}`)
    }
  }

  lines.push('edges:')

  if (input.edges.length === 0) {
    lines.push('  <empty>')
  } else {
    for (let index = 0; index < visibleEdgeCount; index++) {
      const edge = input.edges[index]
      lines.push(`  [${index}] ${formatGraphCoreEdge(edge)}`)
    }
    if (visibleEdgeCount < input.edges.length) {
      lines.push(`  ${formatTruncationLine(input.edges.length - visibleEdgeCount, 'edge')}`)
    }
  }

  return lines.join('\n')
}

/**
 * @brief 格式化图核心节点序列。
 * @param input 图核心输入数据。
 * @param options 节点输出截断配置。
 * @return 节点序列调试文本。
 */
export function formatGraphCoreNodeSequence(
  input: GraphCoreInput,
  options: Pick<GraphCoreDebugOptions, 'maxNodes'> = {}
): string {
  if (input.nodes.length === 0) {
    return '<empty>'
  }

  const visibleNodeCount = getVisibleCount(input.nodes.length, options.maxNodes)
  const lines: string[] = []

  for (let index = 0; index < visibleNodeCount; index++) {
    lines.push(`[${index}] ${formatGraphCoreNode(input.nodes[index])}`)
  }

  if (visibleNodeCount < input.nodes.length) {
    lines.push(formatTruncationLine(input.nodes.length - visibleNodeCount, 'node'))
  }

  return lines.join('\n')
}

/**
 * @brief 格式化图核心边序列。
 * @param input 图核心输入数据。
 * @param options 边输出截断配置。
 * @return 边序列调试文本。
 */
export function formatGraphCoreEdgeSequence(
  input: GraphCoreInput,
  options: Pick<GraphCoreDebugOptions, 'maxEdges'> = {}
): string {
  if (input.edges.length === 0) {
    return '<empty>'
  }

  const visibleEdgeCount = getVisibleCount(input.edges.length, options.maxEdges)
  const lines: string[] = []

  for (let index = 0; index < visibleEdgeCount; index++) {
    lines.push(`[${index}] ${formatGraphCoreEdge(input.edges[index])}`)
  }

  if (visibleEdgeCount < input.edges.length) {
    lines.push(formatTruncationLine(input.edges.length - visibleEdgeCount, 'edge'))
  }

  return lines.join('\n')
}
