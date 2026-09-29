/**
 * @file pinia.ts
 * @brief 让主应用和临时挂载的内部工具组件共用同一份 Store。
 * @author 项目维护者
 * @date 2026-08-26
 */
import { createPinia } from 'pinia'

/** @brief 全局共享的 Pinia Store 实例。 */
export const pinia = createPinia()
