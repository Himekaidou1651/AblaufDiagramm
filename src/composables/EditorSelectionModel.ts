/**
 * @file EditorSelectionModel.ts
 * @brief 聚合编辑器当前选中的节点、边和检查器展示所需的派生信息。
 * @author 项目维护者
 * @date 2026-08-26
 */

import { computed } from 'vue'
import { useEdgeStore } from '@/stores/edgeStore'
import { useGraphStore } from '@/stores/graphStore'
import { useSelectionStore } from '@/stores/selectionStore'
import { useSettingsStore } from '@/stores/settingsStore'
import type { GenealogyEdge, PersonNode } from '@/types'
import { isPersonNode } from '@/types'

/**
 * @brief 创建编辑器选择状态的派生模型。
 * @return 选中节点、选中边、检查器可见性以及边端点信息。
 */
export function EditorSelectionModel() {
  const graph = useGraphStore()
  const edgeStore = useEdgeStore()
  const selection = useSelectionStore()
  const settings = useSettingsStore()

  /** @brief 当前唯一选中的人员节点。 */
  const selectedNode = computed<PersonNode | null>(() => selection.singleSelectedNode)

  /** @brief 开发者模式下当前选中节点关联的边 ID 列表。 */
  const selectedNodeEdgeIds = computed(() => {
    if (!settings.developerMode) return []
    if (!selectedNode.value) return []
    const nodeId = selectedNode.value.id
    return edgeStore.edges
      .filter(edge => edge.source === nodeId || edge.target === nodeId)
      .map(edge => edge.id)
  })

  /** @brief 当前唯一选中的关系边。 */
  const selectedEdge = computed<GenealogyEdge | null>(() => selection.singleSelectedEdge)

  /** @brief 标记检查器面板是否需要显示。 */
  const inspectorVisible = computed(() => selection.hasSelection)

  /** @brief 当前选中边的源节点名称。 */
  const sourceNodeName = computed(() => {
    if (!selectedEdge.value) return ''
    const node = graph.getNode(selectedEdge.value.source)
    return (node && isPersonNode(node)) ? node.data.name : ''
  })

  /** @brief 当前选中边的源节点 ID。 */
  const sourceNodeId = computed(() => selectedEdge.value?.source ?? '')

  /** @brief 当前选中边的目标节点名称。 */
  const targetNodeName = computed(() => {
    if (!selectedEdge.value) return ''
    const node = graph.getNode(selectedEdge.value.target)
    return (node && isPersonNode(node)) ? node.data.name : ''
  })

  /** @brief 当前选中边的目标节点 ID。 */
  const targetNodeId = computed(() => selectedEdge.value?.target ?? '')

  return {
    selectedNode,
    selectedNodeEdgeIds,
    selectedEdge,
    inspectorVisible,
    sourceNodeName,
    sourceNodeId,
    targetNodeName,
    targetNodeId,
  }
}
