/**
 * @file EditorInspectorActions.ts
 * @brief 提供编辑器检查器中删除边、修改边类型、更新节点字段和位置的操作。
 * @author 项目维护者
 * @date 2026-08-26
 */

import type { ComputedRef } from 'vue'
import { useGraphStore } from '@/stores/graphStore'
import { useSelectionStore } from '@/stores/selectionStore'
import type { EdgeType, GenealogyEdge, PersonData } from '@/types'

/**
 * @brief 创建检查器面板使用的图谱编辑动作集合。
 * @param selectedEdge 当前选中的边。
 * @return 检查器可调用的边和节点编辑动作。
 */
export function EditorInspectorActions(selectedEdge: ComputedRef<GenealogyEdge | null>) {
  const graph = useGraphStore()
  const selection = useSelectionStore()

  /**
   * @brief 删除当前选中的边并清空选择状态。
   * @return 无返回值。
   */
  function deleteSelectedEdge() {
    if (selectedEdge.value) {
      graph.removeEdge(selectedEdge.value.id)
      selection.clearSelection()
    }
  }

  /**
   * @brief 更新当前选中边的关系类型。
   * @param value 新的边类型字符串。
   * @return 无返回值。
   */
  function onEdgeTypeChange(value: string) {
    if (!selectedEdge.value) return
    graph.updateEdgeType(selectedEdge.value.id, value as EdgeType)
  }

  /**
   * @brief 更新指定人员节点的数据字段。
   * @param nodeId 待更新的节点 ID。
   * @param field 待更新的人员数据字段名。
   * @param value 新字段值。
   * @return 无返回值。
   */
  function onFieldChange(nodeId: string, field: keyof PersonData, value: string | undefined) {
    const node = graph.getPersonNode(nodeId)
    if (!node) return
    graph.updateNodeData(nodeId, { [field]: value } as Partial<PersonData>)
  }

  /**
   * @brief 更新指定节点的位置。
   * @param nodeId 待更新的节点 ID。
   * @param x 新的世界坐标 X。
   * @param y 新的世界坐标 Y。
   * @return 无返回值。
   */
  function onPositionChange(nodeId: string, x: number, y: number) {
    graph.updateNodePosition(nodeId, x, y)
  }

  return {
    deleteSelectedEdge,
    onEdgeTypeChange,
    onFieldChange,
    onPositionChange,
  }
}
