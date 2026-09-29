/**
 * @file index.ts - i18n 国际化核心模块
 * @brief 轻量自建国际化方案，零外部依赖。
 *        通过 Pinia settingsStore.language 驱动语言切换；
 *        Vue 组件中使用 useI18n() 获取响应式翻译函数；
 *        非 Vue 上下文中直接导入 t() 函数；支持 {0}、{1}… 参数插值。
 *
 * @note 必须在 Pinia 安装后调用 initI18n() 进行初始化：
 *       app.use(createPinia()) 之后调用 initI18n()。
 * @author 自动生成
 * @date 2026-07-31
 */
import { ref, watch } from 'vue'
import type { WatchStopHandle } from 'vue'
import { useSettingsStore } from '@/stores/settingsStore'
import type { LocaleCode } from './types'
import zh from './zh'
import en from './en'
import fr from './fr'
import de from './de'
import ja from './ja'
import ru from './ru'
import es from './es'
import ar from './ar'

// ===== 翻译表 =====
/** 语言 → 键值对映射 */
const messages: Record<LocaleCode, Record<string, string>> = { zh, en, fr, de, ja, ru, es, ar }

// ===== 响应式当前语言（默认 zh，initI18n() 后与 settingsStore 同步） =====
/** 当前语言标识 */
const currentLocale = ref<LocaleCode>('zh')

// ===== 参数插值辅助函数 =====
/**
 * @brief 翻译模板参数插值
 * @description 将模板中的 {0}、{1}… 替换为实际参数值。
 * @param template - 翻译模板字符串
 * @param args - 参数数组（可选）
 * @returns 插值后的字符串
 */
function interpolate(template: string, args?: (string | number)[]): string {
  if (!args || args.length === 0) return template
  return template.replace(/\{(\d+)\}/g, (_, index) => {
    const i = Number(index)
    return i < args.length ? String(args[i]) : `{${index}}`
  })
}

// ===== 翻译函数 =====
/**
 * @brief 全局翻译函数（非 Vue 上下文中使用）
 * @description 根据 currentLocale 查找对应语言的翻译文本。
 *              未找到时回退返回 key 本身并输出警告。
 * @param key - 翻译键
 * @param args - 参数数组（可选，用于插值）
 * @returns 翻译后的字符串
 */
export function t(key: string, args?: (string | number)[]): string {
  const locale = currentLocale.value
  const map = messages[locale]
  if (map && key in map) {
    return interpolate(map[key], args)
  }
  // 回退：返回 key 本身（方便发现遗漏翻译）
  console.warn(`[i18n] Missing translation for key "${key}" in locale "${locale}"`)
  return key
}

// ===== Vue Composable =====
/**
 * @brief Vue Composable：获取响应式翻译函数
 * @description B18 fix: 返回普通函数而非 ComputedRef<Function>，
 *              通过读取 _localeVersion 在渲染期间建立响应式依赖。
 * @returns 包含 t（翻译函数）和 locale 的对象
 */
export function useI18n() {
  const _localeVersion = ref(0)
  // 语言变化时递增版本号，触发依赖此函数的组件重渲染
  watch(currentLocale, () => { _localeVersion.value++ })

  /** 翻译函数：读取 _localeVersion 建立响应式依赖 */
  const translate = (key: string, args?: (string | number)[]) => {
    void _localeVersion.value
    return t(key, args)
  }

  return {
    t: translate,
    locale: currentLocale,
  }
}

// ===== 同步 HTML lang 属性和 title =====
/**
 * @brief 同步 document 的 lang 属性
 * @param lang - 当前语言
 */
function syncHtmlLang(lang: LocaleCode) {
  const map: Record<LocaleCode, string> = {
    zh: 'zh-CN',
    en: 'en',
    fr: 'fr',
    de: 'de',
    ja: 'ja',
    ru: 'ru',
    es: 'es',
    ar: 'ar',
  }
  document.documentElement.lang = map[lang] ?? 'zh-CN'
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
}

/**
 * @brief 同步页面标题
 */
function syncHtmlTitle() {
  document.title = t('html.title')
}

// ===== 初始化：必须在 Pinia 安装后调用 =====
/** 语言监听器停止句柄 */
let _stopWatcher: WatchStopHandle | null = null

/**
 * @brief 初始化 i18n 模块
 * @description 必须在 Pinia 安装后调用。同步初始语言到 DOM，
 *              并监听 settingsStore.language 变化自动切换。
 */
export function initI18n(): void {
  const settingsStore = useSettingsStore()

  // 同步初始语言
  currentLocale.value = settingsStore.language
  syncHtmlLang(currentLocale.value)
  syncHtmlTitle()

  // 停止旧监听器（如果重复调用）
  if (_stopWatcher) _stopWatcher()

  // 监听 settingsStore.language 变化
  _stopWatcher = watch(
    () => settingsStore.language,
    (newLang) => {
      currentLocale.value = newLang
      syncHtmlLang(newLang)
      syncHtmlTitle()
    },
  )
}

// ===== 响应式翻译表引用（供外部读取） =====
export { currentLocale, messages }
