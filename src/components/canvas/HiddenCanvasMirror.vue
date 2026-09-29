<template>
  <div
    class="hidden-canvas-mirror-host"
    :style="hostStyle"
    aria-hidden="true"
  >
    <CanvasMirrorContent
      ref="contentRef"
      :width="width"
      :height="height"
      :space-held="spaceHeld"
      :snap-x="snapX"
      :snap-y="snapY"
      :snap-guides-x="snapGuidesX"
      :snap-guides-y="snapGuidesY"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * @file HiddenCanvasMirror.vue - 幕后克隆画布
 * @brief 在屏幕外维护一份与真实画布图案一致的隐藏画布镜像。
 */
import { computed, ref } from 'vue'
import type { SnapResult } from '@/utils/snap'
import CanvasMirrorContent from '@/components/canvas/CanvasMirrorContent.vue'

const props = defineProps<{
  width: number
  height: number
  spaceHeld: boolean
  snapX: SnapResult | null
  snapY: SnapResult | null
  snapGuidesX: SnapResult[]
  snapGuidesY: SnapResult[]
}>()

const contentRef = ref<InstanceType<typeof CanvasMirrorContent> | null>(null)

const hostStyle = computed(() => ({
  width: `${props.width}px`,
  height: `${props.height}px`,
}))

defineExpose({
  mirrorElement: computed(() => contentRef.value?.mirrorElement ?? null),
})
</script>

<style scoped>
.hidden-canvas-mirror-host {
  position: fixed;
  left: -100000px;
  top: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: -1;
}
</style>
