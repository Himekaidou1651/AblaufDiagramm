/**
 * @file graphStore.ts - 图谱持久化与组合层
 * @brief 将节点 CRUD 委托给 useNodeStore，连线 CRUD 委托给 useEdgeStore。
 *        本 store 负责 JSON 序列化、导入导出和运行态项目装载，
 *        并透传所有 nodeStore / edgeStore 的属性和方法以保持向后兼容。
 * @author 自动生成
 * @date 2026-07-31
 */
import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import type { GenealogyNode, GenealogyEdge, PersonNode } from '@/types'
import {
  deserializePersonData,
  serializePersonData,
  type ProjectFile,
  type SerializedNode,
} from '@/types/serialization'
import { debounce } from '@/utils/debounce'
import { useViewportStore } from '@/stores/viewportStore'
import { useCanvasStore } from '@/stores/canvasStore'
import { useHistoryStore } from '@/stores/historyStore'
import { useNodeStore, resetNodeIdCounter, syncNodeIdCounter } from '@/stores/nodeStore'
import { useEdgeStore, resetEdgeIdCounter, syncEdgeIdCounter } from '@/stores/edgeStore'
import { dirtyCounter, markDirty, clearDirty } from '@/stores/dirtyFlag'
import { getProjectTitleOrDefault, setProjectTitle } from '@/stores/projectTitleStore'
import { DEBOUNCE_MS, PROJECT_FILE_VERSION } from '@/constants/constant'
import { normalizeGraphNode } from '@/utils/nodeSize'

function normalizeGraphNodes(nodes: Array<GenealogyNode | SerializedNode>): PersonNode[] {
  return nodes.map((node) =>
    normalizeGraphNode({
      ...node,
      data: deserializePersonData('data' in node ? node.data : undefined),
    } as GenealogyNode)
  ) as PersonNode[]
}

