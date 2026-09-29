<template>
  <Teleport to="body">
    <div v-if="visible" class="zoom-overlay" @click.self="close">
      <div class="zoom-panel" :style="panelStyle">
        <div class="panel-header">
          <span class="panel-title">{{ t('editor.zoom') }}</span>
          <button class="panel-close" @click="close">✕</button>
        </div>
        <div class="zoom-controls">
          <button
            class="zoom-btn"
            :disabled="viewport.zoom <= MIN_ZOOM"
            @click="viewport.zoomOut()"
            :title="t('editor.zoomOut')"
          >−</button>
          <input
            type="range"
            class="zoom-slider"
            :min="MIN_ZOOM"
            :max="MAX_ZOOM"
            :step="0.01"
            :value="viewport.zoom"
            @input="onSlider"
          />
          <button
            class="zoom-btn"
            :disabled="viewport.zoom >= MAX_ZOOM"
            @click="viewport.zoomIn()"
            :title="t('editor.zoomIn')"
          >+</button>
        </div>
        <div class="zoom-input-wrapper">
          <input
            ref="zoomInputRef"
            class="zoom-input"
            :value="Math.round(viewport.zoom * 100)"
            @input="onInputChange"
            @keydown.enter="onInputCommit"
            @blur="onInputCommit"
            @focus="onInputFocus"
          /><span class="zoom-percent">%</span>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
/**
 * @file ZoomPanel.vue - 缩放比例弹出面板
 * @brief 点击工具栏缩放按钮后弹出，提供 +/- 按钮和滑动条来调整画布缩放比例。
 * @author 自动生成
 * @date 2026-08-05
 */
import { computed, ref, nextTick } from 'vue'
import { useViewportStore } from '@/stores/viewportStore'
import { useI18n } from '@/i18n'
import { MIN_ZOOM, MAX_ZOOM } from '@/constants/constant'

const props = defineProps<{
  visible: boolean
  anchorEl: HTMLElement | null
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

const viewport = useViewportStore()
const { t } = useI18n()

// ===== 面板定位 =====
const panelStyle = computed(() => {
  if (!props.anchorEl) return {}
  const rect = props.anchorEl.getBoundingClientRect()
  return {
    position: 'fixed' as const,
    top: `${rect.bottom + 6}px`,
    left: `${Math.max(0, rect.right - 200)}px`,
  }
})

// ===== 动作 =====
function close() {
  emit('update:visible', false)
}

function onSlider(event: Event) {
  const value = parseFloat((event.target as HTMLInputElement).value)
  viewport.setZoom(value)
}

// ===== 百分比输入 =====
const zoomInputRef = ref<HTMLInputElement | null>(null)
/** 输入框当前展示的字符串（允许用户在输入过程中清空或输入中间值） */
const inputText = ref('')

function onInputFocus() {
  inputText.value = String(Math.round(viewport.zoom * 100))
  nextTick(() => zoomInputRef.value?.select())
}

function onInputChange(event: Event) {
  inputText.value = (event.target as HTMLInputElement).value
}

function onInputCommit() {
  const val = parseInt(inputText.value, 10)
  if (isNaN(val) || val <= 0) {
    // 无效输入：恢复到当前实际缩放值
    inputText.value = String(Math.round(viewport.zoom * 100))
    return
  }
  const clamped = Math.max(MIN_ZOOM * 100, Math.min(MAX_ZOOM * 100, val))
  viewport.setZoom(clamped / 100)
  inputText.value = String(Math.round(viewport.zoom * 100))
}
</script>

<style scoped>
.zoom-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
}

.zoom-panel {
  position: fixed;
  width: 240px;
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

.zoom-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.zoom-btn {
  width: 28px;
  height: 28px;
  border: 1px solid var(--border-light);
  border-radius: 4px;
  background: var(--bg-element);
  color: var(--text-body);
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: background 0.15s;
  flex-shrink: 0;
}

.zoom-btn:hover:not(:disabled) {
  background: var(--bg-element-hover);
}

.zoom-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.zoom-slider {
  flex: 1;
  height: 4px;
  accent-color: var(--accent-green);
  cursor: pointer;
}

.zoom-input-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
}

.zoom-input {
  width: 56px;
  text-align: center;
  font-size: 18px;
  font-weight: 700;
  font-family: var(--font-serif);
  color: var(--accent-green);
  background: var(--bg-element);
  border: 1px solid var(--border-light);
  border-radius: 4px;
  padding: 2px 4px;
  outline: none;
  transition: border-color 0.15s;
}

.zoom-input:focus {
  border-color: var(--accent-green);
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
}

.zoom-percent {
  font-size: 18px;
  font-weight: 700;
  color: var(--accent-green);
}
</style>
