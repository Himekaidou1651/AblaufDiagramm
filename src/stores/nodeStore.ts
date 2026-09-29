/**
 * @file nodeStore.ts
 * @brief 管理族谱节点集合、节点增删改查、子节点创建和节点历史记录。
 * @author 项目维护者
 * @date 2026-08-26
 */

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { GenealogyEdge, GenealogyNode, PersonData, PersonNode } from '@/types'
import { isPersonNode } from '@/types'
import { useEdgeStore } from '@/stores/edgeStore'
import { useHistoryStore } from '@/stores/historyStore'
import { useCanvasStore } from '@/stores/canvasStore'
import { markDirty } from '@/stores/dirtyFlag'
import {
  CHILD_NODE_X_OFFSET,
  CHILD_NODE_Y_OFFSET,
  DEFAULT_NODE_HEIGHT,
  DEFAULT_NODE_WIDTH,
  DUPLICATE_OFFSET_BASE,
  SPOUSE_NODE_GAP,
} from '@/constants/constant'
import { normalizePersonNode } from '@/utils/nodeSize'
import { getNodeVisualBounds } from '@/utils/coords'

/** @brief 用于生成节点唯一 ID 的递增计数器。 */
let _nodeIdCounter = 0

/**
 * @brief 重置节点 ID 计数器。
 * @return 无返回值。
 */
export function resetNodeIdCounter() {
  _nodeIdCounter = 0
}

/**
 * @brief 根据已有节点 ID 同步节点 ID 计数器。
 * @param nodes 需要扫描 ID 的节点列表。
 * @return 无返回值。
 */
export function syncNodeIdCounter(nodes: { id: string }[]) {
  let max = 0
  for (const node of nodes) {
    const match = node.id.match(/node_\d+_(\d+)$/)
    if (match) max = Math.max(max, Number.parseInt(match[1], 10))
  }
  _nodeIdCounter = max
}

/**
 * @brief 生成新的节点唯一 ID。
 * @return 新节点 ID。
 */
function uid(): string {
  return `node_${Date.now()}_${++_nodeIdCounter}`
}

/**
 * @brief 将数值限制在指定范围内。
 * @param value 原始数值。
 * @param min 最小值。
 * @param max 最大值。
 * @return 限制后的数值。
 */
function clamp(value: number, min: number, max: number): number {
  if (min > max) return (min + max) / 2
  return Math.max(min, Math.min(max, value))
}

/**
 * @brief 定义节点 Store，提供节点集合状态和节点操作方法。
 * @return Pinia 节点 Store 实例。
 */
