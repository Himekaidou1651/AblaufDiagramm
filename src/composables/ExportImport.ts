/**
 * @file ExportImport.ts
 * @brief 组合 store 状态，对外提供原有 JSON/图片导入导出 API。
 * @author 项目维护者
 * @date 2026-08-26
 */
import { ref } from 'vue'
import { useGraphStore } from '@/stores/graphStore'
import { useViewportStore } from '@/stores/viewportStore'
import { useCanvasStore } from '@/stores/canvasStore'
import { markDirty } from '@/stores/dirtyFlag'
import { t } from '@/i18n'
import {
  FILE_ENCODING_UTF8,
  IMPORT_CANCEL_DETECT_MS,
  MAX_IMPORT_FILE_SIZE,
} from '@/constants/constant'
import { setProjectTitle } from '@/stores/projectTitleStore'
import { exportPngFile, exportSvgFile, exportWebpFile } from '@/services/export/exportImageFile'
import { formatDateForFilename, triggerDownload } from '@/services/project/projectDownload'
import { performImport, prepareProjectFile } from '@/services/project/projectImport'
import { readFileAsText } from '@/utils/fileReader'

/**
 * @brief 从未知错误对象中提取导入导出错误消息。
 * @param error 待解析的错误对象。
 * @return 可展示的错误消息。
 */
function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : t('import.unknownError')
}

/**
 * @brief 提供项目 JSON 导入导出和图片导出操作。
 * @return 导入导出状态和操作函数集合。
 */
export function ExportImport() {
  const graph = useGraphStore()
  const viewport = useViewportStore()
  const canvas = useCanvasStore()

  /** @brief 操作错误消息，导入和导出共用。 */
  const operationError = ref<string>('')

  /** @brief 导入成功消息。 */
  const importSuccess = ref<string>('')

  /**
   * @brief 导出当前图谱为 JSON 文件。
   * @return 无返回值。
   */
  async function exportJson() {
    operationError.value = ''

    try {
      const project = graph.buildProjectFile()
      const title = project.title || 'default'
      const filename = `${title}_${formatDateForFilename(new Date())}.json`
      await triggerDownload(JSON.stringify(project, null, 2), filename, 'application/json')
    } catch (err) {
      operationError.value = `导出 JSON 失败：${getErrorMessage(err)}`
    }
  }

  /**
   * @brief 从 File 对象导入 JSON 项目文件。
   * @param file 待导入的 JSON 文件。
   * @return 导入结果、错误消息和节点数量。
   */
  async function importJsonFromFile(file: File): Promise<{ success: boolean; error?: string; nodeCount?: number }> {
    operationError.value = ''
    importSuccess.value = ''

    if (!file.name.toLowerCase().endsWith('.json')) {
      return { success: false, error: t('import.invalidFormat') }
    }

    if (file.size > MAX_IMPORT_FILE_SIZE) {
      return { success: false, error: t('import.fileTooBig') }
    }

    try {
      const text = await readFileAsText(
        file,
        FILE_ENCODING_UTF8,
        t('import.readFailed'),
        t('import.failed')
      )
      const data = JSON.parse(text) as unknown
      const prepared = prepareProjectFile(data, t)
      if (!prepared.project) {
        return { success: false, error: `${t('import.validationFailed')}${prepared.error ?? ''}` }
      }

      const project = prepared.project
      performImport(project, {
        graph,
        viewport,
        canvas,
        setProjectTitle,
        markDirty,
      })
      importSuccess.value = t('import.success', [project.nodes.length, project.edges.length])
      return { success: true, nodeCount: project.nodes.length }
    } catch (err) {
      const msg = `${t('import.readFailed')}${err instanceof Error ? err.message : t('import.unknownError')}`
      operationError.value = msg
      return { success: false, error: msg }
    }
  }

  /**
   * @brief 打开文件选择器并导入 JSON 项目文件。
   * @return 导入成功时返回 true，否则返回 false。
   */
  function importJson(): Promise<boolean> {
    return new Promise((resolve) => {
      operationError.value = ''

      try {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = '.json'

        // 使用 window.focus 事件检测用户取消文件选择，替代非标准的 oncancel。
        const onFocus = () => {
          window.removeEventListener('focus', onFocus)
          setTimeout(() => {
            if (!input.files || input.files.length === 0) {
              resolve(false)
            }
          }, IMPORT_CANCEL_DETECT_MS)
        }

        input.onchange = async () => {
          window.removeEventListener('focus', onFocus)
          const file = input.files?.[0]
          if (!file) {
            resolve(false)
            return
          }

          try {
            const result = await importJsonFromFile(file)
            if (result.success) {
              resolve(true)
            } else {
              operationError.value = result.error ?? t('import.failed')
              resolve(false)
            }
          } catch (err) {
            operationError.value = `${t('import.failed')}：${getErrorMessage(err)}`
            resolve(false)
          }
        }

        window.addEventListener('focus', onFocus)
        input.click()
      } catch (err) {
        operationError.value = `${t('import.failed')}：${getErrorMessage(err)}`
        resolve(false)
      }
    })
  }

  /**
   * @brief 导出当前画布为 PNG 图片。
   * @param _element 当前画布元素，保留用于兼容既有调用签名。
   * @return 无返回值。
   */
  async function exportImage(_element: HTMLElement): Promise<void> {
    await exportPngFile({
      setError: message => { operationError.value = message },
      getErrorMessage,
      t,
    })
  }

  /**
   * @brief 导出当前画布为 SVG 图片。
   * @param _element 当前画布元素，保留用于兼容既有调用签名。
   * @return 无返回值。
   */
  async function exportSvg(_element: HTMLElement): Promise<void> {
    await exportSvgFile({
      setError: message => { operationError.value = message },
      getErrorMessage,
      t,
    })
  }

  /**
   * @brief 导出当前画布为 WebP 图片。
   * @param _element 当前画布元素，保留用于兼容既有调用签名。
   * @return 无返回值。
   */
  async function exportWebp(_element: HTMLElement): Promise<void> {
    await exportWebpFile({
      setError: message => { operationError.value = message },
      getErrorMessage,
      t,
    })
  }

  return {
    operationError,
    importSuccess,
    exportJson,
    importJson,
    importJsonFromFile,
    exportImage,
    exportSvg,
    exportWebp,
  }
}
