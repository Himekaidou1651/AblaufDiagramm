import type { LocalUser, SaveSlot } from '@/types/localArchive'

export type NameValidation =
  | { ok: true; value: string }
  | { ok: false; reason: 'empty' | 'tooLong' }

/**
 * @brief 校验并规范化名称。
 * @param raw 未处理的名称。
 * @param maxLength 允许的最大长度。
 * @returns 校验结果；成功时包含去除首尾空白后的名称。
 */
function validateName(raw: string, maxLength: number): NameValidation {
  const value = raw.trim()
  if (!value) return { ok: false, reason: 'empty' }
  if (value.length > maxLength) return { ok: false, reason: 'tooLong' }
  return { ok: true, value }
}

/** @brief 校验本地用户名称。 */
export function validateUserName(raw: string, maxLength: number): NameValidation {
  return validateName(raw, maxLength)
}

/** @brief 校验项目存档名称。 */
export function validateSaveName(raw: string, maxLength: number): NameValidation {
  return validateName(raw, maxLength)
}

/** @brief 按 ID 查找存档；未提供 ID 或存档不存在时返回 null。 */
export function findSaveById(
  saveMetas: SaveSlot[],
  saveId: string | null,
): SaveSlot | null {
  if (!saveId) return null
  return saveMetas.find(save => save.id === saveId) ?? null
}

/** @brief 解析启动时应选中的用户。 */
export function resolveCurrentUserId(
  users: LocalUser[],
  storedUserId: string | null,
): string | null {
  if (storedUserId && users.some(user => user.id === storedUserId)) {
    return storedUserId
  }
  return users[0]?.id ?? null
}

/** @brief 解析启动时应选中的存档。 */
export function resolveCurrentSaveId(
  saveMetas: SaveSlot[],
  storedSaveId: string | null,
  lastOpenedSaveId: string | undefined,
): string | null {
  if (storedSaveId && findSaveById(saveMetas, storedSaveId)) {
    return storedSaveId
  }
  if (lastOpenedSaveId && findSaveById(saveMetas, lastOpenedSaveId)) {
    return lastOpenedSaveId
  }
  return saveMetas[0]?.id ?? null
}
