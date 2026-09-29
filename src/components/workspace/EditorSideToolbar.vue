<template>
  <aside class="editor-side-toolbar" @mousedown.stop>
    <button
      class="tool-btn"
      type="button"
      :title="t('editor.addBlock')"
      @click="$emit('addPerson')"
    >
      +
    </button>

    <button
      class="tool-btn"
      type="button"
      :disabled="!hasSelection"
      :title="t('editor.addNodeConnection')"
      @click="$emit('addChild')"
    >
      ↳
    </button>

    <div class="tool-popover-wrap">
      <button
        class="tool-btn"
        :class="{ active: relationshipOpen }"
        type="button"
        :title="t('editor.dragCreate')"
        @click="relationshipOpen = !relationshipOpen"
      >
        ⇄
      </button>
      <div v-if="relationshipOpen" class="tool-popover relationship-popover">
        <button
          class="popover-option"
          :class="{ selected: edgeType === 'parent' }"
          type="button"
          @click="selectEdgeType('parent')"
        >
          {{ t('editor.parentChild') }}
        </button>
        <button
          class="popover-option"
          :class="{ selected: edgeType === 'spouse' }"
          type="button"
          @click="selectEdgeType('spouse')"
        >
          {{ t('editor.spouse') }}
        </button>
      </div>
    </div>

    <div class="toolbar-spacer" />

    <button
      class="tool-btn"
      :class="{ active: jsonOpen }"
      type="button"
      :title="t('jsonSidebar.title')"
      @click="$emit('toggleJson')"
    >
      ≡
    </button>
  </aside>
</template>

<script setup lang="ts">
/**
 * @file EditorSideToolbar.vue - 编辑器左侧窄工具栏
 * @brief 替代旧 NodePanel 的常驻宽面板，承载创建、关系类型和存档 JSON 入口。
 */
import { ref } from 'vue'
import { useI18n } from '@/i18n'
import type { EdgeType } from '@/types'

const { t } = useI18n()
const relationshipOpen = ref(false)

defineProps<{
  edgeType: EdgeType
  hasSelection: boolean
  jsonOpen: boolean
}>()

const emit = defineEmits<{
  addPerson: []
  addChild: []
  toggleJson: []
  'update:edgeType': [value: EdgeType]
}>()

function selectEdgeType(value: EdgeType) {
  emit('update:edgeType', value)
  relationshipOpen.value = false
}
</script>

<style scoped>
.editor-side-toolbar {
  width: 52px;
  flex-shrink: 0;
  padding: 8px 6px;
  background: var(--bg-panel);
  border-right: 1px solid var(--border-default);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  user-select: none;
  z-index: 20;
}

.tool-btn {
  width: 36px;
  height: 36px;
  border: 1px solid var(--border-light);
  border-radius: 6px;
  background: var(--bg-element);
  color: var(--text-body);
  font-size: 18px;
  line-height: 1;
  font-family: var(--font-serif);
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
}

.tool-btn:hover:not(:disabled),
.tool-btn.active {
  background: var(--bg-element-hover);
  border-color: var(--accent-blue);
}

.tool-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.toolbar-spacer {
  flex: 1;
}

.tool-popover-wrap {
  position: relative;
}

.tool-popover {
  position: absolute;
  left: 44px;
  min-width: 136px;
  padding: 8px;
  border: 1px solid var(--border-default);
  border-radius: 8px;
  background: var(--bg-panel);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.22);
  z-index: 1000;
}

.relationship-popover {
  top: 0;
}

.popover-option {
  width: 100%;
  padding: 7px 10px;
  border: 1px solid transparent;
  border-radius: 6px;
  background: transparent;
  color: var(--text-body);
  font-size: 12px;
  font-family: var(--font-serif);
  text-align: left;
  cursor: pointer;
}

.popover-option:hover,
.popover-option.selected {
  background: var(--bg-element);
  border-color: var(--border-light);
}
</style>
