/**
 * @file fixtures.ts
 * @brief 提供测试中复用的族谱节点和关系边夹具。
 * @author 项目维护者
 * @date 2026-08-26
 */

import type { GenealogyEdge, PersonNode } from '@/types'

/**
 * @brief 创建人员节点测试夹具。
 * @param id 节点 ID。
 * @param x 节点 X 坐标。
 * @param y 节点 Y 坐标。
 * @return 人员节点夹具。
 */
export function person(id: string, x = 0, y = 0): PersonNode {
  return {
    id,
    kind: 'person',
    position: { x, y },
    size: { width: 180, height: 100 },
    data: {
      name: id,
      title: '',
      period: '',
    },
  }
}

/**
 * @brief 创建父子关系边测试夹具。
 * @param source 源节点 ID。
 * @param target 目标节点 ID。
 * @param id 边 ID。
 * @return 父子关系边夹具。
 */
export function parentEdge(source: string, target: string, id = `${source}-${target}`): GenealogyEdge {
  return { id, source, target, type: 'parent' }
}

/**
 * @brief 创建配偶关系边测试夹具。
 * @param source 源节点 ID。
 * @param target 目标节点 ID。
 * @param id 边 ID。
 * @return 配偶关系边夹具。
 */
export function spouseEdge(source: string, target: string, id = `${source}-${target}`): GenealogyEdge {
  return { id, source, target, type: 'spouse' }
}
