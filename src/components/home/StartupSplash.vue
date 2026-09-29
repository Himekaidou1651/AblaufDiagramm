<template>
  <div
    class="startup-splash"
    role="button"
    tabindex="0"
    :aria-label="t('home.splashSkip')"
    @click="emit('skip')"
    @keydown.enter.prevent="emit('skip')"
    @keydown.space.prevent="emit('skip')"
  >
    <div class="splash-glow"></div>
    <div class="splash-content">
      <div class="splash-mark">{{ t('home.title') }}</div>
      <div class="splash-spinner"></div>
      <div class="splash-text">{{ t('home.splashLoading') }}</div>
      <div class="splash-progress" aria-hidden="true">
        <span class="splash-progress-bar"></span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * @file StartupSplash.vue
 * @brief 网页开屏动画组件，展示首屏过渡并支持点击跳过。
 * @author 项目维护者
 * @date 2026-08-26
 */

import { useI18n } from '@/i18n'

const emit = defineEmits<{
  skip: []
}>()

const { t } = useI18n()
</script>

<style scoped>
.startup-splash {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: linear-gradient(135deg, var(--splash-bg-start), var(--splash-bg-end));
  overflow: hidden;
}

.splash-glow {
  position: absolute;
  width: 300px;
  height: 300px;
  border-radius: 50%;
  background: var(--splash-glow);
  filter: blur(80px);
  animation: glow-float 2.8s ease-in-out infinite;
}

.splash-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32px;
  color: var(--splash-text);
}

.splash-mark {
  font-family: var(--font-serif);
  font-size: 2.2rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  animation: mark-rise 1s ease both;
}

.splash-spinner {
  width: 54px;
  height: 54px;
  border-radius: 50%;
  border: 3px solid rgba(255, 255, 255, 0.18);
  border-top-color: rgba(255, 255, 255, 0.9);
  animation: spin 1s linear infinite;
}

.splash-text {
  font-family: var(--font-ui);
  font-size: 14px;
  letter-spacing: 2px;
  color: var(--splash-text-dim);
  animation: text-fade 1s ease 400ms both;
}

.splash-progress {
  width: 160px;
  height: 3px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.14);
}

.splash-progress-bar {
  display: block;
  width: 40%;
  height: 100%;
  border-radius: inherit;
  background: rgba(255, 255, 255, 0.85);
  animation: progress-move 1s ease-in-out infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes glow-float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-14px);
  }
}

@keyframes mark-rise {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes text-fade {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes progress-move {
  0% {
    transform: translateX(-120%);
  }
  100% {
    transform: translateX(280%);
  }
}
</style>
