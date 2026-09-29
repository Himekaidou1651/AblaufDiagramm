/**
 * @file projectTitleStore.ts - 项目标题共享状态
 * @brief 提供一个全局响应式的项目标题，供 EditorToolbar 和导入导出逻辑共用。
 *        标题由当前本地存档统一持久化，不再单独写入 localStorage。
 * @author 自动生成
 * @date 2026-08-01
 */
import { ref } from 'vue'
import { markDirty } from '@/stores/dirtyFlag'

/** 全局响应式项目标题 */
const projectTitle = ref('')

/**
 * @brief 设置项目标题并触发当前项目变更
 * @param title - 新标题，空字符串则清除
 */
export function setProjectTitle(title: string) {
  projectTitle.value = title
  markDirty()
}

/**
 * @brief 获取当前项目标题（用于文件名等非响应式场景）
 * @returns 当前标题，空则返回 'default'
 */
export function getProjectTitleOrDefault(): string {
  return projectTitle.value || 'default'
}

/**
 * @brief 使用项目标题的响应式引用
 * @returns projectTitle ref
 */
export function useProjectTitle() {
  return { projectTitle }
}
