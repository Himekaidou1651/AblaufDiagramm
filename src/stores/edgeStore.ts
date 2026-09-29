/**
 * @file edgeStore.ts - 连线状态管理
 * @brief 管理谱系连线的 CRUD 操作。支持添加/删除连线、更新连线类型、
 *        查询父子/配偶关系。所有操作自动记录历史以供撤销/重做。
 * @author 自动生成
 * @date 2026-07-31
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { GenealogyEdge, EdgeType } from '@/types'
import { useHistoryStore } from '@/stores/historyStore'
import { markDirty } from '@/stores/dirtyFlag'

// ===== ID 生成器 =====
/** 连线 ID 自增计数器 */
let _edgeIdCounter = 0

/**
 * @brief 重置连线 ID 计数器（用于清空画布后）
 */
export function resetEdgeIdCounter() {
  _edgeIdCounter = 0
}

/**
 * @brief 同步连线 ID 计数器，避免恢复/导入后新连线 ID 冲突
 * @description 扫描所有已有连线 ID 中的最大计数器值，确保后续新 ID 不会重复。
 * @param edges - 当前所有连线列表
 */
export function syncEdgeIdCounter(edges: { id: string }[]) {
  let max = 0
  for (const e of edges) {
    const match = e.id.match(/edge_\d+_(\d+)$/)
    if (match) max = Math.max(max, parseInt(match[1], 10))
  }
  _edgeIdCounter = max
}

/**
 * @brief 生成唯一连线 ID
 * @returns 格式为 edge_{timestamp}_{counter} 的唯一 ID
 */
function eid(): string {
  return `edge_${Date.now()}_${++_edgeIdCounter}`
}

export const useEdgeStore = defineStore('edges', () => {
  // ===== 状态 =====
  /** 连线列表 */
  const edges = ref<GenealogyEdge[]>([])

  const historyStore = useHistoryStore()

  // ===== 计算属性 =====

  /** 连线数量 */
  const edgeCount = computed(() => edges.value.length)

  // ===== 连线 CRUD =====

  /**
   * @brief 添加连线
   * @description 自动检查重复（同一 source+target+type 不重复添加），
   *              并记录撤销/重做历史。
   * @param source - 源节点 ID
   * @param target - 目标节点 ID
   * @param type - 连线类型，默认 'parent'
   * @returns 新连线 ID，重复时返回空字符串
   */
  function addEdge(
    source: string,
    target: string,
    type: EdgeType = 'parent'
  ): string {
    const exists = edges.value.some(
      e => e.source === source && e.target === target && e.type === type
    )
    if (exists) return ''

    const id = eid()
    const newEdge: GenealogyEdge = { id, source, target, type }

    if (!historyStore.isUndoRedoing) {
      historyStore.pushCommand({
        type: 'addEdge',
        timestamp: Date.now(),
        description: `添加连线`,
        undo: () => {
          edges.value = edges.value.filter(e => e.id !== id)
        },
        redo: () => {
          edges.value.push(JSON.parse(JSON.stringify(newEdge)))
        }
      })
    }

    edges.value.push(newEdge)
    markDirty()
    return id
  }

  /**
   * @brief 删除连线
   * @param edgeId - 连线 ID
   */
  function removeEdge(edgeId: string) {
    const edge = edges.value.find(e => e.id === edgeId)
    if (!edge) return

    const edgeSnapshot = JSON.parse(JSON.stringify(edge)) as GenealogyEdge

    if (!historyStore.isUndoRedoing) {
      historyStore.pushCommand({
        type: 'removeEdge',
        timestamp: Date.now(),
        description: `删除连线`,
        undo: () => {
          edges.value.push(JSON.parse(JSON.stringify(edgeSnapshot)))
        },
        redo: () => {
          edges.value = edges.value.filter(e => e.id !== edgeId)
        }
      })
    }

    edges.value = edges.value.filter(e => e.id !== edgeId)
    markDirty()
  }

  /**
   * @brief 更新连线类型
   * @param edgeId - 连线 ID
   * @param type - 新连线类型
   */
  function updateEdgeType(edgeId: string, type: EdgeType) {
    const edge = edges.value.find(e => e.id === edgeId)
    if (!edge) return

    const oldType = edge.type

    if (!historyStore.isUndoRedoing) {
      historyStore.pushCommand({
        type: 'updateEdgeType',
        timestamp: Date.now(),
        description: `修改连线类型`,
        undo: () => {
          const e = edges.value.find(ee => ee.id === edgeId)
          if (e) e.type = oldType
        },
        redo: () => {
          const e = edges.value.find(ee => ee.id === edgeId)
          if (e) e.type = type
        }
      })
    }

    edge.type = type
    markDirty()
  }

  // ===== 关系查询（需要 nodeStore） =====

  /**
   * @brief 获取某个节点的所有出边
   * @param nodeId - 节点 ID
   * @returns 出边列表
   */
  function getOutgoingEdges(nodeId: string): GenealogyEdge[] {
    return edges.value.filter(e => e.source === nodeId)
  }

  /**
   * @brief 获取某个节点的所有入边
   * @param nodeId - 节点 ID
   * @returns 入边列表
   */
  function getIncomingEdges(nodeId: string): GenealogyEdge[] {
    return edges.value.filter(e => e.target === nodeId)
  }

  /**
   * @brief 获取某个节点的子节点 ID 列表
   * @param nodeId - 节点 ID
   * @param visited - 已访问节点集（内部递归用，防止环路导致栈溢出）
   * @returns 子节点 ID 列表
   */
  function getChildren(nodeId: string, visited?: Set<string>): string[] {
    const visitedSet = visited ?? new Set<string>()
    if (visitedSet.has(nodeId)) return []
    visitedSet.add(nodeId)

    const directChildren = edges.value
      .filter(e => e.source === nodeId && e.type === 'parent')
      .map(e => e.target)

    return directChildren
  }

  /**
   * @brief 获取某个节点的父节点 ID
   * @param nodeId - 节点 ID
   * @returns 父节点 ID，无父节点返回 undefined
   */
  function getParent(nodeId: string): string | undefined {
    const edge = edges.value.find(
      e => e.target === nodeId && e.type === 'parent'
    )
    if (!edge) return undefined

    return edge.source
  }

  /**
   * @brief 获取某个节点的配偶 ID 列表
   * @param nodeId - 节点 ID
   * @returns 配偶 ID 列表
   */
  function getSpouses(nodeId: string): string[] {
    return edges.value
      .filter(e => e.type === 'spouse' && (e.source === nodeId || e.target === nodeId))
      .map(e => (e.source === nodeId ? e.target : e.source))
  }

  return {
    edges,
    edgeCount,
    addEdge,
    removeEdge,
    updateEdgeType,
    getOutgoingEdges,
    getIncomingEdges,
    getChildren,
    getParent,
    getSpouses
  }
})
