/**
 * @file selectionStore.ts - 选区状态管理
 * @brief 管理画布上的节点和连线的选中状态。支持单选、多选、框选、全选、
 *        删除选中项等操作。使用 Reactive Set 存储选中 ID。
 * @author 自动生成
 * @date 2026-07-31
 */
import { defineStore } from 'pinia'
import { ref, computed, reactive } from 'vue'
import { useGraphStore } from './graphStore'
import type { PersonNode, GenealogyEdge } from '@/types'
import { isPersonNode } from '@/types'

export const useSelectionStore = defineStore('selection', () => {
  // ===== 状态 =====
  /** 选中的节点 ID 集合 */
  const selectedNodeIds = reactive(new Set<string>())
  /** 选中的连线 ID 集合 */
  const selectedEdgeIds = reactive(new Set<string>())
  /** 当前悬停的节点 ID */
  const hoveredNodeId = ref<string | null>(null)
  /** 框选矩形是否正在显示 */
  const selectionRectVisible = ref(false)
  /** 框选矩形起点和当前点，坐标为画布容器内屏幕坐标 */
  const selectionRect = ref({
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
  })

  // ===== 计算属性 =====
  const graph = computed(() => useGraphStore())

  /** 选中的节点列表（仅人物节点） */
  const selectedNodes = computed<PersonNode[]>(() => {
    return [...selectedNodeIds]
      .map(id => graph.value.getNode(id))
      .filter((n): n is PersonNode => n != null && isPersonNode(n))
  })

  /** 选中节点数量 */
  const selectedNodeCount = computed(() => selectedNodeIds.size)

  /** 是否有选中项 */
  const hasSelection = computed(() => selectedNodeIds.size > 0 || selectedEdgeIds.size > 0)

  /** 单个选中节点（仅当选中 1 个节点且无边选中时返回） */
  const singleSelectedNode = computed<PersonNode | null>(() => {
    if (selectedNodeIds.size !== 1 || selectedEdgeIds.size > 0) return null
    const id = [...selectedNodeIds][0]
    const node = graph.value.getNode(id)
    return node && isPersonNode(node) ? node : null
  })

  /** 单个选中边（仅当选中 1 条边且无节点选中时返回） */
  const singleSelectedEdge = computed<GenealogyEdge | null>(() => {
    if (selectedEdgeIds.size !== 1 || selectedNodeIds.size > 0) return null
    const id = [...selectedEdgeIds][0]
    return graph.value.edges.find(e => e.id === id) ?? null
  })

  /**
   * @brief 判断某节点是否被选中
   * @param nodeId - 节点 ID
   * @returns 是否选中
   */
  function isNodeSelected(nodeId: string): boolean {
    return selectedNodeIds.has(nodeId)
  }

  /**
   * @brief 判断某连线是否被选中
   * @param edgeId - 连线 ID
   * @returns 是否选中
   */
  function isEdgeSelected(edgeId: string): boolean {
    return selectedEdgeIds.has(edgeId)
  }

  // ===== 单选操作 =====

  /**
   * @brief 单选节点（清除其他选中）
   * @param nodeId - 节点 ID
   */
  function selectNode(nodeId: string) {
    selectedNodeIds.clear()
    selectedEdgeIds.clear()
    selectedNodeIds.add(nodeId)
  }

  /**
   * @brief 切换节点选中状态（Ctrl+点击）
   * @description 切换节点时自动清除边选中。
   * @param nodeId - 节点 ID
   */
  function toggleNode(nodeId: string) {
    if (selectedNodeIds.has(nodeId)) {
      selectedNodeIds.delete(nodeId)
    } else {
      selectedNodeIds.add(nodeId)
    }
    // 切换节点时清除边选中
    selectedEdgeIds.clear()
  }

  /**
   * @brief 添加节点到选中（不清除已有选中）
   * @param nodeId - 节点 ID
   */
  function addNodeToSelection(nodeId: string) {
    selectedNodeIds.add(nodeId)
  }

  /**
   * @brief 取消选中某节点
   * @param nodeId - 节点 ID
   */
  function deselectNode(nodeId: string) {
    selectedNodeIds.delete(nodeId)
  }

  /**
   * @brief 设置选中的节点列表（框选结果）
   * @param nodeIds - 节点 ID 列表
   */
  function setSelectedNodes(nodeIds: string[]) {
    selectedNodeIds.clear()
    selectedEdgeIds.clear()
    for (const id of nodeIds) {
      selectedNodeIds.add(id)
    }
  }

  /**
   * @brief 全选（仅人物节点）
   */
  function selectAll() {
    selectedNodeIds.clear()
    selectedEdgeIds.clear()
    for (const node of graph.value.nodes) {
      if (isPersonNode(node)) {
        selectedNodeIds.add(node.id)
      }
    }
  }

  /**
   * @brief 清除所有选中
   */
  function clearSelection() {
    selectedNodeIds.clear()
    selectedEdgeIds.clear()
  }

  /**
   * @brief 删除所有选中项（节点和边）
   * @description 先删选中的边，再删选中的节点（节点删除会自动清理关联的边）。
   */
  function deleteSelected() {
    // 先删除选中的边
    for (const edgeId of selectedEdgeIds) {
      graph.value.removeEdge(edgeId)
    }
    // 再删除选中的节点（会自动清理关联的边）
    for (const nodeId of selectedNodeIds) {
      graph.value.removeNode(nodeId)
    }
    selectedNodeIds.clear()
    selectedEdgeIds.clear()
  }

  // ===== 边选中 =====

  /**
   * @brief 选中连线（清除节点选中）
   * @param edgeId - 连线 ID
   */
  function selectEdge(edgeId: string) {
    selectedNodeIds.clear()
    selectedEdgeIds.clear()
    selectedEdgeIds.add(edgeId)
  }

  // ===== Hover =====

  /**
   * @brief 设置悬停节点
   * @param nodeId - 节点 ID，null 表示取消悬停
   */
  function setHoveredNode(nodeId: string | null) {
    hoveredNodeId.value = nodeId
  }

  function startSelectionRect(x: number, y: number) {
    selectionRect.value = {
      startX: x,
      startY: y,
      currentX: x,
      currentY: y,
    }
    selectionRectVisible.value = true
  }

  function updateSelectionRect(x: number, y: number) {
    selectionRect.value = {
      ...selectionRect.value,
      currentX: x,
      currentY: y,
    }
  }

  function endSelectionRect() {
    selectionRectVisible.value = false
  }

  return {
    // 状态
    selectedNodeIds,
    selectedEdgeIds,
    hoveredNodeId,
    selectionRectVisible,
    selectionRect,
    // 计算
    selectedNodes,
    selectedNodeCount,
    hasSelection,
    singleSelectedNode,
    singleSelectedEdge,
    isNodeSelected,
    isEdgeSelected,
    // 操作
    selectNode,
    toggleNode,
    addNodeToSelection,
    deselectNode,
    setSelectedNodes,
    selectAll,
    clearSelection,
    deleteSelected,
    selectEdge,
    setHoveredNode,
    startSelectionRect,
    updateSelectionRect,
    endSelectionRect
  }
})
