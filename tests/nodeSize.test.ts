/**
 * @file nodeSize.test.ts
 * @brief 验证节点存储尺寸规范化和头像节点显示尺寸计算。
 * @author 项目维护者
 * @date 2026-08-26
 */

import {
  getAllowedNodeDisplaySize,
  getAllowedNodeSizeLabel,
  isAllowedStoredNodeSize,
  normalizeGraphNode,
  normalizePersonNode,
} from '@/utils/nodeSize'
import { deepStrictEqual, strictEqual } from './helpers/assert'
import { person } from './helpers/fixtures'

/** @brief 验证普通节点保持默认存储尺寸和显示尺寸。 */
{
  const node = person('plain')

  const normalized = normalizePersonNode(node)

  deepStrictEqual(normalized.size, { width: 180, height: 100 })
  strictEqual(isAllowedStoredNodeSize(normalized.size), true)
  deepStrictEqual(getAllowedNodeDisplaySize(normalized), { width: 180, height: 100 })
  strictEqual(getAllowedNodeSizeLabel(normalized), '180x100')
}

/** @brief 验证带头像节点存储尺寸不变但显示尺寸扩大。 */
{
  const node = person('avatar')
  node.data.avatar = 'example.test/avatar.png'

  const normalized = normalizeGraphNode(node)

  deepStrictEqual(normalized.size, { width: 180, height: 100 })
  deepStrictEqual(getAllowedNodeDisplaySize(normalized), { width: 270, height: 120 })
  strictEqual(getAllowedNodeSizeLabel(normalized), '270x120')
}
