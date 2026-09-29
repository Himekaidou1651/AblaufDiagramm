/**
 * @file NodeDrag.ts
 * @brief 管理节点拖拽、世界坐标换算、吸附辅助线和拖拽历史记录。
 * @author 项目维护者
 * @date 2026-08-26
 */
import { ref } from 'vue'
import type { SnapResult } from '@/utils/snap'
import { snapToGrid, snapToNodes } from '@/utils/snap'
import { useGraphStore } from '@/stores/graphStore'
import { useViewportStore } from '@/stores/viewportStore'
import { useConnectionStore } from '@/stores/connectionStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { getAvatarExpansion, hasNodeAvatar, normalizeStoredNodeSize } from '@/utils/coords'

/**
 * @brief 创建节点拖拽交互状态和处理器。
 * @return 拖拽状态、拖拽启动函数和吸附辅助线状态。
 */
export function NodeDrag() {
  const graph = useGraphStore()
  const viewport = useViewportStore()
  const connection = useConnectionStore()
  const settings = useSettingsStore()

  /** @brief 当前拖拽的节点 ID。 */
  const draggingNodeId = ref<string | null>(null)

  /** @brief 拖拽起始鼠标 X。 */
  let dragStartMouseX = 0

  /** @brief 拖拽起始鼠标 Y。 */
  let dragStartMouseY = 0

  /** @brief 拖拽起始节点 X。 */
  let dragStartNodeX = 0

  /** @brief 拖拽起始节点 Y。 */
  let dragStartNodeY = 0

  /** @brief 拖拽起始节点宽度。 */
  let dragStartNodeWidth = 0

  /** @brief 拖拽起始节点高度。 */
  let dragStartNodeHeight = 0

  /** @brief 当前激活的 X 方向吸附结果。 */
  const activeSnapX = ref<SnapResult | null>(null)

  /** @brief 当前激活的 Y 方向吸附结果。 */
  const activeSnapY = ref<SnapResult | null>(null)

  /** @brief 所有 X 方向辅助线。 */
  const activeSnapGuidesX = ref<SnapResult[]>([])

  /** @brief 所有 Y 方向辅助线。 */
  const activeSnapGuidesY = ref<SnapResult[]>([])

  /**
   * @brief 开始拖拽节点。
   * @param nodeId 节点 ID。
   * @param event 鼠标按下事件。
   * @return 无返回值。
   */
  function startDrag(nodeId: string, event: MouseEvent) {
    // 连线下不启动节点拖拽
    if (connection.connecting) return

    const node = graph.getNode(nodeId)
    if (!node) return

    draggingNodeId.value = nodeId
    dragStartMouseX = event.clientX
    dragStartMouseY = event.clientY
    dragStartNodeX = node.position.x
    dragStartNodeY = node.position.y
    const nodeSize = normalizeStoredNodeSize()
    dragStartNodeWidth = nodeSize.width
    dragStartNodeHeight = nodeSize.height

    // 在 window 上监听，防止鼠标移出画布后拖拽中断
    window.addEventListener('mousemove', onDrag)
    window.addEventListener('mouseup', endDrag)
  }

  /**
   * @brief 拖拽过程中根据鼠标位移更新节点世界坐标和吸附辅助线。
   * @param event 鼠标移动事件。
   * @return 无返回值。
   */
  function onDrag(event: MouseEvent) {
    if (!draggingNodeId.value) return

    const dx = event.clientX - dragStartMouseX
    const dy = event.clientY - dragStartMouseY

    // 屏幕像素差 → 世界坐标差（考虑缩放）
    const worldDx = dx / viewport.zoom
    const worldDy = dy / viewport.zoom

    let rawX = dragStartNodeX + worldDx
    let rawY = dragStartNodeY + worldDy

    // ---- 吸附修正（统一开关控制两种吸附） ----
    if (settings.snapEnabled) {
      const nodeSize = { width: dragStartNodeWidth, height: dragStartNodeHeight }
      // 视觉中心 = position.x（渲染时 left = position.x - size.width/2）
      const nodeCenter = { x: rawX, y: rawY }

      // 修正拖拽节点的矩形：有头像时视觉边缘会扩张
      const dragNode = graph.getNode(draggingNodeId.value)
      const expansion = dragNode ? getAvatarExpansion(hasNodeAvatar(dragNode)) : { width: 0, height: 0 }
      const dw = expansion.width
      const dh = expansion.height

      // 构建视觉矩形（渲染后 left = position.x - size.width/2 - dw/2）
      const nodeRect = {
        left:   rawX - nodeSize.width / 2 - dw / 2,
        right:  rawX + nodeSize.width / 2 + dw / 2,
        top:    rawY - nodeSize.height / 2 - dh / 2,
        bottom: rawY + nodeSize.height / 2 + dh / 2,
        centerX: rawX,
        centerY: rawY,
      }

      // 第二类：网格交点吸附
      const gridSnap = snapToGrid(nodeCenter, viewport.zoom)

      // 第一类：块间对齐吸附
      const nodeSnap = snapToNodes(
        draggingNodeId.value,
        nodeRect,
        graph.nodes,
        viewport.zoom
      )

      // 合并：块间对齐优先于网格吸附
      const snapX = nodeSnap.x ?? gridSnap.x
      const snapY = nodeSnap.y ?? gridSnap.y

      // 将视觉坐标还原为 position（视觉居中 ⟹ position = 视觉中心）
      // visualLeft  = position.x - w/2 - dw/2  → position.x = snapValue + w/2 + dw/2
      // visualRight = position.x + w/2 + dw/2  → position.x = snapValue - w/2 - dw/2
      if (snapX) {
        switch (snapX.anchor) {
          case 'right':  rawX = snapX.value - nodeSize.width / 2 - dw / 2; break
          case 'centerX':
          case 'midX':
          case 'spacingX': rawX = snapX.value; break
          default:        rawX = snapX.value + nodeSize.width / 2 + dw / 2 // left
        }
      }
      if (snapY) {
        switch (snapY.anchor) {
          case 'bottom':  rawY = snapY.value - nodeSize.height / 2 - dh / 2; break
          case 'centerY':
          case 'midY':
          case 'spacingY': rawY = snapY.value; break
          default:        rawY = snapY.value + nodeSize.height / 2 + dh / 2 // top
        }
      }

      // 更新辅助线状态（供 SnapGuideLayer 渲染）
      activeSnapX.value = snapX
      activeSnapY.value = snapY
      activeSnapGuidesX.value = nodeSnap.guidesX
      activeSnapGuidesY.value = nodeSnap.guidesY
    }

    // skipHistory=true：拖拽过程中不记录历史
    graph.updateNodePosition(
      draggingNodeId.value,
      rawX,
      rawY,
      true
    )
  }

  /**
   * @brief 结束拖拽并记录单条拖拽历史。
   * @return 无返回值。
   */
  function endDrag() {
    if (!draggingNodeId.value) {
      window.removeEventListener('mousemove', onDrag)
      window.removeEventListener('mouseup', endDrag)
      return
    }

    const node = graph.getNode(draggingNodeId.value)
    if (node) {
      // 记录拖拽历史：起止位置合并为一条
      graph.recordDragHistory(
        draggingNodeId.value,
        dragStartNodeX, dragStartNodeY,
        node.position.x, node.position.y
      )
    }

    draggingNodeId.value = null

    // 清除吸附辅助线
    activeSnapX.value = null
    activeSnapY.value = null
    activeSnapGuidesX.value = []
    activeSnapGuidesY.value = []

    window.removeEventListener('mousemove', onDrag)
    window.removeEventListener('mouseup', endDrag)
  }

  return {
    draggingNodeId,
    startDrag,
    /** @brief 当前激活的 X 方向吸附结果。 */
    activeSnapX,
    /** @brief 当前激活的 Y 方向吸附结果。 */
    activeSnapY,
    /** @brief 所有 X 方向辅助线。 */
    activeSnapGuidesX,
    /** @brief 所有 Y 方向辅助线。 */
    activeSnapGuidesY,
  }
}
