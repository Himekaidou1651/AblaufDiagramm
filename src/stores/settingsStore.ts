/**
 * @file settingsStore.ts - 应用设置状态管理
 * @brief 管理应用的全局设置（主题、语言、网格显示、默认节点颜色等），
 *        并持久化到 localStorage。主题变更自动同步到 themeStore。
 * @author 自动生成
 * @date 2026-07-31
 */
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { useThemeStore } from './themeStore'
import type { ThemeMode } from './themeStore'
import type { LocaleCode } from '@/i18n/types'
import {
  STORAGE_KEY_SETTINGS,
  DEFAULT_NODE_COLOR,
  PANEL_LEFT_DEFAULT_WIDTH,
  PANEL_RIGHT_DEFAULT_WIDTH,
} from '@/constants/constant'

/** 应用设置接口 */
export interface SettingsState {
  theme: ThemeMode
  language: LocaleCode
  showGrid: boolean
  /** 是否启用吸附对齐（同时控制网格吸附 + 块间对齐） */
  snapEnabled: boolean
  defaultNodeColor: string
  unsavedPrompt: boolean
  developerMode: boolean
  leftPanelWidth: number
  rightPanelWidth: number
}

const STORAGE_KEY = STORAGE_KEY_SETTINGS

/**
 * @brief 从 localStorage 加载设置
 * @returns 设置对象，加载失败时返回默认值
 */
function loadSettings(): SettingsState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      const language: LocaleCode = ['zh', 'en', 'fr', 'de', 'ja', 'ru', 'es', 'ar'].includes(parsed.language)
        ? parsed.language
        : 'zh'
      return {
        theme: parsed.theme === 'light' ? 'light' : 'dark',
        language,
        showGrid: parsed.showGrid ?? true,
        snapEnabled: parsed.snapEnabled ?? true,

        defaultNodeColor: parsed.defaultNodeColor ?? DEFAULT_NODE_COLOR,
        unsavedPrompt: parsed.unsavedPrompt ?? false,
        developerMode: parsed.developerMode ?? true,
        leftPanelWidth: parsed.leftPanelWidth ?? PANEL_LEFT_DEFAULT_WIDTH,
        rightPanelWidth: parsed.rightPanelWidth ?? PANEL_RIGHT_DEFAULT_WIDTH,
      }
    }
  } catch { /* ignore */ }
  return {
    theme: 'dark',
    language: 'zh',
    showGrid: true,
    snapEnabled: true,
    defaultNodeColor: DEFAULT_NODE_COLOR,
    unsavedPrompt: false,
    developerMode: true,
    leftPanelWidth: PANEL_LEFT_DEFAULT_WIDTH,
    rightPanelWidth: PANEL_RIGHT_DEFAULT_WIDTH,
  }
}

export const useSettingsStore = defineStore('settings', () => {
  const defaults = loadSettings()
  /** 主题模式 */
  const theme = ref<ThemeMode>(defaults.theme)
  /** 界面语言 */
  const language = ref<LocaleCode>(defaults.language)
  /** 是否显示网格 */
  const showGrid = ref(defaults.showGrid)
  /** 是否启用吸附对齐 */
  const snapEnabled = ref(defaults.snapEnabled)
  /** 默认节点颜色 */
  const defaultNodeColor = ref(defaults.defaultNodeColor)
  /** 未保存提示 */
  const unsavedPrompt = ref(defaults.unsavedPrompt)
  const developerMode = ref(defaults.developerMode)
  /** 左侧面板宽度 */
  const leftPanelWidth = ref(defaults.leftPanelWidth)
  /** 右侧面板宽度 */
  const rightPanelWidth = ref(defaults.rightPanelWidth)

  // 初始化时同步到 themeStore（用 applyTheme 避免回写）
  const themeStore = useThemeStore()
  themeStore.applyTheme(theme.value)

  // 防循环标志：settingsStore 主动同步到 themeStore 时置 true，
  // 避免 themeStore.mode 的 watcher 再次回写
  let syncingToThemeStore = false

  // 监听 themeStore 的外部变更（如 toggle 按钮），回写到自身以触发持久化
  watch(
    () => themeStore.mode,
    (newMode) => {
      if (syncingToThemeStore) return
      theme.value = newMode
    }
  )

  // 持久化所有设置
  watch(
    [theme, language, showGrid, snapEnabled, defaultNodeColor, unsavedPrompt, developerMode, leftPanelWidth, rightPanelWidth],
    ([t, l, sg, se, dnc, up, dm, lpw, rpw]) => {
      const state: SettingsState = {
        theme: t,
        language: l,
        showGrid: sg,
        snapEnabled: se,
        defaultNodeColor: dnc,
        unsavedPrompt: up,
        developerMode: dm,
        leftPanelWidth: lpw,
        rightPanelWidth: rpw,
      }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
      } catch (e) {
        console.error('[settingsStore] 无法保存设置到 localStorage（可能配额已满）:', e)
      }

      // 主题变化时同步到 themeStore（用 applyTheme 避免回写）
      syncingToThemeStore = true
      themeStore.applyTheme(t)
      syncingToThemeStore = false
    },
    { deep: true }
  )

  return {
    theme,
    language,
    showGrid,
    snapEnabled,
    defaultNodeColor,
    unsavedPrompt,
    developerMode,
    leftPanelWidth,
    rightPanelWidth,
  }
})
