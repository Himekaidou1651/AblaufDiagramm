/**
 * @file nodeSize.ts
 * @brief 提供人员节点存储尺寸规范化、显示尺寸获取和尺寸标签生成工具。
 * @author 项目维护者
 * @date 2026-08-26
 */

import type { GenealogyNode, PersonNode, Size } from '@/types'
import { DEFAULT_NODE_HEIGHT, DEFAULT_NODE_WIDTH } from '@/constants/constant'
import { getNodeVisualSize, hasNodeAvatar, normalizeStoredNodeSize } from '@/utils/coords'

/**
 * @brief 将人员节点规范化为当前允许的存储尺寸。
 * @param node 待规范化的人员节点。
 * @return 规范化后的人员节点。
 */
export function normalizePersonNode(node: PersonNode): PersonNode {
  return {
    ...node,
    kind: 'person',
    size: normalizeStoredNodeSize(),
  }
}

/**
 * @brief 将图谱节点规范化为当前允许的存储尺寸。
 * @param node 待规范化的图谱节点。
 * @return 规范化后的图谱节点。
 */
export function normalizeGraphNode(node: GenealogyNode): GenealogyNode {
  return normalizePersonNode(node)
}

/**
 * @brief 判断存储尺寸是否为当前允许的默认节点尺寸。
 * @param size 待判断的节点尺寸。
 * @return 尺寸合法时返回 true，否则返回 false。
 */
export function isAllowedStoredNodeSize(size: Size): boolean {
  return size.width === DEFAULT_NODE_WIDTH && size.height === DEFAULT_NODE_HEIGHT
}

/**
 * @brief 获取节点在画布上的允许显示尺寸。
 * @param node 待获取显示尺寸的图谱节点。
 * @return 节点视觉显示尺寸。
 */
export function getAllowedNodeDisplaySize(node: GenealogyNode): Size {
  return getNodeVisualSize(node)
}

/**
 * @brief 获取节点允许显示尺寸对应的标签。
 * @param node 待获取尺寸标签的图谱节点。
 * @return 节点尺寸标签。
 */
export function getAllowedNodeSizeLabel(node: GenealogyNode): '180x100' | '270x120' {
  return hasNodeAvatar(node) ? '270x120' : '180x100'
}
