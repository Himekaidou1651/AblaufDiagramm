<template>
  <Teleport to="body">
    <div v-if="modelValue" class="modal-overlay" @click.self="close" @keydown.escape="close">
      <div class="modal-panel settings-modal">
        <div class="modal-header">
          <h2 class="modal-title">{{ t('home.settings') }}</h2>
          <button class="modal-close" @click="close">✕</button>
        </div>
        <div class="modal-body settings-body">
          <div class="setting-item">
            <span class="setting-label">{{ t('settings.theme') }}</span>
            <select v-model="settings.theme" class="setting-select">
              <option value="dark">{{ t('settings.darkMode') }}</option>
              <option value="light">{{ t('settings.lightMode') }}</option>
            </select>
          </div>
          <div class="setting-item">
            <span class="setting-label">{{ t('settings.language') }}</span>
            <select v-model="settings.language" class="setting-select">
              <option value="zh">{{ t('settings.zhCN') }}</option>
              <option value="en">{{ t('settings.en') }}</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
              <option value="ja">日本語</option>
              <option value="ru">Русский</option>
              <option value="es">Español</option>
              <option value="ar">العربية</option>
            </select>
          </div>
          <div class="setting-item">
            <span class="setting-label">{{ t('settings.showGrid') }}</span>
            <label class="toggle-label">
              <input v-model="settings.showGrid" type="checkbox" class="toggle-input" />
              <span class="toggle-track">
                <span class="toggle-thumb" />
              </span>
            </label>
          </div>
          <div class="setting-item">
            <span class="setting-label">{{ t('settings.defaultNodeColor') }}</span>
            <div class="setting-color-row">
              <input v-model="settings.defaultNodeColor" type="color" class="setting-color" />
              <span class="setting-color-value">{{ settings.defaultNodeColor }}</span>
            </div>
          </div>
          <div class="setting-item">
            <span class="setting-label">{{ t('settings.unsavedPrompt') }}</span>
            <label class="toggle-label">
              <input v-model="settings.unsavedPrompt" type="checkbox" class="toggle-input" />
              <span class="toggle-track">
                <span class="toggle-thumb" />
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
/**
 * @file HomeSettingsModal.vue
 * @brief 提供首页设置项编辑弹窗，包括主题、语言、网格和默认节点颜色等选项。
 * @author 项目维护者
 * @date 2026-08-26
 */

import { useI18n } from '@/i18n'
import { useSettingsStore } from '@/stores/settingsStore'

/**
 * @brief 定义首页设置弹窗的显示状态属性。
 */
defineProps<{
  modelValue: boolean
}>()

/**
 * @brief 定义首页设置弹窗的双向绑定事件。
 */
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

/** @brief 提供可直接绑定到表单控件的全局设置状态。 */
const settings = useSettingsStore()

/** @brief 提供首页设置文案的国际化翻译函数。 */
const { t } = useI18n()

/**
 * @brief 关闭首页设置弹窗。
 * @return 无返回值。
 */
function close() {
  emit('update:modelValue', false)
}

</script>
