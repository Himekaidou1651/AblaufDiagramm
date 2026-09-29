/**
 * @file jsonSidebarStore.ts
 * @brief 画布存档 JSON 侧边栏的状态与双向同步。
 * @description 左侧工具栏「≡」打开本侧边栏，直接显示当前画布对应存档的原始 JSON。
 *              画布变化经 graphStore 现有序列化写入编辑区；编辑区文本经 prepareProjectFile
 *              现有校验和 graphStore.loadProject 现有反序列化写回画布，
 *              不引入第二套存档结构、字段映射或序列化逻辑。
 * @author 项目维护者
 * @date 2026-09-29
 */
import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { useGraphStore } from '@/stores/graphStore'
import { useLocalArchiveStore } from '@/stores/localArchiveStore'
import { useViewportStore } from '@/stores/viewportStore'
import { useCanvasStore } from '@/stores/canvasStore'
import { prepareProjectFile } from '@/services/project/projectImport'
import { debounce } from '@/utils/debounce'
import { DEBOUNCE_MS } from '@/constants/constant'
import { t } from '@/i18n'

/** @brief 侧边栏同步状态。 */
export type JsonSidebarStatus = 'synced' | 'pending' | 'invalid' | 'conflict' | 'failed'

/** @brief 需要用户裁决的交互类型。 */
export type JsonPromptKind = 'close' | 'save' | 'conflict'

/** @brief 用户对提示的裁决结果。 */
export type JsonPromptChoice = 'apply' | 'discard' | 'keep' | 'reload' | 'cancel'

/** @brief JSON 语法错误及其位置，位置无法确定时为 null。 */
export interface JsonSyntaxError {
  message: string
  line: number | null
  column: number | null
}

/** @brief JSON.parse 报错消息中的字符位置。 */
const POSITION_PATTERN = /position (\d+)/

/** @brief 新版引擎已附带的行列后缀，解析后由本地计算统一给出。 */
const LINE_COLUMN_SUFFIX = /\s*\(line \d+ column \d+\)\s*$/

/** @brief JSON 文本解析结果。 */
type JsonParseResult = { ok: true; data: unknown } | { ok: false; error: JsonSyntaxError }

/**
 * @brief 解析编辑区文本并计算语法错误位置。
 * @param source 待解析的 JSON 文本。
 * @return 解析成功时的数据，或包含行列号的语法错误。
 */
function parseJson(source: string): JsonParseResult {
  try {
    return { ok: true, data: JSON.parse(source) as unknown }
  } catch (error) {
    const raw = error instanceof Error ? error.message : String(error)
    const message = raw.replace(LINE_COLUMN_SUFFIX, '')
    const matched = POSITION_PATTERN.exec(raw)
    if (!matched) return { ok: false, error: { message, line: null, column: null } }

    const position = Number(matched[1])
    const before = source.slice(0, position)
    const line = before.split('\n').length
    return { ok: false, error: { message, line, column: position - before.lastIndexOf('\n') } }
  }
}

/**
 * @brief 生成忽略时间戳的存档内容签名。
 * @param source 存档 JSON 文本。
 * @return 去除 exportedAt 后的内容签名。
 */
function archiveContentSignature(source: string): string {
  const parsed: unknown = JSON.parse(source)
  if (typeof parsed !== 'object' || parsed === null) return source
  const entries = Object.entries(parsed as Record<string, unknown>)
    .filter(([key]) => key !== 'exportedAt')
  return JSON.stringify(entries)
}

/**
 * @brief 判断两份存档 JSON 是否表示同一份存档内容。
 * @description 序列化会刷新 exportedAt 时间戳，除此之外内容一致时不重复刷新编辑区。
 * @param left 左侧 JSON 文本。
 * @param right 右侧 JSON 文本。
 * @return 表示同一份存档内容时返回 true。
 */
function isSameArchiveContent(left: string, right: string): boolean {
  if (left === right) return true
  try {
    return archiveContentSignature(left) === archiveContentSignature(right)
  } catch {
    return false
  }
}

