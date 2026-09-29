/**
 * @file projectImport.ts
 * @brief 提供项目文件格式识别、严格校验和导入后的图谱、视口、画布、标题状态恢复。
 * @author 项目维护者
 * @date 2026-09-22
 */

import type { GenealogyEdge, GenealogyNode } from '@/types'
import { deserializePersonData, type ProjectFile } from '@/types/serialization'
import {
  CANVAS_MIN_HEIGHT,
  CANVAS_MIN_WIDTH,
  PROJECT_FILE_VERSION,
} from '@/constants/constant'

/** @brief 国际化翻译函数。 */
type Translate = (key: string, args?: (string | number)[]) => string

/** @brief 与 Electron 文件路径规则一致的 ID 格式。 */
const SAFE_ID_PATTERN = /^[A-Za-z0-9_-]+$/

/** @brief 人员数据中允许出现的字符串字段。 */
const PERSON_DATA_STRING_FIELDS = ['name', 'nativeName', 'nativeName2', 'title', 'period', 'extra', 'avatar', 'color', 'badge']

/**
 * @interface ProjectImportDeps
 * @brief 执行项目导入时需要写入的外部状态依赖。
 */
export interface ProjectImportDeps {
  /** @brief 图谱写入接口。 */
  graph: {
    clearAll(): void
    importGraph(data: { nodes: GenealogyNode[]; edges: GenealogyEdge[] }): void
    clampAllNodesToCanvas(): void
  }
  /** @brief 视口写入接口，字段对应 useViewportStore。 */
  viewport: { panX: number; panY: number; zoom: number }
  /** @brief 画布写入接口。 */
  canvas: { x: number; y: number; width: number; height: number }
  /** @brief 设置项目标题。 */
  setProjectTitle(title: string): void
  /** @brief 标记项目已修改。 */
  markDirty(): void
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0
}

/** @brief 校验单个节点：id 唯一、kind、position、size 与 data 字符串字段。 */
function validateNode(raw: unknown, index: number, nodeIds: Set<string>): string | null {
  if (!isPlainObject(raw)) return `节点[${index}] 必须是对象`
  if (!isNonEmptyString(raw.id) || nodeIds.has(raw.id)) {
    return `节点[${index}] 缺少合法且唯一的 id`
  }
  nodeIds.add(raw.id)

  if (raw.kind !== 'person') return `节点[${index}] kind 不合法`

  const position = raw.position
  if (!isPlainObject(position) || !isFiniteNumber(position.x) || !isFiniteNumber(position.y)) {
    return `节点[${index}] 缺少合法的 position`
  }

  const size = raw.size
  if (
    !isPlainObject(size) ||
    !isFiniteNumber(size.width) ||
    !isFiniteNumber(size.height) ||
    size.width <= 0 ||
    size.height <= 0
  ) {
    return `节点[${index}] 缺少合法的 size`
  }

  if (raw.data === undefined || raw.data === null) return null
  if (!isPlainObject(raw.data)) return `节点[${index}] 的 data 必须是对象`

  for (const field of PERSON_DATA_STRING_FIELDS) {
    const value = raw.data[field]
    if (value !== undefined && value !== null && typeof value !== 'string') {
      return `节点[${index}] 的 data.${field} 必须是字符串`
    }
  }
  return null
}

/** @brief 校验单条连线：id 唯一、source/target 存在且引用已声明节点。 */
function validateEdge(
  raw: unknown,
  index: number,
  nodeIds: Set<string>,
  edgeIds: Set<string>,
  t: Translate,
): string | null {
  if (!isPlainObject(raw)) return `连线[${index}] 必须是对象`
  if (!isNonEmptyString(raw.id) || edgeIds.has(raw.id)) {
    return `连线[${index}] 缺少合法且唯一的 id`
  }
  edgeIds.add(raw.id)

  if (!isNonEmptyString(raw.source) || !isNonEmptyString(raw.target)) {
    return `连线[${index}] 缺少 source 或 target`
  }
  if (raw.type !== 'parent' && raw.type !== 'spouse') {
    return `连线[${index}] type 不合法：${String(raw.type)}`
  }
  if (raw.source === raw.target) return `连线[${index}] 的 source 与 target 不能相同`
  if (!nodeIds.has(raw.source)) return t('import.invalidEdge', [index, raw.source])
  if (!nodeIds.has(raw.target)) return t('import.invalidEdge', [index, raw.target])

  return null
}

/** @brief 校验存档 meta 与其所属 project 的数量与版本一致性。 */
function validateSaveMeta(meta: unknown, project: unknown): string | null {
  if (!isPlainObject(meta)) return 'meta 必须是对象'
  if (!isNonEmptyString(meta.id) || !SAFE_ID_PATTERN.test(meta.id)) return 'meta.id 不合法'
  if (!isNonEmptyString(meta.userId) || !SAFE_ID_PATTERN.test(meta.userId)) return 'meta.userId 不合法'
  if (typeof meta.name !== 'string' || meta.name.trim().length === 0) return 'meta.name 不合法'
  if (!isFiniteNumber(meta.createdAt) || !isFiniteNumber(meta.updatedAt)) return 'meta 时间戳不合法'

  const body = isPlainObject(project) ? project : {}
  if (meta.nodeCount !== (Array.isArray(body.nodes) ? body.nodes.length : -1)) {
    return 'meta.nodeCount 与 project.nodes 数量不一致'
  }
  if (meta.edgeCount !== (Array.isArray(body.edges) ? body.edges.length : -1)) {
    return 'meta.edgeCount 与 project.edges 数量不一致'
  }
  if (meta.projectVersion !== body.version) return 'meta.projectVersion 与 project.version 不一致'

  return null
}