export const useNodeStore = defineStore('nodes', () => {
  /** @brief 当前图谱中的全部节点。 */
  const nodes = ref<GenealogyNode[]>([])

  const historyStore = useHistoryStore()
  const canvasStore = useCanvasStore()

  /** @brief 当前图谱中的人员节点列表。 */
  const personNodes = computed<PersonNode[]>(() => nodes.value.filter(isPersonNode))

  /** @brief 按节点 ID 索引的节点映射。 */
  const nodeMap = computed(() => {
    const map = new Map<string, GenealogyNode>()
    for (const node of nodes.value) map.set(node.id, node)
    return map
  })

  /** @brief 当前节点总数。 */
  const nodeCount = computed(() => nodes.value.length)

  /**
   * @brief 钳制人员节点位置，使视觉边界不超出画布网格矩形。
   * @param node 待钳制的人员节点。
   * @return 钳制后的节点中心位置。
   */
  function clampPersonNodePosition(node: PersonNode): { x: number; y: number } {
    const bounds = getNodeVisualBounds(node)
    const minX = canvasStore.x + bounds.width / 2
    const maxX = canvasStore.x + canvasStore.width - bounds.width / 2
    const minY = canvasStore.y + bounds.height / 2
    const maxY = canvasStore.y + canvasStore.height - bounds.height / 2

    return {
      x: clamp(node.position.x, minX, maxX),
      y: clamp(node.position.y, minY, maxY),
    }
  }

  /**
   * @brief 将所有人员节点收回画布网格边界内。
   * @return 无返回值。
   */
  function clampAllNodesToCanvas() {
    let changed = false

    for (const node of nodes.value) {
      if (!isPersonNode(node)) continue
      const nextPosition = clampPersonNodePosition(node)
      if (node.position.x !== nextPosition.x || node.position.y !== nextPosition.y) {
        node.position = nextPosition
        changed = true
      }
    }

    if (changed) {
      markDirty()
    }
  }

  /**
   * @brief 添加人员节点并记录历史。
   * @param node 待添加的人员节点数据，可携带外部指定 ID。
   * @return 新增节点 ID。
   */
  function addPersonNode(node: Omit<PersonNode, 'id' | 'kind'> & { id?: string }): string {
    const id = node.id ?? uid()
    const newNode: PersonNode = {
      ...node,
      id,
      kind: 'person',
      size: { width: DEFAULT_NODE_WIDTH, height: DEFAULT_NODE_HEIGHT },
    }
    const normalizedNode = normalizePersonNode(newNode)
    normalizedNode.position = clampPersonNodePosition(normalizedNode)

    if (!historyStore.isUndoRedoing) {
      historyStore.pushCommand({
        type: 'addPersonNode',
        timestamp: Date.now(),
        description: '添加人物节点',
        undo: () => {
          nodes.value = nodes.value.filter(n => n.id !== id)
          const edgeStore = useEdgeStore()
          edgeStore.edges = edgeStore.edges.filter(e => e.source !== id && e.target !== id)
        },
        redo: () => {
          nodes.value.push(JSON.parse(JSON.stringify(normalizedNode)))
        },
      })
    }

    nodes.value.push(normalizedNode)
    markDirty()
    return id
  }

  /**
   * @brief 在不额外收集历史数据的情况下移除指定节点及其相关边。
   * @param nodeId 待移除的节点 ID。
   * @return 无返回值。
   */
  function _removeNodeInternal(nodeId: string) {
    const node = nodeMap.value.get(nodeId)
    if (!node) return

    nodes.value = nodes.value.filter(n => n.id !== nodeId)
    const edgeStore = useEdgeStore()
    edgeStore.edges = edgeStore.edges.filter(e => e.source !== nodeId && e.target !== nodeId)
  }

  /**
   * @brief 收集删除指定节点时需要恢复的节点和相关边数据。
   * @param nodeId 待删除的节点 ID。
   * @param collectedNodes 用于收集节点快照的数组。
   * @param collectedEdges 用于收集边快照的数组。
   * @return 无返回值。
   */
  function _collectRemovals(
    nodeId: string,
    collectedNodes: GenealogyNode[],
    collectedEdges: GenealogyEdge[]
  ) {
    const node = nodeMap.value.get(nodeId)
    if (!node) return

    collectedNodes.push(JSON.parse(JSON.stringify(node)))

    const edgeStore = useEdgeStore()
    for (const edge of edgeStore.edges) {
      const related = edge.source === nodeId || edge.target === nodeId
      const alreadyCollected = collectedEdges.some(e => e.id === edge.id)
      if (related && !alreadyCollected) {
        collectedEdges.push(JSON.parse(JSON.stringify(edge)))
      }
    }
  }

  /**
   * @brief 删除指定节点及其相关边，并记录可撤销历史。
   * @param nodeId 待删除的节点 ID。
   * @return 无返回值。
   */
  function removeNode(nodeId: string) {
    if (!nodeMap.value.has(nodeId)) return

    const removedNodes: GenealogyNode[] = []
    const removedEdges: GenealogyEdge[] = []
    _collectRemovals(nodeId, removedNodes, removedEdges)

    if (!historyStore.isUndoRedoing) {
      const removedNodeIds = new Set(removedNodes.map(n => n.id))
      const removedEdgeIds = new Set(removedEdges.map(e => e.id))

      historyStore.pushCommand({
        type: 'removeNode',
        timestamp: Date.now(),
        description: '删除节点',
        undo: () => {
          for (const node of removedNodes) nodes.value.push(JSON.parse(JSON.stringify(node)))
          const edgeStore = useEdgeStore()
          for (const edge of removedEdges) edgeStore.edges.push(JSON.parse(JSON.stringify(edge)))
        },
        redo: () => {
          nodes.value = nodes.value.filter(n => !removedNodeIds.has(n.id))
          const edgeStore = useEdgeStore()
          edgeStore.edges = edgeStore.edges.filter(e => !removedEdgeIds.has(e.id))
        },
      })
    }

    _removeNodeInternal(nodeId)
    markDirty()
  }

  /**
   * @brief 更新节点位置，可选择跳过历史记录。
   * @param nodeId 待更新的节点 ID。
   * @param x 新的 X 坐标。
   * @param y 新的 Y 坐标。
   * @param skipHistory 是否跳过历史记录。
   * @return 无返回值。
   */
  function updateNodePosition(nodeId: string, x: number, y: number, skipHistory = false) {
    const node = nodeMap.value.get(nodeId)
    if (!node) return

    const oldX = node.position.x
    const oldY = node.position.y
    const nextPosition = isPersonNode(node)
      ? clampPersonNodePosition({ ...node, position: { x, y } })
      : { x, y }

    if (!skipHistory && !historyStore.isUndoRedoing) {
      historyStore.pushCommand({
        type: 'updateNodePosition',
        timestamp: Date.now(),
        nodeId,
        description: '移动节点',
        undo: () => {
          const n = nodeMap.value.get(nodeId)
          if (n) n.position = { x: oldX, y: oldY }
        },
        redo: () => {
          const n = nodeMap.value.get(nodeId)
          if (n) n.position = nextPosition
        },
      })
    }

    node.position = nextPosition
    markDirty()
  }

  /**
   * @brief 记录一次拖拽结束后的合并位置历史。
   * @param nodeId 被拖拽的节点 ID。
   * @param startX 拖拽起始 X 坐标。
   * @param startY 拖拽起始 Y 坐标。
   * @param endX 拖拽结束 X 坐标。
   * @param endY 拖拽结束 Y 坐标。
   * @return 无返回值。
   */
  function recordDragHistory(
    nodeId: string,
    startX: number,
    startY: number,
    endX: number,
    endY: number
  ) {
    if (historyStore.isUndoRedoing) return
    if (startX === endX && startY === endY) return

    historyStore.pushCommand({
      type: 'updateNodePosition',
      timestamp: Date.now(),
      nodeId,
      description: '拖拽节点',
      undo: () => {
        const node = nodeMap.value.get(nodeId)
        if (node) node.position = { x: startX, y: startY }
      },
      redo: () => {
        const node = nodeMap.value.get(nodeId)
        if (node) node.position = { x: endX, y: endY }
      },
    })
  }

  /**
   * @brief 更新人员节点业务数据并记录历史。
   * @param nodeId 待更新的节点 ID。
   * @param data 待合并的人员数据。
   * @return 无返回值。
   */
  function updateNodeData(nodeId: string, data: Partial<PersonData>) {
    const node = nodeMap.value.get(nodeId)
    if (!node || !isPersonNode(node)) return

    const oldData = JSON.parse(JSON.stringify(node.data)) as PersonData

    if (!historyStore.isUndoRedoing) {
      const newData = { ...node.data, ...data }
      historyStore.pushCommand({
        type: 'updateNodeData',
        timestamp: Date.now(),
        nodeId,
        description: '编辑节点数据',
        undo: () => {
          const n = nodeMap.value.get(nodeId)
          if (n && isPersonNode(n)) n.data = JSON.parse(JSON.stringify(oldData))
        },
        redo: () => {
          const n = nodeMap.value.get(nodeId)
          if (n && isPersonNode(n)) n.data = { ...n.data, ...JSON.parse(JSON.stringify(newData)) }
        },
      })
    }

    node.data = { ...node.data, ...data }
    node.position = clampPersonNodePosition(node)
    markDirty()
  }

  /**
   * @brief 按 ID 获取图谱节点。
   * @param nodeId 待查询的节点 ID。
   * @return 找到时返回图谱节点，否则返回 undefined。
   */
  function getNode(nodeId: string): GenealogyNode | undefined {
    return nodeMap.value.get(nodeId)
  }

  /**
   * @brief 按 ID 获取人员节点。
   * @param nodeId 待查询的节点 ID。
   * @return 找到人员节点时返回该节点，否则返回 undefined。
   */
  function getPersonNode(nodeId: string): PersonNode | undefined {
    const node = nodeMap.value.get(nodeId)
    return node && isPersonNode(node) ? node : undefined
  }

  /**
   * @brief 复制指定人员节点并应用默认偏移。
   * @param nodeId 待复制的节点 ID。
   * @return 新节点 ID；源节点不存在时返回 null。
   */
  function duplicateNode(nodeId: string): string | null {
    const source = getPersonNode(nodeId)
    if (!source) return null

    const clonedData = JSON.parse(JSON.stringify(source.data)) as PersonData
    return addPersonNode({
      position: {
        x: source.position.x + DUPLICATE_OFFSET_BASE,
        y: source.position.y + DUPLICATE_OFFSET_BASE,
      },
      size: { width: DEFAULT_NODE_WIDTH, height: DEFAULT_NODE_HEIGHT },
      data: clonedData,
    })
  }

  /**
   * @brief 为指定父节点添加子节点并创建父子关系边。
   * @param parentId 父节点 ID。
   * @param childData 子节点人员数据。
   * @param childPosition 可选的子节点位置。
   * @return 新子节点 ID；父节点不存在时返回空字符串。
   */
  function addChildNode(
    parentId: string,
    childData: PersonData,
    childPosition?: { x: number; y: number }
  ): string {
    const parent = getPersonNode(parentId)
    if (!parent) return ''
    const parentSize = { width: DEFAULT_NODE_WIDTH, height: DEFAULT_NODE_HEIGHT }

    const pos = childPosition ?? {
      x: parent.position.x + parentSize.width / 2 - CHILD_NODE_X_OFFSET,
      y: parent.position.y + parentSize.height + CHILD_NODE_Y_OFFSET,
    }

    const childId = addPersonNode({
      position: pos,
      size: { width: DEFAULT_NODE_WIDTH, height: DEFAULT_NODE_HEIGHT },
      data: childData,
    })

    const edgeStore = useEdgeStore()
    edgeStore.addEdge(parentId, childId, 'parent')
    return childId
  }

  /**
   * @brief 为指定节点添加配偶节点并创建配偶关系边。
   * @param sourceId 源节点 ID。
   * @param spouseData 配偶节点人员数据。
   * @param spousePosition 可选的配偶节点位置。
   * @return 新配偶节点 ID；源节点不存在时返回空字符串。
   */
  function addSpouseNode(
    sourceId: string,
    spouseData: PersonData,
    spousePosition?: { x: number; y: number }
  ): string {
    const source = getPersonNode(sourceId)
    if (!source) return ''

    const pos = spousePosition ?? {
      x: source.position.x + DEFAULT_NODE_WIDTH + SPOUSE_NODE_GAP,
      y: source.position.y,
    }

    const spouseId = addPersonNode({
      position: pos,
      size: { width: DEFAULT_NODE_WIDTH, height: DEFAULT_NODE_HEIGHT },
      data: spouseData,
    })

    const edgeStore = useEdgeStore()
    edgeStore.addEdge(sourceId, spouseId, 'spouse')
    return spouseId
  }

  return {
    nodes,
    personNodes,
    nodeMap,
    nodeCount,
    addPersonNode,
    removeNode,
    updateNodePosition,
    recordDragHistory,
    updateNodeData,
    getNode,
    getPersonNode,
    duplicateNode,
    addChildNode,
    addSpouseNode,
    clampAllNodesToCanvas,
  }
})
