<template>
  <Transition name="startup-splash" appear>
    <StartupSplash
      v-if="showStartupSplash && !hasError"
      @skip="hideStartupSplash"
    />
  </Transition>

  <RouterView v-if="!hasError" />
  <div v-else class="global-error">
    <div class="error-card">
      <h1>⚠️ {{ t('error.title') }}</h1>
      <p>{{ t('error.message') }}</p>
      <pre class="error-detail">{{ errorMessage }}</pre>
      <button class="error-btn" @click="reload">{{ t('error.reload') }}</button>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * @file App.vue - 应用根组件
 * @brief 路由视图容器，提供全局错误捕获回退界面与网页开屏动画。
 *        初始化 settingsStore 和 themeStore，定义暗色/亮色主题 CSS 变量。
 * @author 自动生成
 * @date 2026-07-31
 */
import { ref, watch, onBeforeUnmount, onErrorCaptured } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { useSettingsStore } from '@/stores/settingsStore'
import { useThemeStore } from '@/stores/themeStore'
import { t as i18nT } from '@/i18n'
import StartupSplash from '@/components/home/StartupSplash.vue'

/** 是否发生全局错误 */
const hasError = ref(false)
/** 错误消息内容 */
const errorMessage = ref('')
/** 网页开屏是否显示 */
const showStartupSplash = ref(false)
/** 是否已经播放过开屏 */
const hasPlayedStartupSplash = ref(false)
/** 开屏定时器句柄 */
let startupSplashTimer: number | null = null
/** 当前路由 */
const route = useRoute()

/** 开屏显示时长 */
const STARTUP_SPLASH_DURATION = 1000

// 组件级错误捕获
onErrorCaptured((err: unknown, _instance, info: string) => {
  console.error('[App Error]', err)
  console.error('[App Error Info]', info)
  hasError.value = true
  errorMessage.value = err instanceof Error ? err.message : String(err)
  hideStartupSplash()
  // 返回 false 阻止错误继续向上传播
  return false
})

/**
 * @brief 重新加载（清除错误状态）
 */
function reload() {
  hasError.value = false
  errorMessage.value = ''
}

/**
 * @brief 清理开屏计时器。
 */
function clearStartupSplashTimer() {
  if (startupSplashTimer !== null) {
    window.clearTimeout(startupSplashTimer)
    startupSplashTimer = null
  }
}

/**
 * @brief 关闭网页开屏动画。
 */
function hideStartupSplash() {
  clearStartupSplashTimer()
  showStartupSplash.value = false
}

/**
 * @brief 启动网页开屏动画。
 */
function startStartupSplash() {
  clearStartupSplashTimer()
  showStartupSplash.value = true
  startupSplashTimer = window.setTimeout(() => {
    showStartupSplash.value = false
    startupSplashTimer = null
  }, STARTUP_SPLASH_DURATION)
}

/**
 * @brief 翻译函数：优先使用 i18n 模块，失败时回退到硬编码映射
 * @description 如果 i18n 模块尚未初始化或抛出异常，使用内置 fallback。
 *              内置 fallback 的翻译与 i18n/zh.ts、i18n/en.ts 保持一致。
 * @param key - 翻译键
 * @returns 翻译文本
 */
function t(key: string): string {
  try {
    const result = i18nT(key)
    // 如果 i18n 返回了 key 本身（未找到翻译），使用 fallback
    if (result !== key) return result
  } catch { /* i18n 不可用时静默回退 */ }

  // Fallback: i18n 不可用或翻译缺失时的硬编码映射
  const isEn = document.documentElement.lang === 'en'
  const map: Record<string, string> = isEn
    ? {
        'error.title': 'Error',
        'error.message': 'An unexpected error occurred. Please try reloading.',
        'error.reload': 'Reload',
      }
    : {
        'error.title': '发生错误',
        'error.message': '应用遇到意外错误，请尝试重新加载。',
        'error.reload': '重新加载',
      }
  return map[key] || key
}

// settingsStore 初始化时会从 localStorage 读取主题并同步到 themeStore
useSettingsStore()
// themeStore 确保响应式生效
useThemeStore()

/**
 * @brief 仅在首页首次进入时播放开屏动画。
 */
watch(
  () => route.name,
  (name) => {
    if (!hasPlayedStartupSplash.value && name === 'home') {
      hasPlayedStartupSplash.value = true
      startStartupSplash()
    }
  },
  { immediate: true }
)

