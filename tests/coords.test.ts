/**
 * @file coords.test.ts
 * @brief 验证节点视觉尺寸、视觉边界和头像地址规范化逻辑。
 * @author 项目维护者
 * @date 2026-08-26
 */

import {
  getNodeVisualBounds,
  getNodeVisualSize,
  getVisualBounds,
  getVisualSize,
  hasNodeAvatar,
  normalizeStoredNodeSize,
  normalizeAvatarUrl,
} from '@/utils/coords'
import { deepStrictEqual, strictEqual } from './helpers/assert'
import { person } from './helpers/fixtures'

/** @brief 验证存储尺寸和基础视觉尺寸计算。 */
{
  deepStrictEqual(normalizeStoredNodeSize(), {
    width: 180,
    height: 100,
  })
  deepStrictEqual(getVisualSize({ width: 180, height: 100 }, false), {
    width: 180,
    height: 100,
  })
  deepStrictEqual(getVisualSize({ width: 180, height: 100 }, true), {
    width: 270,
    height: 120,
  })
}

/** @brief 验证普通节点和头像节点的视觉边界计算。 */
{
  deepStrictEqual(getVisualBounds({ x: 300, y: 200 }, { width: 180, height: 100 }, false), {
    left: 210,
    top: 150,
    width: 180,
    height: 100,
  })
  deepStrictEqual(getVisualBounds({ x: 300, y: 200 }, { width: 180, height: 100 }, true), {
    left: 165,
    top: 140,
    width: 270,
    height: 120,
  })
}

/** @brief 验证头像地址规范化、头像识别和节点视觉尺寸。 */
{
  const node = person('avatar')
  node.size = { width: 180, height: 100 }
  node.position = { x: 300, y: 200 }
  node.data.avatar = 'example.test/avatar.png'

  strictEqual(normalizeAvatarUrl(node.data.avatar), 'https://example.test/avatar.png')
  strictEqual(hasNodeAvatar(node), true)
  deepStrictEqual(getNodeVisualBounds(node), {
    left: 165,
    top: 140,
    width: 270,
    height: 120,
  })
  deepStrictEqual(getNodeVisualSize(node), {
    width: 270,
    height: 120,
  })
}
