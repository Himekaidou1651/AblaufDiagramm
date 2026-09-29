/**
 * @file graphCoreInput.test.ts
 * @brief 验证前端族谱数据转换为 C++ 图核心输入快照和 JSON 的逻辑。
 * @author 项目维护者
 * @date 2026-08-26
 */

import { buildGraphCoreInputJson, buildGraphCoreSnapshot } from '@/wasm/graphCoreInput'
import { deepStrictEqual, strictEqual } from './helpers/assert'
import { parentEdge, person, spouseEdge } from './helpers/fixtures'

/** @brief 验证节点视觉尺寸、边索引和 ID 映射能够正确生成。 */
{
  const nodes = [person('a'), person('b'), person('c')]
  nodes[1].data.avatar = 'https://example.test/avatar.png'

  const edges = [
    parentEdge('a', 'b', 'edge-parent'),
    spouseEdge('b', 'c', 'edge-spouse'),
  ]

  const snapshot = buildGraphCoreSnapshot(nodes, edges)

  deepStrictEqual(snapshot.input, {
    nodes: [
      { node_index: 0, width: 180, height: 100, hasAvatar: false },
      { node_index: 1, width: 270, height: 120, hasAvatar: true },
      { node_index: 2, width: 180, height: 100, hasAvatar: false },
    ],
    edges: [
      { edge_index: 0, source: 0, target: 1, type: 0 },
      { edge_index: 1, source: 1, target: 2, type: 1 },
    ],
  })
  strictEqual(snapshot.maps.nodeIdToIndex.get('c'), 2)
  strictEqual(snapshot.maps.edgeIdToIndex.get('edge-spouse'), 1)
  strictEqual(snapshot.diagnostics.length, 0)
}

/** @brief 验证边引用缺失节点时会跳过该边并记录诊断信息。 */
{
  const snapshot = buildGraphCoreSnapshot(
    [person('a')],
    [parentEdge('a', 'missing', 'broken')]
  )

  deepStrictEqual(snapshot.input.edges, [])
  deepStrictEqual(snapshot.maps.indexToEdgeId, [])
  deepStrictEqual(snapshot.diagnostics, ['edge broken references a missing node'])
}

/** @brief 验证图核心输入能够序列化为预期 JSON 字符串。 */
{
  const json = buildGraphCoreInputJson(
    [person('a')],
    [spouseEdge('a', 'a', 'self-spouse')]
  )

  strictEqual(
    json,
    '{"nodes":[{"node_index":0,"width":180,"height":100,"hasAvatar":false}],"edges":[{"edge_index":0,"source":0,"target":0,"type":1}]}'
  )
}
