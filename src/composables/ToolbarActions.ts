/**
 * @file ToolbarActions.ts
 * @brief 提供编辑器顶部工具栏的新建、复制、导入和导出动作。
 * @author 项目维护者
 * @date 2026-08-26
 */

import { ExportImport } from '@/composables/ExportImport'
import {
  DEFAULT_NODE_HEIGHT,
  DEFAULT_NODE_WIDTH,
  DUPLICATE_OFFSET_BASE,
  DUPLICATE_OFFSET_STEP,
} from '@/constants/constant'
import { useEdgeStore } from '@/stores/edgeStore'
import { useGraphStore } from '@/stores/graphStore'
import { useHistoryStore } from '@/stores/historyStore'
import { useNodeStore } from '@/stores/nodeStore'
import { useSelectionStore } from '@/stores/selectionStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useI18n } from '@/i18n'

/**
 * @brief 创建顶部工具栏使用的操作函数集合。
 * @param getCanvasEl 获取当前画布元素的函数。
 * @return 工具栏可绑定的新建、复制、导入和导出操作。
 */
export function ToolbarActions(getCanvasEl: () => HTMLElement | null) {
  const graph = useGraphStore()
  const nodeStore = useNodeStore()
  const edgeStore = useEdgeStore()
  const selection = useSelectionStore()
  const history = useHistoryStore()
  const settings = useSettingsStore()
  const { exportJson, importJson, exportImage, exportSvg, exportWebp, operationError, importSuccess } = ExportImport()
  const { t } = useI18n()

  /**
   * @brief 清空当前图谱并重置历史记录。
   * @return 无返回值。
   */
  function newCanvas() {
    if (nodeStore.nodeCount === 0 && edgeStore.edges.length === 0) return

    if (settings.unsavedPrompt) {
      // eslint-disable-next-line no-alert
      if (!confirm(t('editor.confirmClear'))) return
    }

    graph.clearAll()
    history.clear()
  }

  /**
   * @brief 复制当前选中的人员节点并选中新节点。
   * @return 无返回值。
   */
  function duplicateSelected() {
    const selectedIds = [...selection.selectedNodeIds]
    if (selectedIds.length === 0) return

    const newIds: string[] = []
    let offsetIndex = 0

    for (const nodeId of selectedIds) {
      const source = graph.getPersonNode(nodeId)
      if (!source) continue

      const clonedData = JSON.parse(JSON.stringify(source.data))
      const newId = graph.addPersonNode({
        position: {
          x: source.position.x + DUPLICATE_OFFSET_BASE + offsetIndex * DUPLICATE_OFFSET_STEP,
          y: source.position.y + DUPLICATE_OFFSET_BASE + offsetIndex * DUPLICATE_OFFSET_STEP,
        },
        size: { width: DEFAULT_NODE_WIDTH, height: DEFAULT_NODE_HEIGHT },
        data: clonedData,
      })

      if (newId) {
        newIds.push(newId)
        offsetIndex++
      }
    }

    if (newIds.length > 0) {
      selection.setSelectedNodes(newIds)
    }
  }

  /**
   * @brief 执行 JSON 导入并展示导入结果。
   * @return 无返回值。
   */
  async function handleImportJson() {
    const success = await importJson()
    if (success && importSuccess.value) {
      // eslint-disable-next-line no-alert
      alert(importSuccess.value)
    } else if (operationError.value) {
      // eslint-disable-next-line no-alert
      alert(operationError.value)
    }
  }

  /**
   * @brief 导出当前图谱为 JSON 文件。
   * @return 无返回值。
   */
  async function handleExportJson() {
    await exportJson()
  }

  /**
   * @brief 导出当前画布为 PNG 图片并展示可能的错误。
   * @return 无返回值。
   */
  async function handleExportImage() {
    const canvasEl = getCanvasEl()
    if (!canvasEl) return
    await exportImage(canvasEl)
    showOperationError()
  }

  /**
   * @brief 导出当前画布为 SVG 图片并展示可能的错误。
   * @return 无返回值。
   */
  async function handleExportSvg() {
    const canvasEl = getCanvasEl()
    if (!canvasEl) return
    await exportSvg(canvasEl)
    showOperationError()
  }

  /**
   * @brief 导出当前画布为 WebP 图片并展示可能的错误。
   * @return 无返回值。
   */
  async function handleExportWebp() {
    const canvasEl = getCanvasEl()
    if (!canvasEl) return
    await exportWebp(canvasEl)
    showOperationError()
  }

  /**
   * @brief 展示最近一次导入导出操作错误。
   * @return 无返回值。
   */
  function showOperationError() {
    if (operationError.value) {
      // eslint-disable-next-line no-alert
      alert(operationError.value)
    }
  }

  return {
    newCanvas,
    duplicateSelected,
    handleImportJson,
    handleExportJson,
    handleExportImage,
    handleExportSvg,
    handleExportWebp,
  }
}
