<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="modal-overlay"
      @click.self="close"
      @keydown.escape="close"
    >
      <div class="modal-panel shortcut-modal">
        <div class="modal-header">
          <h2 class="modal-title">{{ t('shortcut.title') }}</h2>
          <button class="modal-close" @click="close">✕</button>
        </div>
        <div class="modal-body shortcut-body">
          <table class="shortcut-table">
            <thead>
              <tr>
                <th>{{ t('shortcut.key') }}</th>
                <th>{{ t('shortcut.action') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in shortcuts" :key="item.key">
                <td class="shortcut-key">
                  <kbd>{{ item.key }}</kbd>
                </td>
                <td>{{ item.action }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
/**
 * @file ShortcutHelp.vue - 快捷键速查面板
 * @brief 工具栏 ? 按钮点击后弹出，列出编辑器所有键盘快捷键。
 *        使用 Teleport 到 body，复用 modal.css 公共样式。
 * @author 自动生成
 * @date 2026-07-31
 */
import { computed } from 'vue'
import { useI18n } from '@/i18n'

defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const { t } = useI18n()

const isMac = computed(() => /Mac|iPod|iPhone|iPad/.test(navigator.platform))
const mod = computed(() => isMac.value ? '⌘' : 'Ctrl')

function close() {
  emit('update:modelValue', false)
}

interface ShortcutItem {
  key: string
  action: string
}

const shortcuts = computed<ShortcutItem[]>(() => [
  { key: `${mod.value}+Z`,          action: t('shortcut.undo') },
  { key: `${mod.value}+Y`,          action: t('shortcut.redo') },
  { key: `${mod.value}+D`,          action: t('editor.duplicate') },
  { key: `${mod.value}+A`,          action: t('shortcut.selectAll') },
  { key: 'Delete / Backspace',      action: t('editor.delete') },
  { key: 'Escape',                  action: t('shortcut.cancel') },
  { key: `${t('shortcut.spaceDrag')}`, action: t('shortcut.panCanvas') },
  { key: `${t('shortcut.scrollWheel')}`, action: t('shortcut.zoomCanvas') },
])
</script>
