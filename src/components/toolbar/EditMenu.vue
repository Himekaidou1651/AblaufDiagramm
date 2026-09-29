<template>
  <ToolbarMenu :label="t('toolbar.edit')">
    <template #default="{ close }">
      <button
        class="menu-item"
        type="button"
        :disabled="!history.canUndo"
        @click="runMenuAction(close, () => history.undo())"
      >
        <span>{{ t('toolbar.undo') }}</span>
        <span class="menu-shortcut">{{ modKey }}+Z</span>
      </button>
      <button
        class="menu-item"
        type="button"
        :disabled="!history.canRedo"
        @click="runMenuAction(close, () => history.redo())"
      >
        <span>{{ t('toolbar.redo') }}</span>
        <span class="menu-shortcut">{{ modKey }}+Y</span>
      </button>
      <div class="menu-divider" />
      <button
        class="menu-item danger"
        type="button"
        :disabled="!selection.hasSelection"
        @click="runMenuAction(close, () => selection.deleteSelected())"
      >
        <span>{{ t('editor.delete') }}</span>
        <span class="menu-shortcut">Delete</span>
      </button>
      <button
        class="menu-item"
        type="button"
        :disabled="selection.selectedNodeCount === 0"
        @click="runMenuAction(close, onDuplicateSelected)"
      >
        <span>{{ t('editor.duplicate') }}</span>
        <span class="menu-shortcut">{{ modKey }}+D</span>
      </button>
    </template>
  </ToolbarMenu>
</template>

<script setup lang="ts">
/**
 * @file EditMenu.vue - 顶部编辑菜单
 */
import { computed } from 'vue'
import { useI18n } from '@/i18n'
import { useHistoryStore } from '@/stores/historyStore'
import { useSelectionStore } from '@/stores/selectionStore'
import ToolbarMenu from './ToolbarMenu.vue'

defineProps<{
  onDuplicateSelected: () => void
}>()

const { t } = useI18n()
const selection = useSelectionStore()
const history = useHistoryStore()
const isMac = computed(() => /Mac|iPod|iPhone|iPad/.test(navigator.platform))
const modKey = computed(() => isMac.value ? '⌘' : 'Ctrl')

function runMenuAction(close: () => void, action: () => unknown | Promise<unknown>) {
  close()
  void action()
}
</script>
