<template>
  <Teleport to="body">
    <div v-if="modelValue" class="modal-overlay" @click.self="close" @keydown.escape="close">
      <div class="modal-panel help-modal">
        <div class="modal-header">
          <h2 class="modal-title">{{ t('home.help') }}</h2>
          <button class="modal-close" @click="close">✕</button>
        </div>
        <div class="modal-body help-body">
          <div v-if="loading" class="help-loading">{{ t('home.loading') }}...</div>
          <div v-else class="markdown-body" v-html="html" />
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
 * @file HelpModal.vue
 * @brief 展示帮助 Markdown 内容和加载状态的弹窗。
 * @author 项目维护者
 * @date 2026-08-26
 */

import { useI18n } from '@/i18n'

/**
 * @brief 定义帮助弹窗的显示状态、内容和加载状态属性。
 */
defineProps<{
  modelValue: boolean
  html: string
  loading: boolean
}>()

/**
 * @brief 定义帮助弹窗的双向绑定事件。
 */
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const { t } = useI18n()

/**
 * @brief 关闭帮助弹窗。
 * @return 无返回值。
 */
function close() {
  emit('update:modelValue', false)
}
</script>
