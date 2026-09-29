<template>
  <ToolbarMenu :label="t('toolbar.file')">
    <template #default="{ close }">
      <button class="menu-item" type="button" @click="runMenuAction(close, onNewCanvas)">
        {{ t('editor.new') }}
      </button>
      <button class="menu-item" type="button" @click="runMenuAction(close, onImportJson)">
        {{ t('editor.importJson') }}
      </button>
      <div class="menu-divider" />
      <button class="menu-item" type="button" @click="runMenuAction(close, onExportJson)">
        {{ t('editor.exportJson') }}
      </button>
      <button class="menu-item" type="button" @click="runMenuAction(close, onExportImage)">
        {{ t('editor.exportPng') }}
      </button>
      <button class="menu-item" type="button" @click="runMenuAction(close, onExportSvg)">
        {{ t('editor.exportSvg') }}
      </button>
      <button class="menu-item" type="button" @click="runMenuAction(close, onExportWebp)">
        {{ t('editor.exportWebp') }}
      </button>
    </template>
  </ToolbarMenu>
</template>

<script setup lang="ts">
/**
 * @file FileMenu.vue - 顶部文件菜单
 */
import { useI18n } from '@/i18n'
import ToolbarMenu from './ToolbarMenu.vue'

defineProps<{
  onNewCanvas: () => void
  onImportJson: () => void | Promise<void>
  onExportJson: () => void
  onExportImage: () => void | Promise<void>
  onExportSvg: () => void | Promise<void>
  onExportWebp: () => void | Promise<void>
}>()

const { t } = useI18n()

function runMenuAction(close: () => void, action: () => unknown | Promise<unknown>) {
  close()
  void action()
}
</script>
