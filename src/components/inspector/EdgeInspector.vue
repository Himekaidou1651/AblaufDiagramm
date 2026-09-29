<template>
  <div class="inspector-field">
    <label>{{ t('editor.edge.relationType') }}</label>
    <select
      class="inspector-select"
      :value="edge.type"
      @change="$emit('edgeTypeChange', ($event.target as HTMLSelectElement).value)"
    >
      <option value="parent">{{ t('editor.parentChild') }}</option>
      <option value="spouse">{{ t('editor.spouse') }}</option>
    </select>
  </div>
  <div class="inspector-field">
    <label>{{ t('editor.edge.source') }}</label>
    <div class="field-value">{{ sourceName }}</div>
  </div>
  <div v-if="developerMode" class="inspector-field">
    <label>{{ t('editor.edge.sourceId') }}</label>
    <div class="field-value mono" style="font-size:10px">{{ sourceId }}</div>
  </div>
  <div class="inspector-field">
    <label>{{ t('editor.edge.target') }}</label>
    <div class="field-value">{{ targetName }}</div>
  </div>
  <div v-if="developerMode" class="inspector-field">
    <label>{{ t('editor.edge.targetId') }}</label>
    <div class="field-value mono" style="font-size:10px">{{ targetId }}</div>
  </div>
  <div v-if="developerMode" class="inspector-field">
    <label>{{ t('editor.edge.id') }}</label>
    <div class="field-value mono" style="font-size:10px">{{ edge.id }}</div>
  </div>
  <div class="inspector-actions">
    <button class="inspector-btn danger" @click="$emit('deleteEdge')">{{ t('editor.deleteEdge') }}</button>
  </div>
</template>

<script setup lang="ts">
/**
 * @file EdgeInspector.vue - 单边属性检查器
 */
import { useI18n } from '@/i18n'
import type { GenealogyEdge } from '@/types'

defineProps<{
  edge: GenealogyEdge
  developerMode: boolean
  sourceName: string
  sourceId: string
  targetName: string
  targetId: string
}>()

defineEmits<{
  deleteEdge: []
  edgeTypeChange: [value: string]
}>()

const { t } = useI18n()
</script>
