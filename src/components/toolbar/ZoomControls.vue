<template>
  <div class="zoom-strip">
    <button
      class="icon-btn zoom-step-btn"
      type="button"
      :disabled="viewport.zoom <= MIN_ZOOM"
      :title="t('editor.zoomOut')"
      @click="viewport.zoomOut()"
    >
      −
    </button>
    <button
      class="zoom-trigger-btn"
      ref="zoomBtnRef"
      type="button"
      @click="$emit('toggleZoom')"
      :title="t('editor.zoom')"
    >
      {{ Math.round(viewport.zoom * 100) }}%
    </button>
    <button
      class="icon-btn zoom-step-btn"
      type="button"
      :disabled="viewport.zoom >= MAX_ZOOM"
      :title="t('editor.zoomIn')"
      @click="viewport.zoomIn()"
    >
      +
    </button>
  </div>
</template>

<script setup lang="ts">
/**
 * @file ZoomControls.vue - 工具栏缩放控件
 */
import { ref } from 'vue'
import { MAX_ZOOM, MIN_ZOOM } from '@/constants/constant'
import { useI18n } from '@/i18n'
import { useViewportStore } from '@/stores/viewportStore'

defineEmits<{
  toggleZoom: []
}>()

const { t } = useI18n()
const viewport = useViewportStore()
const zoomBtnRef = ref<HTMLElement | null>(null)

defineExpose({ zoomBtnRef })
</script>
