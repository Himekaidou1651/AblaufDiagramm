<template>
  <ToolbarMenu :label="t('toolbar.view')">
    <template #default="{ close }">
      <button class="menu-item" type="button" @click="settings.showGrid = !settings.showGrid">
        <span>{{ settings.showGrid ? '✓' : '' }}</span>
        <span>{{ t('settings.showGrid') }}</span>
      </button>
      <button class="menu-item" type="button" @click="settings.snapEnabled = !settings.snapEnabled">
        <span>{{ settings.snapEnabled ? '✓' : '' }}</span>
        <span>{{ t('settings.snapEnabled') }}</span>
      </button>
      <button class="menu-item" type="button" @click="theme.toggle()">
        <span>{{ theme.isDark ? '✓' : '' }}</span>
        <span>{{ theme.isDark ? t('settings.darkMode') : t('settings.lightMode') }}</span>
      </button>
      <div class="menu-divider" />
      <button class="menu-item" type="button" @click="runMenuAction(close, () => viewport.fitContent(graph.nodes))">
        {{ t('toolbar.fitContent') }}
      </button>
      <button class="menu-item" type="button" @click="runMenuAction(close, () => viewport.fitCanvas())">
        {{ t('toolbar.fitCanvas') }}
      </button>
      <button class="menu-item" type="button" @click="runMenuAction(close, () => viewport.reset())">
        {{ t('editor.resetView') }}
      </button>
      <button class="menu-item" type="button" @click="runMenuAction(close, onShowZoomPanel)">
        {{ t('editor.zoom') }}
      </button>
      <template v-if="settings.developerMode">
        <div class="menu-divider" />
        <button class="menu-item" type="button" @click="runMenuAction(close, onShowCanvasMirror)">
          {{ t('mirrorPreview.button') }}
        </button>
        <button class="menu-item" type="button" @click="runMenuAction(close, onShowCppStatus)">
          {{ t('cppStatus.button') }}
        </button>
      </template>
    </template>
  </ToolbarMenu>
</template>

<script setup lang="ts">
/**
 * @file ViewMenu.vue - 顶部视图菜单
 */
import { useGraphStore } from '@/stores/graphStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useThemeStore } from '@/stores/themeStore'
import { useViewportStore } from '@/stores/viewportStore'
import { useI18n } from '@/i18n'
import ToolbarMenu from './ToolbarMenu.vue'

defineProps<{
  onShowZoomPanel: () => void
  onShowCanvasMirror: () => void
  onShowCppStatus: () => void
}>()

const { t } = useI18n()
const graph = useGraphStore()
const theme = useThemeStore()
const viewport = useViewportStore()
const settings = useSettingsStore()

function runMenuAction(close: () => void, action: () => unknown | Promise<unknown>) {
  close()
  void action()
}
</script>
