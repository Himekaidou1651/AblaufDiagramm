/**
 * @file archiveSelection.test.ts
 * @brief 验证本地用户与存档名称校验及启动选择逻辑。
 */

import {
  findSaveById,
  resolveCurrentSaveId,
  resolveCurrentUserId,
  validateSaveName,
  validateUserName,
} from '@/services/localArchive/archiveSelection'
import type { LocalUser, SaveSlot } from '@/types/localArchive'
import { strictEqual } from './helpers/assert'

const users: LocalUser[] = [
  { id: 'user-1', name: 'One', createdAt: 1, updatedAt: 1, lastOpenedSaveId: 'save-2' },
  { id: 'user-2', name: 'Two', createdAt: 2, updatedAt: 2 },
]

const saves: SaveSlot[] = [
  {
    id: 'save-1',
    userId: 'user-1',
    name: 'First',
    createdAt: 1,
    updatedAt: 2,
    nodeCount: 0,
    edgeCount: 0,
    projectVersion: '2.0.0',
  },
  {
    id: 'save-2',
    userId: 'user-1',
    name: 'Second',
    createdAt: 2,
    updatedAt: 3,
    nodeCount: 1,
    edgeCount: 0,
    projectVersion: '2.0.0',
  },
]

/** 名称会去除首尾空白，并区分空名称与超长名称。 */
{
  const validUserName = validateUserName('  Alice  ', 24)
  strictEqual(validUserName.ok, true)
  if (validUserName.ok) strictEqual(validUserName.value, 'Alice')

  const emptyUserName = validateUserName('   ', 24)
  strictEqual(emptyUserName.ok, false)
  if (!emptyUserName.ok) strictEqual(emptyUserName.reason, 'empty')

  const longSaveName = validateSaveName('123456', 5)
  strictEqual(longSaveName.ok, false)
  if (!longSaveName.ok) strictEqual(longSaveName.reason, 'tooLong')

  const validSaveName = validateSaveName(' Project ', 40)
  strictEqual(validSaveName.ok, true)
  if (validSaveName.ok) strictEqual(validSaveName.value, 'Project')
}

/** 存档查找在 ID 为空或目标不存在时返回 null。 */
{
  strictEqual(findSaveById(saves, 'save-2')?.name, 'Second')
  strictEqual(findSaveById(saves, 'missing'), null)
  strictEqual(findSaveById(saves, null), null)
}

/** 用户选择优先恢复有效的持久化 ID，否则回退到首个用户。 */
{
  strictEqual(resolveCurrentUserId(users, 'user-2'), 'user-2')
  strictEqual(resolveCurrentUserId(users, 'missing'), 'user-1')
  strictEqual(resolveCurrentUserId([], 'user-1'), null)
}

/** 存档选择依次尝试持久化 ID、最近打开 ID和首个存档。 */
{
  strictEqual(resolveCurrentSaveId(saves, 'save-1', 'save-2'), 'save-1')
  strictEqual(resolveCurrentSaveId(saves, 'missing', 'save-2'), 'save-2')
  strictEqual(resolveCurrentSaveId(saves, 'missing', 'also-missing'), 'save-1')
  strictEqual(resolveCurrentSaveId([], 'save-1', 'save-2'), null)
}
