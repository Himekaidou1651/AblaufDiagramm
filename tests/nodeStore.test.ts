/**
 * @file nodeStore.test.ts
 * @brief 验证节点 Store 的关系节点快捷创建能力。
 * @author 项目维护者
 * @date 2026-08-26
 */

import { createPinia, setActivePinia } from 'pinia'
import { useEdgeStore } from '@/stores/edgeStore'
import { useCanvasStore } from '@/stores/canvasStore'
import { useNodeStore } from '@/stores/nodeStore'
import { deepStrictEqual, strictEqual } from './helpers/assert'

/** @brief 验证添加配偶节点会创建新节点和 spouse 关系边。 */
{
  setActivePinia(createPinia())

  const nodeStore = useNodeStore()
  const edgeStore = useEdgeStore()
  const sourceId = nodeStore.addPersonNode({
    position: { x: 100, y: 120 },
    size: { width: 180, height: 100 },
    data: {
      name: 'source',
      title: '',
      period: '',
      color: '#abcdef',
    },
  })

  const spouseId = nodeStore.addSpouseNode(sourceId, {
    name: '',
    title: '',
    period: '',
    color: '#abcdef',
  })

  const spouse = nodeStore.getPersonNode(spouseId)
  strictEqual(spouse != null, true)
  deepStrictEqual(spouse?.position, { x: 360, y: 120 })
  strictEqual(spouse?.data.color, '#abcdef')
  strictEqual(edgeStore.edges.length, 1)
  deepStrictEqual(
    {
      source: edgeStore.edges[0].source,
      target: edgeStore.edges[0].target,
      type: edgeStore.edges[0].type,
    },
    { source: sourceId, target: spouseId, type: 'spouse' }
  )
}

/** @brief 验证新增节点会被限制在画布网格边界内。 */
{
  setActivePinia(createPinia())

  const canvas = useCanvasStore()
  const nodeStore = useNodeStore()
  canvas.x = 0
  canvas.y = 0
  canvas.width = 1000
  canvas.height = 1000

  const nodeId = nodeStore.addPersonNode({
    position: { x: -100, y: 1200 },
    size: { width: 180, height: 100 },
    data: {
      name: 'clamped',
      title: '',
      period: '',
    },
  })

  const node = nodeStore.getPersonNode(nodeId)
  deepStrictEqual(node?.position, { x: 90, y: 950 })
}

/** @brief 验证手动更新位置和拖拽更新都会被限制在画布网格边界内。 */
{
  setActivePinia(createPinia())

  const canvas = useCanvasStore()
  const nodeStore = useNodeStore()
  canvas.x = 0
  canvas.y = 0
  canvas.width = 1000
  canvas.height = 1000

  const nodeId = nodeStore.addPersonNode({
    position: { x: 500, y: 500 },
    size: { width: 180, height: 100 },
    data: {
      name: 'move',
      title: '',
      period: '',
    },
  })

  nodeStore.updateNodePosition(nodeId, 2000, -100)

  const node = nodeStore.getPersonNode(nodeId)
  deepStrictEqual(node?.position, { x: 910, y: 50 })
}

/** @brief 验证带头像节点按扩展后的视觉边界限制位置。 */
{
  setActivePinia(createPinia())

  const canvas = useCanvasStore()
  const nodeStore = useNodeStore()
  canvas.x = 0
  canvas.y = 0
  canvas.width = 1000
  canvas.height = 1000

  const nodeId = nodeStore.addPersonNode({
    position: { x: 20, y: 20 },
    size: { width: 180, height: 100 },
    data: {
      name: 'avatar',
      title: '',
      period: '',
      avatar: 'example.test/avatar.png',
    },
  })

  const node = nodeStore.getPersonNode(nodeId)
  deepStrictEqual(node?.position, { x: 135, y: 60 })
}

/** @brief 验证画布边界缩小后可将已有节点批量收回边界内。 */
{
  setActivePinia(createPinia())

  const canvas = useCanvasStore()
  const nodeStore = useNodeStore()
  canvas.x = 0
  canvas.y = 0
  canvas.width = 1000
  canvas.height = 1000

  const nodeId = nodeStore.addPersonNode({
    position: { x: 900, y: 900 },
    size: { width: 180, height: 100 },
    data: {
      name: 'resize',
      title: '',
      period: '',
    },
  })

  canvas.width = 300
  canvas.height = 220
  nodeStore.clampAllNodesToCanvas()

  const node = nodeStore.getPersonNode(nodeId)
  deepStrictEqual(node?.position, { x: 210, y: 170 })
}

/** @brief 验证头像变化导致视觉尺寸变大时节点会重新收回边界内。 */
{
  setActivePinia(createPinia())

  const canvas = useCanvasStore()
  const nodeStore = useNodeStore()
  canvas.x = 0
  canvas.y = 0
  canvas.width = 1000
  canvas.height = 1000

  const nodeId = nodeStore.addPersonNode({
    position: { x: 90, y: 50 },
    size: { width: 180, height: 100 },
    data: {
      name: 'avatar-grow',
      title: '',
      period: '',
    },
  })

  nodeStore.updateNodeData(nodeId, { avatar: 'example.test/avatar.png' })

  const node = nodeStore.getPersonNode(nodeId)
  deepStrictEqual(node?.position, { x: 135, y: 60 })
}
