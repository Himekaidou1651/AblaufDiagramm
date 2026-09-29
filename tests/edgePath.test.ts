/**
 * @file edgePath.test.ts
 * @brief 验证父子关系边和配偶关系边的 SVG 路径生成。
 * @author 项目维护者
 * @date 2026-08-26
 */

import { getEdgePath } from '@/utils/edgePath'
import type { VisualBounds } from '@/utils/coords'
import { assertIncludes, strictEqual } from './helpers/assert'

/** @brief 父节点视觉边界夹具。 */
const parent: VisualBounds = { left: 100, top: 100, width: 180, height: 100 }

/** @brief 第一个子节点视觉边界夹具。 */
const childA: VisualBounds = { left: 80, top: 300, width: 180, height: 100 }

/** @brief 第二个子节点视觉边界夹具。 */
const childB: VisualBounds = { left: 260, top: 300, width: 180, height: 100 }

/** @brief 配偶节点视觉边界夹具。 */
const spouse: VisualBounds = { left: 320, top: 100, width: 180, height: 100 }

/** @brief 验证普通父子关系边从父节点底部连接到子节点顶部。 */
{
  const d = getEdgePath(parent, childA, 'parent', {
    edgeId: 'p-a',
    sourceId: 'parent',
    targetId: 'child-a',
    parentEdges: [{ id: 'p-a', source: 'parent', target: 'child-a' }],
  })

  assertIncludes(d, 'M 190.0 200.0')
  assertIncludes(d, 'L 170.0 300.0')
}

/** @brief 验证同一父节点的多条父子边共享父节点主干路径。 */
{
  const parentEdges = [
    { id: 'p-a', source: 'parent', target: 'child-a' },
    { id: 'p-b', source: 'parent', target: 'child-b' },
  ]
  const dA = getEdgePath(parent, childA, 'parent', {
    edgeId: 'p-a',
    sourceId: 'parent',
    targetId: 'child-a',
    parentEdges,
  })
  const dB = getEdgePath(parent, childB, 'parent', {
    edgeId: 'p-b',
    sourceId: 'parent',
    targetId: 'child-b',
    parentEdges,
  })

  assertIncludes(dA, 'M 190.0 200.0 L 190.0 224.0')
  assertIncludes(dB, 'M 190.0 200.0 L 190.0 224.0')
}

/** @brief 验证配偶关系边按左右节点边缘生成水平折线。 */
{
  const d = getEdgePath(parent, spouse, 'spouse')

  strictEqual(d, 'M 280.0 150.0 L 280.0 150.0 L 320.0 150.0 L 320.0 150.0')
}
