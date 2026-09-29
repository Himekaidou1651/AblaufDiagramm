/**
 * @file graphStore.test.ts
 * @brief 验证图谱项目导出和导入会保留人员头像地址。
 */

import { createPinia, setActivePinia } from 'pinia'
import { useGraphStore } from '@/stores/graphStore'
import { strictEqual } from './helpers/assert'

setActivePinia(createPinia())

{
  const graph = useGraphStore()
  const nodeId = graph.addPersonNode({
    position: { x: 100, y: 100 },
    size: { width: 180, height: 100 },
    data: {
      name: 'person',
      title: 'title',
      period: 'period',
      avatar: 'https://example.test/avatar.png',
    },
  })

  const project = graph.buildProjectFile()
  strictEqual(project.nodes[0]?.data?.avatar, 'https://example.test/avatar.png')

  graph.loadProject(project)
  strictEqual(graph.getPersonNode(nodeId)?.data.avatar, 'https://example.test/avatar.png')
}
