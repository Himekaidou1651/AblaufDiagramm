<template>
  <Teleport to="body">
    <div v-if="visible" class="canvas-resize-overlay" @click.self="close">
      <div class="canvas-resize-panel" :style="panelStyle">
        <div class="panel-header">
          <span class="panel-title">{{ t('canvas.resizeTitle') }}</span>
          <button class="panel-close" @click="close">✕</button>
        </div>

        <!-- 上方向 -->
        <div class="direction-row">
          <button class="dir-btn" @click="shrink('top')" :title="t('canvas.shrinkUp')">−</button>
          <span class="dir-label">{{ t('canvas.expandUp') }}</span>
          <button class="dir-btn" @click="expand('top')" :title="t('canvas.expandUp')">+</button>
        </div>

        <!-- 中间行：左 + 尺寸 + 右 -->
        <div class="direction-row middle-row">
          <div class="side-group">
            <button class="dir-btn" @click="shrink('left')" :title="t('canvas.shrinkLeft')">−</button>
            <span class="dir-label">{{ t('canvas.expandLeft') }}</span>
            <button class="dir-btn" @click="expand('left')" :title="t('canvas.expandLeft')">+</button>
          </div>
          <span class="size-display">{{ canvas.sizeLabel }}</span>
          <div class="side-group">
            <button class="dir-btn" @click="shrink('right')" :title="t('canvas.shrinkRight')">−</button>
            <span class="dir-label">{{ t('canvas.expandRight') }}</span>
            <button class="dir-btn" @click="expand('right')" :title="t('canvas.expandRight')">+</button>
          </div>
        </div>

        <!-- 下方向 -->
        <div class="direction-row">
          <button class="dir-btn" @click="shrink('bottom')" :title="t('canvas.shrinkDown')">−</button>
          <span class="dir-label">{{ t('canvas.expandDown') }}</span>
          <button class="dir-btn" @click="expand('bottom')" :title="t('canvas.expandDown')">+</button>
        </div>

        <!-- 底部选项 -->
        <div class="panel-footer">
          <div class="step-row">
            <span>{{ t('canvas.stepSize') }}:</span>
            <button class="step-btn" @click="adjustStep(-10)">−</button>
            <span class="step-value">{{ stepSize }}</span>
            <button class="step-btn" @click="adjustStep(10)">+</button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
/**
 * @file CanvasResizePanel.vue - 画布尺寸调整面板
 * @brief 弹出式面板，提供四方向伸展/收缩、步长调节、对侧补偿、收缩到节点等功能。
 * @author 自动生成
 * @date 2026-08-04
 */
import { ref, computed } from 'vue'
import { useCanvasStore, type ExpandDirection } from '@/stores/canvasStore'
import { useNodeStore } from '@/stores/nodeStore'
import { useI18n } from '@/i18n'

const props = defineProps<{
  visible: boolean
  anchorEl: HTMLElement | null
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

const canvas = useCanvasStore()
const nodeStore = useNodeStore()
const { t } = useI18n()

// ===== 局部状态 =====
const stepSize = ref(100)

// ===== 面板定位 =====
const panelStyle = computed(() => {
  if (!props.anchorEl) return {}
  const rect = props.anchorEl.getBoundingClientRect()
  return {
    position: 'fixed' as const,
    top: `${rect.bottom + 6}px`,
    left: `${Math.max(0, rect.right - 280)}px`,
  }
})

// ===== 动作 =====
function close() {
  emit('update:visible', false)
}

function expand(dir: ExpandDirection) {
  canvas.expand(dir, stepSize.value)
  nodeStore.clampAllNodesToCanvas()
}

function shrink(dir: ExpandDirection) {
  canvas.shrink(dir, stepSize.value)
  nodeStore.clampAllNodesToCanvas()
}

function adjustStep(delta: number) {
  stepSize.value = Math.max(10, stepSize.value + delta)
}
</script>

<style scoped>
.canvas-resize-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
}

.canvas-resize-panel {
  position: fixed;
  width: 340px;
  background: var(--bg-panel);
  border: 1px solid var(--border-default);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  padding: 12px;
  font-family: var(--font-serif);
  color: var(--text-body);
  font-size: 12px;
  user-select: none;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.panel-title {
  font-weight: 700;
  font-size: 13px;
  color: var(--accent-purple);
}

.panel-close {
  background: none;
  border: none;
  color: var(--text-dim);
  font-size: 14px;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 3px;
}

.panel-close:hover {
  background: var(--bg-element);
  color: var(--text-body);
}

/* 方向行 */
.direction-row {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}

.middle-row {
  justify-content: space-evenly;
}

.side-group {
  display: flex;
  align-items: center;
  gap: 4px;
}

.dir-label {
  color: var(--text-dim);
  font-size: 11px;
  min-width: 40px;
  text-align: center;
}

.dir-btn {
  width: 24px;
  height: 24px;
  border: 1px solid var(--border-light);
  border-radius: 4px;
  background: var(--bg-element);
  color: var(--text-body);
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: background 0.15s;
}

.dir-btn:hover {
  background: var(--accent-blue);
  border-color: var(--accent-blue);
  color: #fff;
}

.size-display {
  font-size: 16px;
  font-weight: 700;
  color: var(--accent-green);
  padding: 4px 12px;
  border: 1px solid var(--border-light);
  border-radius: 4px;
  background: var(--bg-element);
}

/* 底部 */
.panel-footer {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px solid var(--border-light);
}

.checkbox-row input {
  cursor: pointer;
}

.step-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--text-dim);
}

.step-btn {
  width: 22px;
  height: 22px;
  border: 1px solid var(--border-light);
  border-radius: 3px;
  background: var(--bg-element);
  color: var(--text-body);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.step-btn:hover {
  background: var(--bg-element-hover);
}

.step-value {
  font-weight: 700;
  color: var(--text-body);
  min-width: 32px;
  text-align: center;
}

</style>
