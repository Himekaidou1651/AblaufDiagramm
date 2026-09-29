<template>
  <Teleport to="body">
    <div v-if="modelValue" class="modal-overlay" @click.self="close" @keydown.escape="close">
      <div class="modal-panel about-modal">
        <div class="modal-header">
          <h2 class="modal-title">{{ t('home.about') }}</h2>
          <button class="modal-close" @click="close">✕</button>
        </div>
        <div class="modal-body about-body">
          <h3 class="about-name">{{ t('home.about.title') }}</h3>
          <img :src="logoUrl" alt="Logo" class="about-logo" />
          <div class="about-item">
            <span class="about-label">{{ t('home.about.version') }}</span>
            <code class="about-value">{{ APP_VERSION }}</code>
          </div>
          <div class="about-item">
            <span class="about-label">{{ t('home.about.techStack') }}</span>
            <span class="about-value">Vue3 + TS + Pinia + VueRouter + Vite + Electron44</span>
          </div>
          <p class="about-desc">{{ t('home.about.description') }}</p>
          <div class="about-item">
            <span class="about-label">{{ t('home.about.author') }}</span>
            <span class="about-value">Himekaidou1651</span>
          </div>
          <div class="about-item">
            <span class="about-label">{{ t('home.about.license') }}</span>
            <span class="about-value">{{ t('home.about.licenseValue') }}</span>
          </div>
        </div>
        <div class="modal-footer">
          <button class="modal-btn" @click="close">{{ t('home.close') }}</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
/**
 * @file AboutModal.vue
 * @brief 展示应用版本、技术栈、许可证和说明信息的关于弹窗。
 * @author 项目维护者
 * @date 2026-08-26
 */

import { useI18n } from '@/i18n'
import { APP_VERSION } from '@/constants/constant'

/**
 * @brief 定义关于弹窗的显示状态属性。
 */
defineProps<{
  modelValue: boolean
}>()

/**
 * @brief 定义关于弹窗的双向绑定事件。
 */
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const { t } = useI18n()

const logoUrl = `${import.meta.env.BASE_URL}vite.svg`

/**
 * @brief 关闭关于弹窗。
 * @return 无返回值。
 */
function close() {
  emit('update:modelValue', false)
}
</script>

<style scoped>
.about-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.about-name {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--accent-purple);
  text-align: center;
}

.about-logo {
  display: block;
  margin: 0 auto;
  width: 64px;
  height: 64px;
}

.about-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.about-label {
  color: var(--text-dim);
  font-size: 0.9rem;
  flex-shrink: 0;
}

.about-value {
  color: var(--text-body);
  font-size: 0.9rem;
  text-align: right;
}

code.about-value {
  font-family: var(--font-serif);
  background: var(--bg-element);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.85rem;
}

.about-desc {
  color: var(--text-dim);
  font-size: 0.88rem;
  line-height: 1.6;
  margin: 0;
}
</style>