/**
 * @brief 卸载时清理开屏计时器。
 */
onBeforeUnmount(() => {
  clearStartupSplashTimer()
})
</script>

<style>
/* ===== CSS 自定义属性：夜间模式（默认） ===== */
:root,
[data-theme="dark"] {
  --font-ui: "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", "Helvetica Neue", Arial, sans-serif;
  --font-serif: "Times New Roman", "SimSun", "宋体", "Songti SC", "STSong", "Batang", "AppleMyungjo", "UnBatang", "Segoe UI", "Noto Sans", "Noto Sans Cuneiform", serif;
  --font-mono: "Cascadia Code", "Fira Code", "JetBrains Mono", "Consolas", "Noto Sans Mono SC", "Noto Sans Mono", monospace;
  --bg-body: #1e1e2e;
  --bg-panel: #181825;
  --bg-element: #313244;
  --bg-element-hover: #45475a;
  --bg-input: #1e1e2e;
  --border-default: #313244;
  --border-light: #45475a;
  --text-body: #cdd6f4;
  --text-dim: #a6adc8;
  --text-muted: #6c7086;
  --text-subtle: #585b70;
  --accent-blue: #89b4fa;
  --accent-purple: #cba6f7;
  --accent-green: #a6e3a1;
  --accent-green-hover: #94d89a;
  --accent-orange: #fab387;
  --accent-yellow: #f9e2af;
  --danger: #e64553;
  --canvas-bg: #1e1e2e;
  --grid-line: #45475a;
  --shadow-selected: rgba(137, 180, 250, 0.25);
  --shadow-focus: rgba(137, 180, 250, 0.15);
  --shadow-selected-edge: rgba(137, 180, 250, 0.5);
  --selection-overlay: rgba(137, 180, 250, 0.06);
  --scrollbar-track: rgba(0, 0, 0, 0.15);
  --scrollbar-thumb: rgba(205, 214, 244, 0.3);
  --scrollbar-thumb-hover: rgba(205, 214, 244, 0.55);
  --minimap-bg: #181825;
  --minimap-edge-spouse: rgba(166, 227, 161, 0.4);
  --minimap-edge-parent: rgba(69, 71, 90, 0.5);
  --minimap-viewport-fill: rgba(137, 180, 250, 0.15);
  --handle-bg: #313244;
  --handle-border: #45475a;
  --handle-active: #45475a;
  --handle-active-border: #6c7086;
  --node-border: #313244;
  --node-border-hover: #585b70;
  --node-text-light-bg: #1e1e2e;
  --node-text-dark-bg: #cdd6f4;
  --space-hint-bg: rgba(24, 24, 37, 0.92);
  --export-node-bg: #313244;
  --export-node-border: #45475a;
  --btn-accent-text: #1e1e2e;
  --handle-plus-color: #1e1e2e;
  --canvas-outside-bg: #14141e;
  --canvas-layer-bg: #1e1e2e;
  --canvas-layer-border: rgba(255, 255, 255, 0.06);
  --home-bg-overlay: linear-gradient(rgba(12, 10, 8, 0.28), rgba(12, 10, 8, 0.48));
  --home-menu-bg: rgba(24, 24, 37, 0.72);
  --home-menu-bg-hover: rgba(49, 50, 68, 0.84);
  --home-menu-border: rgba(255, 255, 255, 0.28);
  --home-menu-border-hover: rgba(255, 255, 255, 0.42);
  --home-menu-text: #f8f5e9;
  --home-menu-desc: rgba(248, 245, 233, 0.72);
  --home-menu-primary-bg: rgba(80, 48, 104, 0.72);
  --home-menu-primary-bg-hover: rgba(96, 58, 124, 0.86);
  --home-menu-primary-border: rgba(203, 166, 247, 0.72);
  --home-menu-primary-border-hover: rgba(203, 166, 247, 0.92);
  --splash-bg-start: #2d1b4e;
  --splash-bg-end: #1a1a2e;
  --splash-text: #ffffff;
  --splash-text-dim: rgba(255, 255, 255, 0.6);
  --splash-glow: rgba(255, 255, 255, 0.08);
}

