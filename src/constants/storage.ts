/**
 * @file storage.ts
 * @brief 定义本地存储键名和应用版本号。
 * @author 项目维护者
 * @date 2026-08-26
 */

/** @brief 设置项 localStorage 键。 */
export const STORAGE_KEY_SETTINGS = 'ablauf_settings'
/** @brief 上次会话 localStorage 键。 */
export const STORAGE_KEY_LAST_SESSION = 'ablauf_last_session'
/** @brief 上次会话时间 localStorage 键。 */
export const STORAGE_KEY_LAST_SESSION_TIME = 'ablauf_last_session_time'
/** @brief 项目标题 localStorage 键。 */
export const STORAGE_KEY_PROJECT_NAME = 'ablauf_project_name'

/** @brief 应用版本号。 */
export const APP_VERSION = '2.0.0'

/** @brief 当前统一项目正文格式版本，独立项目 JSON 与存档 project 共用。 */
export const PROJECT_FILE_VERSION = APP_VERSION

/** @brief 本地用户名称允许的最大长度。 */
export const USER_NAME_MAX_LENGTH = 24
/** @brief 本地项目存档名称允许的最大长度。 */
export const SAVE_NAME_MAX_LENGTH = 40
