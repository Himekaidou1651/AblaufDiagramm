/**
 * @file connectionStore.ts - 连线操作状态管理
 * @brief 管理用户拖拽连线的临时状态，包括源节点、源手柄方向、鼠标世界坐标等。
 *        支持 startConnection / completeConnection / cancelConnection 三步操作。
 * @author 自动生成
 * @date 2026-07-31
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useGraphStore } from './graphStore'
import type { Position, EdgeType } from '@/types'
import { getVisualBounds, hasNodeAvatar, normalizeStoredNodeSize } from '@/utils/coords'

/** 手柄方向类型 */
export type HandlePosition = 'top' | 'bottom' | 'left' | 'right'

export const useConnectionStore = defineStore('connection', () => {
  // ===== 状态 =====
  /** 是否正在连线中 */
  const connecting = ref(false)
  /** 连线源节点 ID */
  const sourceNodeId = ref<string | null>(null)
  /** 连线源手柄方向 */
  const sourceHandle = ref<HandlePosition | null>(null)
  /** 鼠标当前世界坐标 */
  const mouseWorld = ref<Position>({ x: 0, y: 0 })
  /** 当前连线模式 —— 拖线创建边时使用此类型 */
  const currentEdgeType = ref<EdgeType>('parent')

  // ===== 计算 =====
  const graph = computed(() => useGraphStore())

  /**
   * @brief 计算源手柄的世界坐标
   * @returns 源锚点世界坐标，无有效源时返回 null
   */
  const sourceAnchor = computed<Position | null>(() => {
    if (!sourceNodeId.value || !sourceHandle.value) return null
    const node = graph.value.getNode(sourceNodeId.value)
    if (!node) return null
    const hasAvatar = hasNodeAvatar(node)
    return getHandleWorld(node.position, sourceHandle.value, hasAvatar)
  })

  // ===== 动作 =====

  /**
   * @brief 启动连线
   * @param nodeId - 源节点 ID
   * @param handle - 源手柄方向
   */
  function startConnection(nodeId: string, handle: HandlePosition) {
    connecting.value = true
    sourceNodeId.value = nodeId
    sourceHandle.value = handle
  }

  /**
   * @brief 更新鼠标在世界坐标中的位置
   * @param world - 鼠标世界坐标
   */
  function updateMouse(world: Position) {
    mouseWorld.value = world
  }

  /**
   * @brief 完成连线：使用 currentEdgeType 创建边
   * @description 若源等于目标则取消连线。创建边后自动清理临时状态。
   * @param targetNodeId - 目标节点 ID
   */
  function completeConnection(targetNodeId: string) {
    if (!sourceNodeId.value || sourceNodeId.value === targetNodeId) {
      cancelConnection()
      return
    }
    graph.value.addEdge(sourceNodeId.value, targetNodeId, currentEdgeType.value)
    cancelConnection()
  }

  /**
   * @brief 取消连线，清理所有临时状态
   */
  function cancelConnection() {
    connecting.value = false
    sourceNodeId.value = null
    sourceHandle.value = null
    mouseWorld.value = { x: 0, y: 0 }
  }

  return {
    connecting,
    sourceNodeId,
    sourceHandle,
    mouseWorld,
    currentEdgeType,
    sourceAnchor,
    startConnection,
    updateMouse,
    completeConnection,
    cancelConnection
  }
})

/**
 * @brief 根据节点位置和 Handle 方向，计算该 Handle 的世界坐标
 * @param pos - 节点位置
 * @param size - 节点尺寸
 * @param handle - 手柄方向
 * @returns 手柄在世界空间中的坐标
 */
export function getHandleWorld(
  pos: Position,
  handle: HandlePosition,
  hasAvatar: boolean = false
): Position {
  const bounds = getVisualBounds(pos, normalizeStoredNodeSize(), hasAvatar)
  const left = bounds.left
  const top = bounds.top
  const w = bounds.width
  const h = bounds.height

  switch (handle) {
    case 'top':    return { x: left + w / 2, y: top }
    case 'bottom': return { x: left + w / 2, y: top + h }
    case 'left':   return { x: left, y: top + h / 2 }
    case 'right':  return { x: left + w, y: top + h / 2 }
  }
}
