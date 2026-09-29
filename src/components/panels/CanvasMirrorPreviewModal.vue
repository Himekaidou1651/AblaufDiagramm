<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="modal-overlay"
      @click.self="close"
      @keydown.escape="close"
    >
      <div class="modal-panel mirror-preview-modal">
        <div class="modal-header">
          <h2 class="modal-title">{{ t('mirrorPreview.title') }}</h2>
          <button class="modal-close" @click="close">×</button>
        </div>

        <div ref="viewportRef" class="mirror-preview-viewport">
          <div
            class="mirror-preview-stage"
            :style="stageStyle"
          >
            <CanvasMirrorContent
              :width="canvas.width"
              :height="canvas.height"
              :space-held="spaceHeld"
              :snap-x="snapX"
              :snap-y="snapY"
              :snap-guides-x="snapGuidesX"
              :snap-guides-y="snapGuidesY"
              mode="canvas"
            />
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
/**
 * @file CanvasMirrorPreviewModal.vue - 克隆画布预览弹窗
 * @brief 调试者模式下以缩略图展示幕后克隆画布的当前图案。
 */
import { computed, nextTick, onUnmounted, ref, watch } from 'vue'
import CanvasMirrorContent from '@/components/canvas/CanvasMirrorContent.vue'
import { useCanvasStore } from '@/stores/canvasStore'
import { useI18n } from '@/i18n'
import type { SnapResult } from '@/utils/snap'

const props = defineProps<{
  modelValue: boolean
  spaceHeld: boolean
  snapX: SnapResult | null
  snapY: SnapResult | null
  snapGuidesX: SnapResult[]
  snapGuidesY: SnapResult[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const { t } = useI18n()
const canvas = useCanvasStore()
const viewportRef = ref<HTMLElement | null>(null)
const previewSize = ref({ width: 0, height: 0 })
let resizeObserver: ResizeObserver | null = null

const scale = computed(() => {
  if (canvas.width <= 0 || canvas.height <= 0 || previewSize.value.width <= 0 || previewSize.value.height <= 0) {
    return 1
  }

  return Math.min(
    previewSize.value.width / canvas.width,
    previewSize.value.height / canvas.height
  )
})

const stageStyle = computed(() => ({
  width: `${canvas.width}px`,
  height: `${canvas.height}px`,
  left: `${(previewSize.value.width - canvas.width * scale.value) / 2}px`,
  top: `${(previewSize.value.height - canvas.height * scale.value) / 2}px`,
  transform: `scale(${scale.value})`,
}))

function updatePreviewSize() {
  const el = viewportRef.value
  if (!el) return
  previewSize.value = {
    width: el.clientWidth,
    height: el.clientHeight,
  }
}

watch(
  () => props.modelValue,
  async (visible) => {
    if (!visible) {
      resizeObserver?.disconnect()
      resizeObserver = null
      return
    }

    await nextTick()
    updatePreviewSize()
    if (viewportRef.value) {
      resizeObserver?.disconnect()
      resizeObserver = new ResizeObserver(updatePreviewSize)
      resizeObserver.observe(viewportRef.value)
    }
  },
  { immediate: true }
)

onUnmounted(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
})

function close() {
  emit('update:modelValue', false)
}
</script>

<style scoped>
.mirror-preview-modal {
  width: min(1120px, 94vw);
  height: min(760px, 88vh);
}

.mirror-preview-viewport {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  border: 1px solid var(--border-default);
  background: var(--canvas-bg);
}

.mirror-preview-stage {
  position: absolute;
  overflow: hidden;
  pointer-events: none;
  transform-origin: 0 0;
}
</style>
