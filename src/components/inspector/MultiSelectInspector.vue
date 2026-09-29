<template>
  <div class="inspector-field">
    <div class="field-value name">{{ t('editor.selectedCount', [selectedCount]) }}</div>
  </div>
  <div class="inspector-actions">
    <button class="inspector-btn danger" @click="$emit('deleteSelected')">{{ t('editor.batchDelete') }}</button>
  </div>
</template>

<script setup lang="ts">
/**
 * @file MultiSelectInspector.vue - 多选状态检查器
 */
import { useI18n } from '@/i18n'

defineProps<{
  selectedCount: number
}>()

defineEmits<{
  deleteSelected: []
}>()

const { t } = useI18n()
</script>
