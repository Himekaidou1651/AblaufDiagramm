/**
 * @file EditorConnectionFlow.ts
 * @brief 管理编辑器画布中的连线创建、取消和落点生成节点流程。
 * @author 项目维护者
 * @date 2026-08-26
 */

import { onMounted, onUnmounted, type Ref } from 'vue'
import { useConnectionStore } from '@/stores/connectionStore'
import { useGraphStore } from '@/stores/graphStore'
import { useSelectionStore } from '@/stores/selectionStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useViewportStore } from '@/stores/viewportStore'
import type { PersonNode } from '@/types'
import { getNodeVisualBounds, screenToWorld } from '@/utils/coords'

/**
 * @brief 提供编辑器连线中的画布点击、鼠标移动和鼠标释放处理逻辑。
 * @param canvasRef 画布容器元素的模板引用。
 * @param spaceHeld 标记 Space 键是否被按住的响应式引用。
 * @param connectionHandled 标记当前鼠标释放是否已被节点手柄处理的响应式引用。
 * @return 画布鼠标按下事件处理器。
 */
export function EditorConnectionFlow(
  canvasRef: Ref<HTMLElement | null>,
  spaceHeld: Ref<boolean>,
  connectionHandled: Ref<boolean>
) {
  const viewport = useViewportStore()
  const graph = useGraphStore()
  const selection = useSelectionStore()
  const connection = useConnectionStore()
  const settings = useSettingsStore()

  /**
   * @brief 处理画布鼠标按下事件，负责清除选择或取消空白处连线。
   * @param event 鼠标按下事件。
   * @return 无返回值。
   */
  function onCanvasMouseDown(event: MouseEvent) {
    if (event.button !== 0) return
    const target = event.target as HTMLElement
    if (connection.connecting) {
      if (!target.closest('.node-handle') && !target.closest('.person-node')) {
        connection.cancelConnection()
      }
      return
    }

    if (spaceHeld.value) return

    const interactiveTarget = target.closest([
      '.person-node',
      '.node-handle',
      '.genealogy-edge-group',
      '.node-context-toolbar',
      '.minimap-wrapper',
      '.canvas-scrollbar',
      '.space-hint',
    ].join(', '))

    if (!interactiveTarget) {
      selection.clearSelection()
    }
  }

  /**
   * @brief 连线过程中根据鼠标位置更新连线预览落点。
   * @param event 鼠标移动事件。
   * @return 无返回值。
   */
  function onConnectionMouseMove(event: MouseEvent) {
    if (!connection.connecting) return
    const el = canvasRef.value
    if (!el) return
    const rect = el.getBoundingClientRect()
    const world = screenToWorld(
      { x: event.clientX - rect.left, y: event.clientY - rect.top },
      viewport.panX,
      viewport.panY,
      viewport.zoom
    )
    connection.updateMouse(world)
  }

  /**
   * @brief 查找指定世界坐标下的人员节点。
   * @param world 世界坐标。
   * @return 命中的人员节点；没有命中时返回 null。
   */
  function findNodeAtWorld(world: { x: number; y: number }): PersonNode | null {
    for (const node of graph.nodes) {
      if (node.kind !== 'person') continue
      const bounds = getNodeVisualBounds(node)
      if (
        world.x >= bounds.left &&
        world.x <= bounds.left + bounds.width &&
        world.y >= bounds.top &&
        world.y <= bounds.top + bounds.height
      ) {
        return node
      }
    }
    return null
  }

  /**
   * @brief 处理连线鼠标释放，完成连线、创建子节点或取消连线。
   * @param event 鼠标释放事件。
   * @return 无返回值。
   */
  function onConnectionMouseUp(event: MouseEvent) {
    if (!connection.connecting) return

    const el = canvasRef.value
    if (!el) {
      connection.cancelConnection()
      return
    }

    const rect = el.getBoundingClientRect()
    const world = screenToWorld(
      { x: event.clientX - rect.left, y: event.clientY - rect.top },
      viewport.panX,
      viewport.panY,
      viewport.zoom
    )

    const targetNode = findNodeAtWorld(world)
    if (targetNode && targetNode.id !== connection.sourceNodeId) {
      connection.completeConnection(targetNode.id)
      return
    }

    if (connection.sourceNodeId) {
      const sourceNode = graph.getPersonNode(connection.sourceNodeId)
      graph.addChildNode(connection.sourceNodeId, {
        name: '',
        title: '',
        period: '',
        color: sourceNode?.data.color ?? settings.defaultNodeColor,
      }, { x: world.x, y: world.y })
      connection.cancelConnection()
      return
    }

    setTimeout(() => {
      if (connection.connecting && !connectionHandled.value) {
        connection.cancelConnection()
      }
      connectionHandled.value = false
    }, 0)
  }

  /**
   * @brief 挂载全局鼠标监听以维持跨画布的连线流程。
   */
  onMounted(() => {
    window.addEventListener('mousemove', onConnectionMouseMove)
    window.addEventListener('mouseup', onConnectionMouseUp)
  })

  /**
   * @brief 卸载全局鼠标监听。
   */
  onUnmounted(() => {
    window.removeEventListener('mousemove', onConnectionMouseMove)
    window.removeEventListener('mouseup', onConnectionMouseUp)
  })

  return {
    onCanvasMouseDown,
  }
}
