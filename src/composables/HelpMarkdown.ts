/**
 * @file HelpMarkdown.ts
 * @brief 加载、缓存并渲染多语言帮助 Markdown 文档。
 * @author 项目维护者
 * @date 2026-08-26
 */

import { computed, ref, watch } from 'vue'
import MarkdownIt from 'markdown-it'
import type { LocaleCode } from '@/i18n/types'

/** @brief Markdown 渲染器实例。 */
const md = new MarkdownIt()

/** @brief 按语言缓存已加载的帮助 Markdown 原文。 */
const helpCache: Partial<Record<LocaleCode, string>> = {
  zh: undefined,
  en: undefined,
  fr: undefined,
  de: undefined,
  ja: undefined,
  ru: undefined,
  es: undefined,
  ar: undefined,
}

/** @brief 按语言延迟导入帮助 Markdown 原文的模块加载器。 */
const helpModules: Partial<Record<LocaleCode, () => Promise<{ default: string }>>> = {
  zh: () => import('@/constants/helps/help.zh.md?raw'),
  en: () => import('@/constants/helps/help.en.md?raw'),
  fr: () => import('@/constants/helps/help.fr.md?raw'),
  de: () => import('@/constants/helps/help.de.md?raw'),
  ja: () => import('@/constants/helps/help.ja.md?raw'),
  ru: () => import('@/constants/helps/help.ru.md?raw'),
  es: () => import('@/constants/helps/help.es.md?raw'),
  ar: () => import('@/constants/helps/help.ar.md?raw'),
}

/**
 * @brief 提供帮助文档加载状态和渲染后的 HTML。
 * @param getLanguage 获取当前帮助语言的函数。
 * @return 帮助 HTML 和加载状态。
 */
export function HelpMarkdown(getLanguage: () => LocaleCode) {
  /** @brief 当前语言的帮助 Markdown 原文。 */
  const helpMdRaw = ref('')

  /** @brief 标记帮助文档是否正在加载。 */
  const helpLoading = ref(false)

  /**
   * @brief 加载指定语言的帮助文档，并在加载失败时回退到中文。
   * @param lang 待加载的语言。
   * @return 无返回值。
   */
  async function loadHelpDoc(lang: LocaleCode) {
    const cached = helpCache[lang]
    if (cached) {
      helpMdRaw.value = cached
      return
    }

    helpLoading.value = true
    try {
      const loader = helpModules[lang]
      if (!loader) throw new Error(`Missing help module for ${lang}`)
      const mod = await loader()
      helpCache[lang] = mod.default
      helpMdRaw.value = mod.default
    } catch {
      if (lang !== 'zh') {
        await loadHelpDoc('zh')
      }
    } finally {
      helpLoading.value = false
    }
  }

  loadHelpDoc(getLanguage())
  const otherLang = getLanguage() === 'zh' ? 'en' : 'zh'
  helpModules[otherLang]?.().then(mod => { helpCache[otherLang] = mod.default }).catch(() => {})

  watch(getLanguage, (lang) => {
    loadHelpDoc(lang)
  })

  /** @brief 当前语言对应的帮助 HTML。 */
  const helpHtml = computed(() => md.render(helpMdRaw.value))

  return {
    helpHtml,
    helpLoading,
  }
}