/* ===== CSS 自定义属性：白天模式 ===== */
[data-theme="light"] {
  --bg-body: #ffffff;
  --bg-panel: #f8f9fa;
  --bg-element: #e9ecef;
  --bg-element-hover: #dee2e6;
  --bg-input: #ffffff;
  --border-default: #dee2e6;
  --border-light: #ced4da;
  --text-body: #212529;
  --text-dim: #495057;
  --text-muted: #6c757d;
  --text-subtle: #adb5bd;
  --accent-blue: #3b82f6;
  --accent-purple: #8b5cf6;
  --accent-green: #22c55e;
  --accent-green-hover: #16a34a;
  --accent-orange: #f97316;
  --accent-yellow: #eab308;
  --danger: #ef4444;
  --canvas-bg: #ffffff;
  --grid-line: #dee2e6;
  --shadow-selected: rgba(59, 130, 246, 0.25);
  --shadow-focus: rgba(59, 130, 246, 0.15);
  --shadow-selected-edge: rgba(59, 130, 246, 0.5);
  --selection-overlay: rgba(59, 130, 246, 0.06);
  --scrollbar-track: rgba(0, 0, 0, 0.08);
  --scrollbar-thumb: rgba(0, 0, 0, 0.15);
  --scrollbar-thumb-hover: rgba(0, 0, 0, 0.3);
  --minimap-bg: #f8f9fa;
  --minimap-edge-spouse: rgba(34, 197, 94, 0.3);
  --minimap-edge-parent: rgba(0, 0, 0, 0.1);
  --minimap-viewport-fill: rgba(59, 130, 246, 0.1);
  --handle-bg: #e9ecef;
  --handle-border: #ced4da;
  --handle-active: #dee2e6;
  --handle-active-border: #adb5bd;
  --node-border: #dee2e6;
  --node-border-hover: #adb5bd;
  --node-text-light-bg: #1e1e2e;
  --node-text-dark-bg: #ffffff;
  --space-hint-bg: rgba(248, 249, 250, 0.95);
  --export-node-bg: #ffffff;
  --export-node-border: #dee2e6;
  --btn-accent-text: #ffffff;

  --handle-plus-color: #ffffff;
  --canvas-outside-bg: #ececec;
  --canvas-layer-bg: #ffffff;
  --canvas-layer-border: rgba(0, 0, 0, 0.08);
  --home-bg-overlay: linear-gradient(rgba(255, 250, 235, 0.18), rgba(255, 250, 235, 0.34));
  --home-menu-bg: rgba(255, 255, 255, 0.72);
  --home-menu-bg-hover: rgba(255, 255, 255, 0.88);
  --home-menu-border: rgba(33, 37, 41, 0.18);
  --home-menu-border-hover: rgba(33, 37, 41, 0.32);
  --home-menu-text: #212529;
  --home-menu-desc: rgba(33, 37, 41, 0.62);
  --home-menu-primary-bg: rgba(139, 92, 246, 0.16);
  --home-menu-primary-bg-hover: rgba(139, 92, 246, 0.26);
  --home-menu-primary-border: rgba(139, 92, 246, 0.58);
  --home-menu-primary-border-hover: rgba(139, 92, 246, 0.78);
  --splash-bg-start: #667eea;
  --splash-bg-end: #764ba2;
  --splash-text: #ffffff;
  --splash-text-dim: rgba(255, 255, 255, 0.7);
  --splash-glow: rgba(255, 255, 255, 0.12);
}

/* ===== 全局重置 ===== */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #app {
  width: 100%;
  height: 100%;
  overflow: hidden;
  font-family: var(--font-ui);
}

/* ===== 全局错误兜底 ===== */
.global-error {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: var(--bg-body);
}

.error-card {
  text-align: center;
  padding: 40px;
  max-width: 500px;
}

.error-card h1 {
  font-size: 1.5rem;
  color: var(--danger);
  margin-bottom: 12px;
}

.error-card p {
  color: var(--text-dim);
  margin-bottom: 16px;
}

.error-detail {
  background: var(--bg-element);
  color: var(--text-muted);
  padding: 12px;
  border-radius: 6px;
  font-size: 0.8rem;
  margin-bottom: 20px;
  word-break: break-all;
  white-space: pre-wrap;
}

.error-btn {
  padding: 8px 24px;
  background: var(--accent-blue);
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-family: var(--font-serif);
}

.error-btn:hover {
  opacity: 0.85;
}

.startup-splash-enter-active,
.startup-splash-leave-active {
  transition: opacity 300ms ease;
}

.startup-splash-enter-from,
.startup-splash-leave-to {
  opacity: 0;
}
</style>
