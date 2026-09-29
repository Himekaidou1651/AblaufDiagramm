/**
 * @file EditorNodeCreation.ts
 * @brief 提供编辑器中新建测试人员节点、添加子节点和添加配偶节点的能力。
 * @author 项目维护者
 * @date 2026-08-26
 */

import type { ComputedRef, Ref } from 'vue'
import { useCanvasStore } from '@/stores/canvasStore'
import { useGraphStore } from '@/stores/graphStore'
import { useSelectionStore } from '@/stores/selectionStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useViewportStore } from '@/stores/viewportStore'
import type { PersonNode } from '@/types'
import {
  DEFAULT_NODE_HEIGHT,
  DEFAULT_NODE_WIDTH,
  NODE_SPAWN_MARGIN,
  SPOUSE_NODE_CANVAS_PADDING,
  SPOUSE_NODE_GAP,
} from '@/constants/constant'
import { getNodeVisualBounds } from '@/utils/coords'

/** @brief 测试节点生成时每行的列数。 */
const SPAWN_COLS = 3

/** @brief 测试节点生成时的列间距。 */
const SPAWN_COL_SPACING = 220

/** @brief 测试节点生成时的行间距。 */
const SPAWN_ROW_SPACING = 120

/**
 * @brief 创建编辑器节点新增相关动作。
 * @param selectedNode 当前选中的人员节点。
 * @param canvasRef 画布容器引用，用于创建后保持新节点可见。
 * @return 新建测试人员、添加子节点、添加配偶节点和节点可见性动作集合。
 */
export function EditorNodeCreation(
  selectedNode: ComputedRef<PersonNode | null>,
  canvasRef?: Ref<HTMLElement | null>
) {
  const graph = useGraphStore()
  const canvas = useCanvasStore()
  const selection = useSelectionStore()
  const settings = useSettingsStore()
  const viewport = useViewportStore()

  /** @brief 用于错开测试节点生成位置的计数器。 */
  let spawnCounter = 0

  /**
   * @brief 在画布左上角附近按网格位置新增一个空白人员节点。
   * @return 新节点 ID。
   */
  function addTestPerson(): string {
    const col = spawnCounter % SPAWN_COLS
    const row = Math.floor(spawnCounter / SPAWN_COLS)
    const nodeId = graph.addPersonNode({
      position: {
        x: canvas.x + NODE_SPAWN_MARGIN + col * SPAWN_COL_SPACING,
        y: canvas.y + NODE_SPAWN_MARGIN + row * SPAWN_ROW_SPACING,
      },
      size: { width: DEFAULT_NODE_WIDTH, height: DEFAULT_NODE_HEIGHT },
      data: {
        name: '',
        title: '',
        period: '',
        color: settings.defaultNodeColor,
      },
    })
    spawnCounter++
    selectAndRevealNode(nodeId)
    return nodeId
  }

  /**
   * @brief 为当前选中的人员节点添加一个空白子节点，并选中新节点。
   * @return 新子节点 ID；没有选中节点时返回空字符串。
   */
  function addChildToSelected(): string {
    if (!selectedNode.value) return ''
    const childId = graph.addChildNode(selectedNode.value.id, {
      name: '',
      title: '',
      period: '',
      color: selectedNode.value.data.color ?? settings.defaultNodeColor,
    })
    selectAndRevealNode(childId)
    return childId
  }

  /**
   * @brief 为当前选中的人员节点添加一个空白配偶节点，并选中新节点。
   * @return 新配偶节点 ID；没有选中节点时返回空字符串。
   */
  function addSpouseToSelected(): string {
    const source = selectedNode.value
    if (!source) return ''

    const spouseId = graph.addSpouseNode(source.id, {
      name: '',
      title: '',
      period: '',
      color: source.data.color ?? settings.defaultNodeColor,
    }, getSpousePosition(source))
    selectAndRevealNode(spouseId)
    return spouseId
  }

  /**
   * @brief 选中新建节点，并在需要时轻微平移视口使其可见。
   * @param nodeId 新建节点 ID。
   * @return 无返回值。
   */
  function selectAndRevealNode(nodeId: string) {
    if (!nodeId) return
    selection.selectNode(nodeId)
    revealNode(nodeId)
  }

  /**
   * @brief 计算配偶节点默认位置，优先放在源节点右侧，右侧空间不足时放到左侧。
   * @param source 源节点。
   * @return 配偶节点中心位置。
   */
  function getSpousePosition(source: PersonNode): { x: number; y: number } {
    const sourceBounds = getNodeVisualBounds(source)
    const halfWidth = DEFAULT_NODE_WIDTH / 2
    const rightX = sourceBounds.left + sourceBounds.width + SPOUSE_NODE_GAP + halfWidth
    const leftX = sourceBounds.left - SPOUSE_NODE_GAP - halfWidth
    const rightLimit = canvas.x + canvas.width - SPOUSE_NODE_CANVAS_PADDING
    const leftLimit = canvas.x + SPOUSE_NODE_CANVAS_PADDING

    if (rightX + halfWidth <= rightLimit || leftX - halfWidth < leftLimit) {
      return { x: rightX, y: source.position.y }
    }

    return { x: leftX, y: source.position.y }
  }

  /**
   * @brief 在节点不完全可见时调整视口平移。
   * @param nodeId 节点 ID。
   * @return 无返回值。
   */
  function revealNode(nodeId: string) {
    const node = graph.getPersonNode(nodeId)
    const container = canvasRef?.value
    if (!node || !container) return

    const bounds = getNodeVisualBounds(node)
    const padding = 32
    const screenLeft = bounds.left * viewport.zoom + viewport.panX
    const screenRight = (bounds.left + bounds.width) * viewport.zoom + viewport.panX
    const screenTop = bounds.top * viewport.zoom + viewport.panY
    const screenBottom = (bounds.top + bounds.height) * viewport.zoom + viewport.panY

    let dx = 0
    let dy = 0
    if (screenLeft < padding) {
      dx = padding - screenLeft
    } else if (screenRight > container.clientWidth - padding) {
      dx = container.clientWidth - padding - screenRight
    }

    if (screenTop < padding) {
      dy = padding - screenTop
    } else if (screenBottom > container.clientHeight - padding) {
      dy = container.clientHeight - padding - screenBottom
    }

    if (dx !== 0 || dy !== 0) {
      viewport.pan(dx, dy)
    }
  }

  return {
    addTestPerson,
    addChildToSelected,
    addSpouseToSelected,
    selectAndRevealNode,
  }
}
