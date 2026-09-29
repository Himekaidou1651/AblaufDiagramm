<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="modal-overlay"
      @click.self="close"
      @keydown.escape="close"
    >
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
              <option value="fr">{{ t('settings.fr') }}</option>
              <option value="de">{{ t('settings.de') }}</option>
              <option value="ja">{{ t('settings.ja') }}</option>
              <option value="ru">{{ t('settings.ru') }}</option>
              <option value="es">{{ t('settings.es') }}</option>
              <option value="ar">{{ t('settings.ar') }}</option>
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
          <div class="setting-item setting-item-wrap">
            <div class="setting-label-group">
              <span class="setting-label">{{ t('settings.snapEnabled') }}</span>
            </div>
            <label class="toggle-label">
              <input v-model="settings.snapEnabled" type="checkbox" class="toggle-input" />
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
          <div class="setting-item">
            <span class="setting-label">{{ t('settings.developerMode') }}</span>
            <label class="toggle-label">
              <input v-model="settings.developerMode" type="checkbox" class="toggle-input" />
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
 * @file SettingsModal.vue - 设置弹窗组件
 * @brief 提供主题、语言、网格、原点标记、默认节点颜色、未保存提示等设置项。
 *        使用 v-model 控制显示/隐藏，Teleport 到 body 确保层级正确。
 * @author 自动生成
 * @date 2026-07-31
 */
import { useSettingsStore } from '@/stores/settingsStore'
import { useI18n } from '@/i18n'

// ===== Props & Emits =====
defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

// ===== Stores =====
const settings = useSettingsStore()
const { t } = useI18n()

// ===== 关闭弹窗 =====
function close() {
  emit('update:modelValue', false)
}

</script>
