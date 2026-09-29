/**
 * @file env.d.ts - 环境类型声明
 * @brief Vite 项目的全局类型声明文件。包含 .vue 模块声明、
 *        .md?raw 导入声明、markdown-it 库类型声明。
 * @author 自动生成
 * @date 2026-07-31
 */

/// <reference types="vite/client" />

interface DesktopImageProxyResult {
  contentType: string
  data: string
}

interface DesktopAPI {
  proxyImage(url: string): Promise<DesktopImageProxyResult>
  archive: {
    getRoot(): Promise<{ rootPath: string }>
    load(): Promise<DesktopArchiveSnapshot>
    save(payload: DesktopArchiveSavePayload): Promise<{ rootPath: string }>
    removeSave(payload: DesktopArchiveRemoveSavePayload): Promise<{ rootPath: string }>
    removeUser(payload: DesktopArchiveRemoveUserPayload): Promise<{ rootPath: string }>
  }
  exportFile(payload: DesktopExportFilePayload): Promise<{
    rootPath: string
    relativePath: string
  }>
}

interface DesktopArchiveSnapshot {
  version: number
  rootPath: string
  users: import('./types/localArchive').LocalUser[]
  saves: import('./types/localArchive').LocalSave[]
  warnings: string[]
}

interface DesktopArchiveSavePayload {
  user: import('./types/localArchive').LocalUser
  users: import('./types/localArchive').LocalUser[]
  save?: import('./types/localArchive').LocalSave
}

interface DesktopArchiveRemoveSavePayload {
  userId: string
  saveId: string
  users: import('./types/localArchive').LocalUser[]
}

interface DesktopArchiveRemoveUserPayload {
  userId: string
  users: import('./types/localArchive').LocalUser[]
}

interface DesktopExportFilePayload {
  filename: string
  mimeType: string
  data: string | ArrayBuffer
}

interface Window {
  desktopAPI?: DesktopAPI
}

/** @brief 声明 .vue 单文件组件模块类型 */
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

/** @brief 声明 .md?raw 导入模块类型 */
declare module '*.md?raw' {
  const content: string
  export default content
}

/** @brief 声明 markdown-it 库类型 */
declare module 'markdown-it' {
  class MarkdownIt {
    constructor(options?: Record<string, unknown>)
    render(md: string): string
  }
  export default MarkdownIt
}
