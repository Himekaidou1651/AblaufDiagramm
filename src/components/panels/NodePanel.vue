<!--
  @file NodePanel.vue - 左侧节点类型面板
  @brief 编辑器左侧面板，包含人物节点添加、连线类型选择和图表统计信息。

         从 Editor.vue 提取，减少主视图组件体积。

  @author 自动生成
  @date 2026-08-04
-->
<template>
  <aside class="left-panel" :class="{ collapsed: !visible }" :style="{ width: visible ? panelWidth + 'px' : 'auto' }">
    <div class="panel-top-bar">
      <span v-if="visible" class="panel-header">{{ t('editor.nodePanel') }}</span>
      <button class="panel-collapse-btn" @click="$emit('toggle')" :title="visible ? t('panel.collapseLeft') : t('panel.expandLeft')">
        {{ visible ? '−' : '＋' }}
      </button>
    </div>
    <div v-show="visible" class="panel-content">
      <div class="node-list">
        <p class="section-label">{{ t('editor.personNode') }}</p>
        <button class="add-node-btn" @click="$emit('addPerson')">{{ t('editor.addBlock') }}</button>
        <button
          class="add-node-btn edge-btn"
          :disabled="!hasSelection"
          @click="$emit('addChild')"
        >
          {{ t('editor.addNodeConnection') }}
        </button>
      </div>

      <!-- 连线类型选择 -->
      <div class="node-list">
        <p class="section-label">{{ t('editor.dragCreate') }}</p>
        <select
          class="panel-select"
          :value="edgeType"
          @change="$emit('update:edgeType', ($event.target as HTMLSelectElement).value)"
        >
          <option value="parent">{{ t('editor.parentChild') }}</option>
          <option value="spouse">{{ t('editor.spouse') }}</option>
        </select>
      </div>

      <div class="graph-info">
        <p>{{ t('editor.info.persons') }}{{ personCount }}</p>
        <p>{{ t('editor.info.edges') }}{{ edgeCount }}</p>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
/**
 * @file NodePanel.vue - 左侧节点类型面板
 */

import { useI18n } from '@/i18n'

const { t } = useI18n()

defineProps<{
  visible: boolean
  panelWidth: number
  edgeType: string
  hasSelection: boolean
  personCount: number
  edgeCount: number
}>()

defineEmits<{
  toggle: []
  addPerson: []
  addChild: []
  'update:edgeType': [value: string]
}>()
</script>

<style scoped>
/* ===== 左侧面板 ===== */
.left-panel {
  flex-shrink: 0;
  min-width: 0;
  background: var(--bg-panel);
  display: flex;
  flex-direction: column;
}

.panel-header {
  padding: 12px 16px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-dim);
  border-bottom: 1px solid var(--border-default);
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

.panel-collapse-btn {
  width: 22px;
  height: 22px;
  margin-right: 8px;
  border-radius: 4px;
  border: 1px solid var(--border-default);
  background: var(--bg-input);
  color: var(--text-body);
  cursor: pointer;
  font-size: 14px;
  line-height: 20px;
  text-align: center;
  padding: 0;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.panel-collapse-btn:hover {
  background: var(--bg-element);
  border-color: var(--accent-blue);
}

/* 面板折叠态 */
.left-panel.collapsed {
  width: 36px !important;
  min-width: 36px;
}

.left-panel.collapsed .panel-top-bar {
  flex-direction: column;
  align-items: center;
  padding: 8px 4px;
}

.left-panel.collapsed .panel-collapse-btn {
  border-radius: 50%;
  width: 28px;
  height: 28px;
  font-size: 16px;
  line-height: 26px;
  margin-right: 0;
}

.panel-content {
  flex: 1;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-dim);
  margin-bottom: 8px;
}

.add-node-btn {
  width: 100%;
  padding: 8px 12px;
  border: 1px dashed var(--border-light);
  border-radius: 6px;
  background: transparent;
  color: var(--text-dim);
  font-size: 13px;
  font-family: var(--font-serif);
  cursor: pointer;
  transition: all 0.15s;
}

.add-node-btn:hover {
  background: var(--bg-element);
  border-color: var(--accent-blue);
  color: var(--text-body);
}

.add-node-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.add-node-btn.edge-btn:hover:not(:disabled) {
  border-color: var(--text-muted);
  border-style: solid;
  color: var(--text-body);
}

/* 左侧面板下拉选择器 */
.panel-select {
  width: 100%;
  padding: 7px 10px;
  border: 1px solid var(--border-light);
  border-radius: 6px;
  background: var(--bg-element);
  color: var(--text-body);
  font-size: 12px;
  font-family: inherit;
  cursor: pointer;
  outline: none;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'%3E%3Cpath fill='%23a6adc8' d='M5 7L1 3h8z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  padding-right: 28px;
  transition: border-color 0.15s;
}

.panel-select:hover {
  border-color: var(--accent-blue);
}

.panel-select option {
  background: var(--bg-input);
  color: var(--text-body);
}

.graph-info {
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid var(--border-default);
  font-size: 11px;
  color: var(--text-subtle);
}

.graph-info p {
  margin: 2px 0;
}
</style>
