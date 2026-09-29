/**
 * @file minimapGeometry.test.ts
 * @brief 验证小地图世界边界、坐标转换和视口矩形计算。
 * @author 项目维护者
 * @date 2026-08-26
 */

import {
  canvasBoundsToWorldBounds,
  computeViewportRect,
  computeWorldBounds,
  miniToWorld,
  worldToMini,
} from '@/components/minimap/minimapGeometry'
import { deepStrictEqual, strictEqual } from './helpers/assert'
import { person } from './helpers/fixtures'

/** @brief 验证画布矩形能转换为带外边距的世界边界。 */
{
  deepStrictEqual(canvasBoundsToWorldBounds({ x: 0, y: 0, width: 800, height: 600 }), {
    minX: -80,
    minY: -80,
    maxX: 880,
    maxY: 680,
    width: 960,
    height: 760,
  })
}

/** @brief 验证节点和画布共同参与世界边界计算。 */
{
  const bounds = computeWorldBounds([person('a', 100, 100)], { x: 0, y: 0, width: 800, height: 600 })
  strictEqual(bounds.minX, 0 - 80)
  strictEqual(bounds.minY, 0 - 80)
  strictEqual(bounds.maxX, 800 + 80)
  strictEqual(bounds.maxY, 600 + 80)
}

/** @brief 验证世界坐标与小地图坐标能够近似往返转换。 */
{
  const bounds = canvasBoundsToWorldBounds({ x: 0, y: 0, width: 800, height: 600 })
  const mini = worldToMini(400, 300, bounds, { width: 400, height: 300 }, 1)
  const world = miniToWorld(mini.mx, mini.my, bounds, { width: 400, height: 300 }, 1)

  strictEqual(Math.round(world.wx), 400)
  strictEqual(Math.round(world.wy), 300)
}

/** @brief 验证根据视口状态计算的小地图视口矩形合法。 */
{
  const bounds = canvasBoundsToWorldBounds({ x: 0, y: 0, width: 800, height: 600 })
  const rect = computeViewportRect(
    bounds,
    { width: 400, height: 300 },
    { panX: 0, panY: 0, zoom: 1 },
    { width: 800, height: 600 }
  )

  strictEqual(rect.left < rect.right, true)
  strictEqual(rect.top < rect.bottom, true)
}
