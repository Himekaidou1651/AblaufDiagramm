<template>
  <div class="node-layer">
    <PersonNodeComponent
      v-for="node in personNodes"
      :key="node.id"
      :node="node"
      :selected="selection.isNodeSelected(node.id)"
      :recent="node.id === recentNodeId"
      @select="onSelectNode"
      @drag-start="onNodeDragStart"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * @file NodeLayer.vue - 节点渲染图层
 * @brief 负责渲染人物节点（PersonNode），处理节点的选择事件和拖拽启动事件。
 * @author 自动生成
 * @date 2026-07-31
 */
import { computed } from 'vue'
import { useGraphStore } from '@/stores/graphStore'
import { useSelectionStore } from '@/stores/selectionStore'
import PersonNodeComponent from '@/components/nodes/PersonNode.vue'
import type { PersonNode as PersonNodeType } from '@/types'

const graph = useGraphStore()
const selection = useSelectionStore()

withDefaults(defineProps<{
  recentNodeId?: string | null
}>(), {
  recentNodeId: null,
})

/** 过滤出所有人物节点 */
const personNodes = computed<PersonNodeType[]>(() =>
  graph.nodes.filter(n => n.kind === 'person') as PersonNodeType[]
)

const emit = defineEmits<{
  (e: 'nodeDragStart', nodeId: string, event: MouseEvent): void
  (e: 'nodeSelect', nodeId: string): void
}>()

/**
 * @brief 处理节点选择事件
 * @description Ctrl/Meta 键按下时切换选中状态，否则单选该节点。
 * @param nodeId - 被选中的节点 ID
 * @param event - 原始鼠标事件（由 PersonNode 传递）
 */
function onSelectNode(nodeId: string, event: MouseEvent) {
  // B4 fix: 使用子组件传递的 MouseEvent，而非已废弃的 window.event
  if (event?.ctrlKey || event?.metaKey) {
    selection.toggleNode(nodeId)
  } else {
    selection.selectNode(nodeId)
  }
  emit('nodeSelect', nodeId)
}

/**
 * @brief 处理节点拖拽启动事件
 * @description 拖拽时如果节点未被选中，先将其单选。
 * @param nodeId - 被拖拽的节点 ID
 * @param event - 鼠标事件
 */
function onNodeDragStart(nodeId: string, event: MouseEvent) {
  // 拖拽时如果节点未被选中 → 先单选它
  if (!selection.isNodeSelected(nodeId)) {
    selection.selectNode(nodeId)
  }
  emit('nodeDragStart', nodeId, event)
}

/**
 * @brief 清除当前所有选中
 */
function clearSelection() {
  selection.clearSelection()
}

defineExpose({ clearSelection })
</script>

<style scoped>
.node-layer {
  /* 无额外样式，仅作容器 */
}
</style>
