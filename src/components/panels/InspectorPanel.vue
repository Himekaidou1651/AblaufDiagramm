<!--
  @file InspectorPanel.vue - 右侧属性检查器面板
  @brief 根据当前选区分发到节点、连线或多选检查器。
-->
<template>
  <aside class="right-panel" :style="{ width: panelWidth + 'px' }">
    <div class="panel-top-bar">
      <span class="panel-header">{{ t('editor.inspector') }}</span>
      <button class="panel-close-btn" @click="$emit('toggle')" :title="t('panel.closeInspector')">
        ×
      </button>
    </div>
    <div v-show="visible" class="panel-content">
      <MultiSelectInspector
        v-if="selectedCount > 1"
        :selected-count="selectedCount"
        @delete-selected="$emit('deleteSelected')"
      />
      <NodeInspector
        v-else-if="selectedNode"
        :node="selectedNode"
        :developer-mode="developerMode"
        :selected-node-edge-ids="selectedNodeEdgeIds"
        @add-child="$emit('addChild')"
        @field-change="(...args) => $emit('fieldChange', ...args)"
        @position-change="(...args) => $emit('positionChange', ...args)"
      />
      <EdgeInspector
        v-else-if="selectedEdge"
        :edge="selectedEdge"
        :developer-mode="developerMode"
        :source-name="sourceName"
        :source-id="sourceId"
        :target-name="targetName"
        :target-id="targetId"
        @delete-edge="$emit('deleteEdge')"
        @edge-type-change="$emit('edgeTypeChange', $event)"
      />
      <p v-else class="placeholder-text">{{ t('editor.selectHint') }}</p>
    </div>
  </aside>
</template>

<script setup lang="ts">
/**
 * @file InspectorPanel.vue - 右侧属性检查器面板
 */

import type { PersonNode, GenealogyEdge, PersonData } from '@/types'
import { useI18n } from '@/i18n'
import NodeInspector from '@/components/inspector/NodeInspector.vue'
import EdgeInspector from '@/components/inspector/EdgeInspector.vue'
import MultiSelectInspector from '@/components/inspector/MultiSelectInspector.vue'
import '@/components/inspector/inspector.css'

const { t } = useI18n()

defineProps<{
  visible: boolean
  panelWidth: number
  selectedNode: PersonNode | null
  developerMode: boolean
  selectedNodeEdgeIds: string[]
  selectedEdge: GenealogyEdge | null
  selectedCount: number
  sourceName: string
  sourceId: string
  targetName: string
  targetId: string
}>()

defineEmits<{
  toggle: []
  deleteSelected: []
  addChild: []
  deleteEdge: []
  edgeTypeChange: [value: string]
  fieldChange: [nodeId: string, field: keyof PersonData, value: string | undefined]
  positionChange: [nodeId: string, x: number, y: number]
}>()
</script>

<style scoped>
.right-panel {
  flex-shrink: 0;
  min-width: 0;
  background: var(--bg-panel);
  display: flex;
  flex-direction: column;
  font-family: var(--font-serif);
}

.right-panel .panel-content {
  flex: 1;
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
}

.panel-header {
  padding: 12px 16px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-dim);
  border-bottom: 1px solid var(--border-default);
  font-family: var(--font-serif);
}

.panel-top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0;
}

.panel-top-bar .panel-header {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-default);
}

.panel-close-btn {
  width: 22px;
  height: 22px;
  margin-right: 8px;
  border-radius: 4px;
  border: 1px solid var(--border-default);
  background: var(--bg-input);
  color: var(--text-body);
  cursor: pointer;
  font-size: 14px;
  font-family: var(--font-serif);
  line-height: 20px;
  text-align: center;
  padding: 0;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.panel-close-btn:hover {
  background: var(--bg-element);
  border-color: var(--accent-blue);
}

.placeholder-text {
  font-size: 13px;
  color: var(--text-subtle);
}
</style>
