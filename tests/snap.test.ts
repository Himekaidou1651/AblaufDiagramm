/**
 * @file snap.test.ts
 * @brief 验证网格吸附和节点对齐吸附结果。
 * @author 项目维护者
 * @date 2026-08-26
 */

import { getNodeRect, snapToGrid, snapToNodes } from '@/utils/snap'
import { deepStrictEqual, strictEqual } from './helpers/assert'
import { person } from './helpers/fixtures'

/** @brief 验证点位能够吸附到最近的网格中心线。 */
{
  const gridSnap = snapToGrid({ x: 48, y: 53 }, 1)

  deepStrictEqual(gridSnap.x, {
    value: 50,
    guideLine: 50,
    anchor: 'centerX',
    source: 'grid',
  })
  deepStrictEqual(gridSnap.y, {
    value: 50,
    guideLine: 50,
    anchor: 'centerY',
    source: 'grid',
  })
}

/** @brief 验证移动节点能够吸附到目标节点的左边界。 */
{
  const moving = getNodeRect({ x: 8, y: 100 }, { width: 180, height: 100 })
  const target = person('target', 100, 150)
  const result = snapToNodes('moving', moving, [person('moving'), target], 1)

  strictEqual(result.x?.guideLine, 10)
  strictEqual(result.x?.anchor, 'left')
  strictEqual(result.x?.targetNodeId, 'target')
}