export const useJsonSidebarStore = defineStore('jsonSidebar', () => {
  const graph = useGraphStore()
  const archive = useLocalArchiveStore()
  const viewport = useViewportStore()
  const canvas = useCanvasStore()

  /** @brief 侧边栏是否展开。 */
  const open = ref(false)
  /** @brief 编辑区当前文本。 */
  const text = ref('')
  /** @brief 最近一次有效存档 JSON。 */
  const lastValidJson = ref('')
  /** @brief 当前语法错误。 */
  const syntaxError = ref<JsonSyntaxError | null>(null)
  /** @brief 当前存档格式错误。 */
  const formatError = ref('')
  /** @brief 画布变化时编辑区存在未应用修改。 */
  const conflict = ref(false)
  /** @brief 最近一次应用是否失败。 */
  const applyFailed = ref(false)
  /** @brief 同步锁，避免同步过程被再次触发。 */
  const syncing = ref(false)
  /** @brief 等待用户裁决的提示类型。 */
  const prompt = ref<JsonPromptKind | null>(null)

  let resolvePrompt: ((choice: JsonPromptChoice) => void) | null = null

  /** @brief 编辑区是否存在未应用修改。 */
  const hasPendingEdits = computed(() => text.value !== lastValidJson.value)

  /** @brief 当前存档名称，未绑定存档时为空。 */
  const archiveName = computed(() => archive.currentSaveMeta?.name ?? '')

  /** @brief 侧边栏同步状态。 */
  const status = computed<JsonSidebarStatus>(() => {
    if (applyFailed.value) return 'failed'
    if (syntaxError.value || formatError.value) return 'invalid'
    if (conflict.value) return 'conflict'
    return hasPendingEdits.value ? 'pending' : 'synced'
  })

  /**
   * @brief 读取当前画布正在使用的存档 JSON 文本。
   * @return 与保存存档一致的序列化结果。
   */
  function currentArchiveJson(): string {
    return JSON.stringify(graph.buildProjectFile(), null, 2)
  }

  /**
   * @brief 用画布最新序列化结果刷新编辑区；存在未应用修改时只标记冲突，不覆盖编辑区。
   * @param value 画布最新存档 JSON 文本。
   */
  function refreshFromLive(value: string) {
    if (!value) return
    if (isSameArchiveContent(value, lastValidJson.value)) return
    if (!hasPendingEdits.value) {
      text.value = value
      lastValidJson.value = value
      return
    }
    const alreadyConflicted = conflict.value
    conflict.value = true
    if (!alreadyConflicted && open.value && !prompt.value) void requestConflictChoice()
  }

  watch(() => graph.liveJsonString, (value) => {
    if (syncing.value) return
    refreshFromLive(value)
  })

  // 视口与画布矩形不在脏标记覆盖范围内，单独防抖同步。
  const refreshLayout = debounce(() => {
    if (!open.value || syncing.value) return
    refreshFromLive(currentArchiveJson())
  }, DEBOUNCE_MS)

  watch(
    () => [viewport.panX, viewport.panY, viewport.zoom, canvas.x, canvas.y, canvas.width, canvas.height],
    () => { refreshLayout() },
  )

  /**
   * @brief 按当前画布/当前存档重新读取编辑区内容，并清除错误与冲突状态。
   */
  function syncFromArchive() {
    const latest = currentArchiveJson()
    text.value = latest
    lastValidJson.value = latest
    syntaxError.value = null
    formatError.value = ''
    conflict.value = false
    applyFailed.value = false
  }

  /**
   * @brief 校验编辑区文本的语法和存档格式，不更新画布。
   */
  function validateText() {
    const parsed = parseJson(text.value)
    if (!parsed.ok) {
      syntaxError.value = parsed.error
      formatError.value = ''
      return
    }
    syntaxError.value = null
    const prepared = prepareProjectFile(parsed.data, t)
    formatError.value = prepared.project ? '' : prepared.error ?? ''
  }

  watch(text, () => { validateText() })

  /**
   * @brief 发出等待用户裁决的提示。
   * @param kind 提示类型。
   * @return 用户选择结果。
   */
  function askPrompt(kind: JsonPromptKind): Promise<JsonPromptChoice> {
    return new Promise(resolve => {
      resolvePrompt = resolve
      prompt.value = kind
    })
  }

  /**
   * @brief 提交用户对当前提示的裁决。
   * @param choice 用户选择结果。
   */
  function answerPrompt(choice: JsonPromptChoice) {
    prompt.value = null
    const resolve = resolvePrompt
    resolvePrompt = null
    resolve?.(choice)
  }

  /**
   * @brief 处理画布变化与未应用修改之间的冲突。
   */
  async function requestConflictChoice() {
    const choice = await askPrompt('conflict')
    if (choice === 'reload') syncFromArchive()
    else if (choice === 'keep') conflict.value = false
  }

  /** @brief 切换侧边栏展开状态。 */
  function toggle() {
    if (open.value) void requestClose()
    else openSidebar()
  }

  /** @brief 展开侧边栏并读取当前存档最新内容。 */
  function openSidebar() {
    if (open.value) return
    open.value = true
    syncFromArchive()
  }

  /** @brief 关闭侧边栏。 */
  function closeSidebar() {
    open.value = false
    prompt.value = null
    resolvePrompt = null
    syncFromArchive()
  }

  /**
   * @brief 关闭侧边栏，存在未应用修改时先让用户裁决。
   */
  async function requestClose() {
    if (!open.value) return
    if (hasPendingEdits.value) {
      const choice = await askPrompt('close')
      if (choice === 'cancel') return
      if (choice === 'apply' && !(await applyJson())) return
      if (choice === 'discard') syncFromArchive()
    }
    closeSidebar()
  }

  /**
   * @brief 将编辑区 JSON 经现有校验和现有反序列化应用到画布。
   * @return 应用成功时返回 true。
   */
  async function applyJson(): Promise<boolean> {
    const parsed = parseJson(text.value)
    if (!parsed.ok) {
      syntaxError.value = parsed.error
      formatError.value = ''
      return false
    }
    syntaxError.value = null

    const prepared = prepareProjectFile(parsed.data, t)
    if (!prepared.project) {
      formatError.value = prepared.error ?? ''
      return false
    }
    formatError.value = ''

    const snapshot = graph.buildProjectFile()
    syncing.value = true
    try {
      graph.loadProject(prepared.project)
    } catch (error) {
      try {
        graph.loadProject(snapshot)
      } catch {
        // 回滚失败时保持当前画布状态。
      }
      applyFailed.value = true
      formatError.value = error instanceof Error ? error.message : String(error)
      return false
    } finally {
      syncing.value = false
    }

    const canonical = graph.liveJsonString
    text.value = canonical
    lastValidJson.value = canonical
    conflict.value = false
    applyFailed.value = false
    return true
  }

  /**
   * @brief 保存前处理未应用的编辑区修改。
   * @return 允许继续保存时返回 true。
   */
  async function confirmBeforeSave(): Promise<boolean> {
    if (!hasPendingEdits.value) return true
    const choice = await askPrompt('save')
    if (choice === 'apply') return applyJson()
    if (choice === 'discard') {
      syncFromArchive()
      return true
    }
    return false
  }

  /** @brief 重新读取当前存档，放弃未应用修改。 */
  function reloadJson() {
    syncFromArchive()
  }

  /** @brief 仅调整编辑区缩进，不改变存档数据含义。 */
  function formatText() {
    const parsed = parseJson(text.value)
    if (!parsed.ok) {
      syntaxError.value = parsed.error
      formatError.value = ''
      return
    }
    syntaxError.value = null
    text.value = JSON.stringify(parsed.data, null, 2)
  }

  return {
    open,
    text,
    lastValidJson,
    syntaxError,
    formatError,
    conflict,
    applyFailed,
    syncing,
    prompt,
    hasPendingEdits,
    archiveName,
    status,
    toggle,
    openSidebar,
    requestClose,
    answerPrompt,
    applyJson,
    confirmBeforeSave,
    reloadJson,
    formatText,
  }
})