export const useGraphStore = defineStore('graph', () => {
  // ===== 子 store 引用 =====
  const nodeStore = useNodeStore()
  const edgeStore = useEdgeStore()
  const historyStore = useHistoryStore()

  // ===== 持久化状态 =====
  const liveJsonString = ref<string>('')

  // ===== 实时 JSON 同步 =====
  /**
   * @brief 将当前图谱状态序列化为 JSON 供导出或保存使用
   * @description 复用 buildProjectFile 保证所有出处格式一致，使用 debounce 避免高频写入。
   */
  const updateLiveJson = debounce(() => {
    try {
      const json = JSON.stringify(buildProjectFile(), null, 2)
      liveJsonString.value = json
    } catch (e) {
      console.error('[graphStore] 无法序列化或保存图谱数据:', e)
    }
  }, DEBOUNCE_MS)

  // 通过脏标记触发序列化（避免每次深层次属性变更都触发完整 JSON 序列化）
  watch(dirtyCounter, () => {
    if (!historyStore.isUndoRedoing) {
      updateLiveJson()
    }
  })

  // 撤销/重做完成后手动触发序列化
  watch(() => historyStore.isUndoRedoing, (val, oldVal) => {
    if (oldVal && !val) {
      updateLiveJson()
    }
  })

  // ===== 批量操作 =====

  /**
   * @brief 清空画布所有节点和边
   */
  function clearAll() {
    const snapshotNodes = JSON.parse(JSON.stringify(nodeStore.nodes)) as GenealogyNode[]
    const snapshotEdges = JSON.parse(JSON.stringify(edgeStore.edges)) as GenealogyEdge[]

    if (!historyStore.isUndoRedoing) {
      historyStore.pushCommand({
        type: 'clearAll',
        timestamp: Date.now(),
        description: '清空画布',
        undo: () => {
          nodeStore.nodes = JSON.parse(JSON.stringify(snapshotNodes))
          edgeStore.edges = JSON.parse(JSON.stringify(snapshotEdges))
        },
        redo: () => {
          nodeStore.nodes = []
          edgeStore.edges = []
          resetNodeIdCounter()
          resetEdgeIdCounter()
        }
      })
    }

    nodeStore.nodes = []
    edgeStore.edges = []
    resetNodeIdCounter()
    resetEdgeIdCounter()
    markDirty()
  }

  /**
   * @brief 重置画布（同 clearAll）
   */
  function reset() {
    clearAll()
  }

  /**
   * @brief 兼容旧入口：当前版本不再从 localStorage 恢复上次会话。
   */
  function restoreLastSession(): { success: boolean; error?: string; nodeCount?: number } {
    return { success: false, error: 'No legacy session storage' }
  }

  /**
   * @brief 导入图谱数据
   * @param data - 包含 nodes 和 edges 的数据对象
   */
  function importGraph(data: { nodes: GenealogyNode[]; edges: GenealogyEdge[] }) {
    const importedNodes = normalizeGraphNodes(data.nodes)
    nodeStore.nodes = importedNodes
    edgeStore.edges = data.edges
    nodeStore.clampAllNodesToCanvas()
    // B6 fix: 同步 ID 计数器，防止新节点 ID 与已有 ID 冲突
    syncNodeIdCounter(importedNodes)
    syncEdgeIdCounter(data.edges)
    historyStore.clear()
    markDirty()
  }

  /**
   * @brief 将完整项目文件装载到当前运行态
   * @description project 必须已是统一格式正文，此处不再对字段做兜底推断。
   * @param project - 项目文件
   */
  function loadProject(project: ProjectFile) {
    const restoredNodes = normalizeGraphNodes(project.nodes)
    nodeStore.nodes = restoredNodes
    edgeStore.edges = project.edges.map(edge => ({ ...edge }))
    syncNodeIdCounter(restoredNodes)
    syncEdgeIdCounter(project.edges)

    const viewportStore = useViewportStore()
    const canvasStore = useCanvasStore()
    viewportStore.panX = project.viewport.x
    viewportStore.panY = project.viewport.y
    viewportStore.zoom = project.viewport.zoom
    canvasStore.x = project.canvas.x
    canvasStore.y = project.canvas.y
    canvasStore.width = project.canvas.width
    canvasStore.height = project.canvas.height
    nodeStore.clampAllNodesToCanvas()
    setProjectTitle(project.title ?? '')
    historyStore.clear()
    clearDirty()
    liveJsonString.value = JSON.stringify(buildProjectFile(), null, 2)
  }

  /**
   * @brief 导出图谱数据（深拷贝）
   * @returns 包含 nodes 和 edges 的数据对象
   */
  function exportGraph(): { nodes: GenealogyNode[]; edges: GenealogyEdge[] } {
    return {
      nodes: JSON.parse(JSON.stringify(normalizeGraphNodes(nodeStore.nodes))),
      edges: JSON.parse(JSON.stringify(edgeStore.edges))
    }
  }

  /**
   * @brief 组装唯一权威的项目正文
   * @description 独立项目 JSON、本地存档和 Electron 存档都使用本函数的输出。
   * @returns 统一格式的 ProjectFile
   */
  function buildProjectFile(): ProjectFile {
    const viewportStore = useViewportStore()
    const canvasStore = useCanvasStore()
    return {
      version: PROJECT_FILE_VERSION,
      title: getProjectTitleOrDefault(),
      exportedAt: new Date().toISOString(),
      viewport: {
        x: viewportStore.panX,
        y: viewportStore.panY,
        zoom: viewportStore.zoom,
      },
      canvas: {
        x: canvasStore.x,
        y: canvasStore.y,
        width: canvasStore.width,
        height: canvasStore.height,
      },
      nodes: nodeStore.nodes.map(node => ({
        id: node.id,
        kind: 'person' as const,
        position: { x: node.position.x, y: node.position.y },
        size: { width: node.size.width, height: node.size.height },
        data: serializePersonData(node.data),
      })),
      edges: edgeStore.edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: edge.type,
      })),
    }
  }

  // ===== 响应式透传：必须用 computed() 包装，否则 Pinia 在初始化时求值后
  // 不再追踪子 store 的变化。对于 array replacement（如 filter 后赋值），
  // 这会导致 graphStore 持有旧数组引用，界面不更新。
  const nodes = computed(() => nodeStore.nodes)
  const personNodes = computed(() => nodeStore.personNodes)
  const nodeMap = computed(() => nodeStore.nodeMap)
  const nodeCount = computed(() => nodeStore.nodeCount)
  const edges = computed(() => edgeStore.edges)
  const edgeCount = computed(() => edgeStore.edgeCount)

  // ===== 返回：透传子 store + 持久化 =====
  return {
    // 状态（透传 nodeStore）
    nodes,
    // 计算（透传 nodeStore）
    personNodes,
    nodeMap,
    nodeCount,
    // 节点操作（透传 nodeStore）
    addPersonNode: nodeStore.addPersonNode,
    removeNode: nodeStore.removeNode,
    updateNodePosition: nodeStore.updateNodePosition,
    recordDragHistory: nodeStore.recordDragHistory,
    updateNodeData: nodeStore.updateNodeData,
    getNode: nodeStore.getNode,
    getPersonNode: nodeStore.getPersonNode,
    duplicateNode: nodeStore.duplicateNode,
    addChildNode: nodeStore.addChildNode,
    addSpouseNode: nodeStore.addSpouseNode,
    clampAllNodesToCanvas: nodeStore.clampAllNodesToCanvas,
    // 状态（透传 edgeStore）
    edges,
    edgeCount,
    // 连线操作（透传 edgeStore）
    addEdge: edgeStore.addEdge,
    removeEdge: edgeStore.removeEdge,
    updateEdgeType: edgeStore.updateEdgeType,
    getOutgoingEdges: edgeStore.getOutgoingEdges,
    getIncomingEdges: edgeStore.getIncomingEdges,
    getChildren: edgeStore.getChildren,
    getParent: edgeStore.getParent,
    getSpouses: edgeStore.getSpouses,
    // 持久化
    liveJsonString,
    clearAll,
    reset,
    restoreLastSession,
    loadProject,
    importGraph,
    exportGraph,
    buildProjectFile,
  }
})
