/**
 * @file themeStore.ts - 主题状态管理
 * @brief 管理应用的暗色/亮色主题模式。通过设置 document 的 data-theme 属性切换主题。
 *        不做持久化，持久化由 settingsStore 负责。
 * @author 自动生成
 * @date 2026-07-31
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export type ThemeMode = 'dark' | 'light'

export const useThemeStore = defineStore('theme', () => {
  // ===== 状态：初始 'dark'，由 settingsStore 在初始化时覆盖为正确值 =====
  /** 当前主题模式 */
  const mode = ref<ThemeMode>('dark')

  // ===== 计算属性 =====
  /** 是否为暗色主题 */
  const isDark = computed(() => mode.value === 'dark')
  /** 是否为亮色主题 */
  const isLight = computed(() => mode.value === 'light')

  // ===== 动作 =====

  /**
   * @brief 仅应用主题（设置 mode + DOM 属性），不涉及持久化
   * @description 供 settingsStore 初始化/变更时调用，避免循环回写。
   * @param theme - 主题模式：'dark' 或 'light'
   */
  function applyTheme(theme: ThemeMode) {
    mode.value = theme
    document.documentElement.setAttribute('data-theme', theme)
  }

  /**
   * @brief 切换主题（UI 按钮调用）
   */
  function toggle() {
    const next: ThemeMode = mode.value === 'dark' ? 'light' : 'dark'
    applyTheme(next)
  }

  /**
   * @brief 设置主题（UI 调用）
   * @param theme - 目标主题模式
   */
  function setTheme(theme: ThemeMode) {
    applyTheme(theme)
  }

  return { mode, isDark, isLight, toggle, setTheme, applyTheme }
})
