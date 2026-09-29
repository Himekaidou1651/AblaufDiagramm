<template>
  <main
    ref="mirrorElement"
    class="canvas-mirror-area"
    :style="areaStyle"
    tabindex="-1"
  >
    <div
      class="canvas-layer"
      :style="{ transform: layerTransform }"
    >
      <div class="canvas-outside-bg" />
      <div
        class="canvas-rect"
        :style="canvasRectStyle"
      />
      <EdgeLayer />
      <NodeLayer />
      <SnapGuideLayer
        :snap-x="snapX"
        :snap-y="snapY"
        :snap-guides-x="snapGuidesX"
        :snap-guides-y="snapGuidesY"
        :zoom="effectiveZoom"
      />
    </div>

    <SelectionLayer
      :container-ref="mirrorElement"
      :interactive="false"
    />

    <div v-if="spaceHeld" class="space-hint">{{ t('editor.dragHint') }}</div>
  </main>
</template>

<script setup lang="ts">
/**
 * @file CanvasMirrorContent.vue - 克隆画布内容
 * @brief 复用同一套节点、连线、背景、辅助图案渲染幕后画布和调试缩略图。
 */
import { computed, ref } from 'vue'
import { useViewportStore } from '@/stores/viewportStore'
import { useCanvasStore } from '@/stores/canvasStore'
import { CanvasRectStyle } from '@/composables/CanvasRectStyle'
import { useI18n } from '@/i18n'
import type { SnapResult } from '@/utils/snap'
import EdgeLayer from '@/components/canvas/EdgeLayer.vue'
import NodeLayer from '@/components/canvas/NodeLayer.vue'
import SelectionLayer from '@/components/canvas/SelectionLayer.vue'
import SnapGuideLayer from '@/components/canvas/SnapGuideLayer.vue'

const props = defineProps<{
  width: number
  height: number
  spaceHeld: boolean
  snapX: SnapResult | null
  snapY: SnapResult | null
  snapGuidesX: SnapResult[]
  snapGuidesY: SnapResult[]
  mode?: 'viewport' | 'canvas'
}>()

const viewport = useViewportStore()
const canvas = useCanvasStore()
const { t } = useI18n()
const mirrorElement = ref<HTMLElement | null>(null)

const effectiveZoom = computed(() => props.mode === 'canvas' ? 1 : viewport.zoom)
const canvasRectStyle = CanvasRectStyle(effectiveZoom)

const areaStyle = computed(() => ({
  width: `${props.mode === 'canvas' ? canvas.width : props.width}px`,
  height: `${props.mode === 'canvas' ? canvas.height : props.height}px`,
}))

const layerTransform = computed(() => {
  if (props.mode === 'canvas') {
    return `translate(${-canvas.x}px, ${-canvas.y}px) scale(1)`
  }

  return viewport.canvasTransform
})

defineExpose({
  mirrorElement,
})
</script>

<style scoped>
.canvas-mirror-area {
  position: relative;
  overflow: hidden;
  background-color: var(--canvas-bg);
  outline: none;
}

.canvas-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 0;
  height: 0;
  transform-origin: 0 0;
}

.canvas-rect {
  position: absolute;
  background-color: var(--canvas-layer-bg);
  background-origin: border-box;
  border: 1px solid var(--canvas-layer-border);
  pointer-events: none;
}

.canvas-outside-bg {
  position: absolute;
  top: -50000px;
  left: -50000px;
  width: 100000px;
  height: 100000px;
  background: var(--canvas-outside-bg);
  z-index: -1;
  pointer-events: none;
}

.space-hint {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 8px 20px;
  background: var(--space-hint-bg);
  border: 1px solid var(--border-light);
  border-radius: 8px;
  color: var(--text-dim);
  font-size: 14px;
  pointer-events: none;
  z-index: 100;
}
</style>