/**
 * @brief 校验统一项目正文的结构合法性。
 * @param data 待校验的未知数据。
 * @param t 国际化翻译函数。
 * @return 校验失败时返回错误消息；校验通过时返回 null。
 */
export function validateProjectFile(data: unknown, t: Translate): string | null {
  if (!isPlainObject(data)) return t('import.notValidJson')
  if (!isNonEmptyString(data.version)) return t('import.missingVersion')
  if (data.version !== PROJECT_FILE_VERSION) {
    return `格式版本不支持：${data.version}，当前版本为 ${PROJECT_FILE_VERSION}`
  }
  if (!isNonEmptyString(data.exportedAt) || Number.isNaN(Date.parse(data.exportedAt))) {
    return '缺少合法的 exportedAt 时间字符串'
  }
  if (data.title !== undefined && typeof data.title !== 'string') return 'title 必须是字符串'

  const viewport = data.viewport
  if (!isPlainObject(viewport) || !isFiniteNumber(viewport.x) || !isFiniteNumber(viewport.y)) {
    return '缺少合法的 viewport'
  }
  if (!isFiniteNumber(viewport.zoom) || viewport.zoom <= 0) return 'viewport.zoom 必须大于 0'

  const canvas = data.canvas
  if (!isPlainObject(canvas) || !isFiniteNumber(canvas.x) || !isFiniteNumber(canvas.y)) {
    return '缺少合法的 canvas 坐标'
  }
  if (!isFiniteNumber(canvas.width) || !isFiniteNumber(canvas.height)) {
    return '缺少合法的 canvas 尺寸'
  }
  if (canvas.width < CANVAS_MIN_WIDTH || canvas.height < CANVAS_MIN_HEIGHT) {
    return `canvas 尺寸小于最小值 ${CANVAS_MIN_WIDTH}x${CANVAS_MIN_HEIGHT}`
  }

  if (!Array.isArray(data.nodes)) return t('import.missingNodes')
  const nodeIds = new Set<string>()
  for (const [index, node] of data.nodes.entries()) {
    const error = validateNode(node, index, nodeIds)
    if (error) return error
  }

  if (!Array.isArray(data.edges)) return t('import.missingEdges')
  const edgeIds = new Set<string>()
  for (const [index, edge] of data.edges.entries()) {
    const error = validateEdge(edge, index, nodeIds, edgeIds, t)
    if (error) return error
  }

  return null
}

/**
 * @interface ProjectPrepareResult
 * @brief 导入前的项目正文准备结果。
 */
export interface ProjectPrepareResult {
  /** @brief 通过校验的统一项目正文。 */
  project?: ProjectFile
  /** @brief 失败原因。 */
  error?: string
}

/**
 * @brief 识别导入格式并执行严格校验，输出统一项目正文。
 * @description 支持独立项目 JSON 和包含 meta + project 的完整存档；meta 只参与校验，不写入项目。
 * @param data 从文件解析出的未知数据。
 * @param t 国际化翻译函数。
 * @return 通过校验的统一项目正文，或明确失败原因。
 */
export function prepareProjectFile(data: unknown, t: Translate): ProjectPrepareResult {
  if (!isPlainObject(data)) return { error: t('import.notValidJson') }

  let project: unknown = data
  if ('project' in data) {
    if (!isPlainObject(data.project)) return { error: 'project 字段必须是对象' }
    const metaError = validateSaveMeta(data.meta, data.project)
    if (metaError) return { error: `存档元数据不合法：${metaError}` }
    project = data.project
  }

  const error = validateProjectFile(project, t)
  if (error) return { error }
  return { project: project as ProjectFile }
}

/**
 * @brief 执行数据导入并恢复图谱、视口、画布和标题状态。
 * @param project 已通过严格校验的统一项目正文。
 * @param deps 导入时需要写入的外部状态依赖。
 * @return 无返回值。
 */
export function performImport(project: ProjectFile, deps: ProjectImportDeps): void {
  const nodes: GenealogyNode[] = project.nodes.map(sn => ({
    id: sn.id,
    kind: 'person',
    position: { x: sn.position.x, y: sn.position.y },
    size: { width: sn.size.width, height: sn.size.height },
    data: deserializePersonData(sn.data),
  }))
  const edges: GenealogyEdge[] = project.edges.map(se => ({
    id: se.id,
    source: se.source,
    target: se.target,
    type: se.type,
  }))

  deps.graph.clearAll()

  // 画布必须先于节点写入：importGraph 会按当前画布边界裁剪节点位置。
  const { canvas } = project
  Object.assign(deps.canvas, {
    x: canvas.x,
    y: canvas.y,
    width: canvas.width,
    height: canvas.height,
  })
  deps.graph.importGraph({ nodes, edges })

  deps.viewport.panX = project.viewport.x
  deps.viewport.panY = project.viewport.y
  deps.viewport.zoom = project.viewport.zoom

  deps.graph.clampAllNodesToCanvas()
  deps.setProjectTitle(project.title ?? '')
  deps.markDirty()
}
