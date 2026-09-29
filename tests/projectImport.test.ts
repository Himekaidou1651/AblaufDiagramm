/**
 * @file projectImport.test.ts
 * @brief 验证项目文件导入校验逻辑对合法结构和错误结构的处理。
 * @author 项目维护者
 * @date 2026-08-26
 */

import {
  performImport,
  prepareProjectFile,
  validateProjectFile,
} from '@/services/project/projectImport'
import { PROJECT_FILE_VERSION } from '@/constants/constant'
import { deserializePersonData, serializePersonData } from '@/types/serialization'
import type { ProjectFile } from '@/types/serialization'
import { strictEqual } from './helpers/assert'

/**
 * @brief 测试用翻译函数，将参数拼接到翻译键后便于断言。
 * @param key 翻译键。
 * @param args 翻译参数。
 * @return 拼接后的测试翻译文本。
 */
const tr = (key: string, args?: (string | number)[]) => `${key}${args ? `:${args.join(',')}` : ''}`

/** @brief 测试用合法导入数据。 */
const validProject = (): Record<string, unknown> => ({
  version: PROJECT_FILE_VERSION,
  exportedAt: '2026-09-22T00:00:00.000Z',
  viewport: { x: 0, y: 0, zoom: 1 },
  canvas: { x: 0, y: 0, width: 1000, height: 1000 },
  nodes: [
    {
      id: 'n1',
      kind: 'person',
      position: { x: 0, y: 0 },
      size: { width: 180, height: 100 },
      data: { name: 'n1', title: '', period: '' },
    },
  ],
  edges: [],
})

/** @brief 验证合法项目文件结构能够通过校验。 */
{
  strictEqual(validateProjectFile(validProject(), tr), null)
}

/** @brief 验证非当前版本的项目正文一律被拒绝，不做旧版本兼容。 */
{
  strictEqual(
    validateProjectFile({ ...validProject(), version: '1.0.0' }, tr),
    `格式版本不支持：1.0.0，当前版本为 ${PROJECT_FILE_VERSION}`
  )

  const prepared = prepareProjectFile({ ...validProject(), version: '1.0.0' }, tr)
  strictEqual(prepared.project, undefined)
  strictEqual(prepared.error, `格式版本不支持：1.0.0，当前版本为 ${PROJECT_FILE_VERSION}`)
}

/** @brief 验证缺失基础字段时返回对应错误。 */
{
  strictEqual(validateProjectFile(null, tr), 'import.notValidJson')
  strictEqual(validateProjectFile({ nodes: [], edges: [] }, tr), 'import.missingVersion')
  strictEqual(validateProjectFile({ ...validProject(), nodes: undefined }, tr), 'import.missingNodes')
  strictEqual(validateProjectFile({ ...validProject(), edges: undefined }, tr), 'import.missingEdges')
}

/** @brief 验证缺失时间、视口、画布或节点尺寸时返回明确错误。 */
{
  strictEqual(validateProjectFile({ ...validProject(), exportedAt: '' }, tr), '缺少合法的 exportedAt 时间字符串')

  const withoutViewport = validProject()
  delete withoutViewport.viewport
  strictEqual(validateProjectFile(withoutViewport, tr), '缺少合法的 viewport')

  const withoutCanvas = validProject()
  delete withoutCanvas.canvas
  strictEqual(validateProjectFile(withoutCanvas, tr), '缺少合法的 canvas 坐标')

  const withoutNodeSize = validProject()
  withoutNodeSize.nodes = [{ id: 'n1', kind: 'person', position: { x: 0, y: 0 }, data: { name: 'n1' } }]
  strictEqual(validateProjectFile(withoutNodeSize, tr), '节点[0] 缺少合法的 size')
}

/** @brief 验证边引用缺失节点时返回边错误信息。 */
{
  const data = validProject()
  data.edges = [{ id: 'e1', source: 'n1', target: 'missing', type: 'parent' }]

  strictEqual(validateProjectFile(data, tr), 'import.invalidEdge:0,missing')
}

/**
 * @brief 验证导入会按项目正文写入画布尺寸，而不是沿用旧项目状态。
 */
{
  const canvas = {
    x: -400,
    y: -200,
    width: 2100,
    height: 3400,
  }

  performImport({
    version: PROJECT_FILE_VERSION,
    exportedAt: '2026-09-22T00:00:00.000Z',
    viewport: { x: 0, y: 0, zoom: 1 },
    canvas: { x: 0, y: 0, width: 1000, height: 1000 },
    nodes: [],
    edges: [],
  }, {
    graph: {
      clearAll() {},
      importGraph() {},
      clampAllNodesToCanvas() {},
    },
    viewport: {
      panX: 0,
      panY: 0,
      zoom: 1,
    },
    canvas,
    setProjectTitle() {},
    markDirty() {},
  })

  strictEqual(canvas.x, 0)
  strictEqual(canvas.y, 0)
  strictEqual(canvas.width, 1000)
  strictEqual(canvas.height, 1000)
}

/**
 * @brief 验证头像 URL 会被导出并在导入时恢复到人员节点数据。
 */
{
  const avatar = 'https://example.test/avatar.png'
  const data = {
    name: 'person',
    title: 'title',
    period: 'period',
    avatar,
  }

  strictEqual(serializePersonData(data).avatar, avatar)
  strictEqual(deserializePersonData(data).avatar, avatar)

  const project: ProjectFile = {
    version: PROJECT_FILE_VERSION,
    exportedAt: '2026-09-22T00:00:00.000Z',
    viewport: { x: 0, y: 0, zoom: 1 },
    canvas: { x: 0, y: 0, width: 1000, height: 1000 },
    nodes: [
      {
        id: 'n1',
        kind: 'person',
        position: { x: 100, y: 100 },
        size: { width: 180, height: 100 },
        data,
      },
    ],
    edges: [],
  }

  let importedAvatar: string | undefined
  performImport(project, {
    graph: {
      clearAll() {},
      importGraph(input) {
        importedAvatar = input.nodes[0]?.data.avatar
      },
      clampAllNodesToCanvas() {},
    },
    viewport: { panX: 0, panY: 0, zoom: 1 },
    canvas: { x: 0, y: 0, width: 1000, height: 1000 },
    setProjectTitle() {},
    markDirty() {},
  })

  strictEqual(importedAvatar, avatar)
}
