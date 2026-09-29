/**
 * @file minimapRenderer.ts - 小地图 Canvas 绘制
 */

import type { GenealogyEdge, GenealogyNode } from '@/types'
import { getNodeVisualBounds } from '@/utils/coords'
import { FONT_SERIF } from '@/utils/font'
import {
  DEFAULT_NODE_COLOR,
  MINIMAP_CORNER_RADIUS_FACTOR,
  MINIMAP_DPR,
  MINIMAP_EDGE_LINE_WIDTH_FACTOR,
  MINIMAP_EMPTY_FONT_SIZE,
  MINIMAP_MIN_BLOCK_H,
  MINIMAP_MIN_BLOCK_W,
} from '@/constants/constant'
import type { CanvasRectLike, MiniMapBounds, SizeLike, ViewportLike } from './minimapGeometry'
import { computeViewportRect, worldToMini } from './minimapGeometry'

export interface MiniMapRenderOptions {
  ctx: CanvasRenderingContext2D
  bounds: MiniMapBounds
  realSize: SizeLike
  screenSize: SizeLike
  canvasRect: CanvasRectLike
  nodes: GenealogyNode[]
  edges: GenealogyEdge[]
  getNode(id: string): GenealogyNode | undefined
  viewport: ViewportLike
  isDark: boolean
}

export function clearMiniMap(ctx: CanvasRenderingContext2D, realSize: SizeLike, isDark: boolean) {
  ctx.clearRect(0, 0, realSize.width, realSize.height)
  ctx.fillStyle = isDark ? '#1e1e2e' : '#ffffff'
  ctx.fillRect(0, 0, realSize.width, realSize.height)
}

export function drawEmptyMiniMap(ctx: CanvasRenderingContext2D, realSize: SizeLike, isDark: boolean) {
  ctx.fillStyle = isDark ? '#585b70' : '#adb5bd'
  ctx.font = `${MINIMAP_EMPTY_FONT_SIZE * MINIMAP_DPR}px ${FONT_SERIF}`
  ctx.textAlign = 'center'
  ctx.fillText('无节点', realSize.width / 2, realSize.height / 2)
}

export function drawMiniMap(options: MiniMapRenderOptions) {
  drawEdges(options)
  drawNodes(options)
  drawCanvasBounds(options)
  drawViewport(options)
}

function drawEdges(options: MiniMapRenderOptions) {
  const { ctx, bounds, edges, getNode, isDark, realSize, viewport } = options
  if (edges.length === 0) return

  for (const edge of edges) {
    const src = getNode(edge.source)
    const tgt = getNode(edge.target)
    if (!src || !tgt) continue
    if (src.kind !== 'person' || tgt.kind !== 'person') continue

    const srcCx = src.position.x + src.size.width / 2
    const srcCy = src.position.y + src.size.height / 2
    const tgtCx = tgt.position.x + tgt.size.width / 2
    const tgtCy = tgt.position.y + tgt.size.height / 2

    const a = worldToMini(srcCx, srcCy, bounds, realSize, viewport.zoom)
    const b = worldToMini(tgtCx, tgtCy, bounds, realSize, viewport.zoom)

    ctx.beginPath()
    ctx.moveTo(a.mx, a.my)
    ctx.lineTo(b.mx, b.my)

    if (edge.type === 'spouse') {
      ctx.strokeStyle = isDark ? 'rgba(166, 227, 161, 0.4)' : 'rgba(34, 197, 94, 0.3)'
    } else {
      ctx.strokeStyle = isDark ? 'rgba(69, 71, 90, 0.5)' : 'rgba(0, 0, 0, 0.1)'
    }
    ctx.lineWidth = MINIMAP_EDGE_LINE_WIDTH_FACTOR * MINIMAP_DPR
    ctx.stroke()
  }
}

function drawNodes(options: MiniMapRenderOptions) {
  const { ctx, bounds, nodes, realSize, viewport } = options

  for (const node of nodes) {
    if (node.kind !== 'person') continue

    const nodeBounds = getNodeVisualBounds(node)
    const a = worldToMini(nodeBounds.left, nodeBounds.top, bounds, realSize, viewport.zoom)
    const b = worldToMini(
      nodeBounds.left + nodeBounds.width,
      nodeBounds.top + nodeBounds.height,
      bounds,
      realSize,
      viewport.zoom,
    )

    let w = b.mx - a.mx
    let h = b.my - a.my
    if (w < MINIMAP_MIN_BLOCK_W * MINIMAP_DPR) w = MINIMAP_MIN_BLOCK_W * MINIMAP_DPR
    if (h < MINIMAP_MIN_BLOCK_H * MINIMAP_DPR) h = MINIMAP_MIN_BLOCK_H * MINIMAP_DPR

    ctx.fillStyle = node.data.color ?? DEFAULT_NODE_COLOR
    const r = MINIMAP_CORNER_RADIUS_FACTOR * MINIMAP_DPR
    ctx.beginPath()
    ctx.moveTo(a.mx + r, a.my)
    ctx.lineTo(a.mx + w - r, a.my)
    ctx.arcTo(a.mx + w, a.my, a.mx + w, a.my + r, r)
    ctx.lineTo(a.mx + w, a.my + h - r)
    ctx.arcTo(a.mx + w, a.my + h, a.mx + w - r, a.my + h, r)
    ctx.lineTo(a.mx + r, a.my + h)
    ctx.arcTo(a.mx, a.my + h, a.mx, a.my + h - r, r)
    ctx.lineTo(a.mx, a.my + r)
    ctx.arcTo(a.mx, a.my, a.mx + r, a.my, r)
    ctx.closePath()
    ctx.fill()
  }
}

function drawCanvasBounds(options: MiniMapRenderOptions) {
  const { ctx, bounds, canvasRect, isDark, realSize, viewport } = options
  const a = worldToMini(canvasRect.x, canvasRect.y, bounds, realSize, viewport.zoom)
  const b = worldToMini(
    canvasRect.x + canvasRect.width,
    canvasRect.y + canvasRect.height,
    bounds,
    realSize,
    viewport.zoom
  )

  ctx.save()
  ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)'
  ctx.lineWidth = 1 * MINIMAP_DPR
  ctx.setLineDash([4 * MINIMAP_DPR, 4 * MINIMAP_DPR])
  ctx.strokeRect(a.mx, a.my, b.mx - a.mx, b.my - a.my)
  ctx.restore()
}

function drawViewport(options: MiniMapRenderOptions) {
  const { ctx, bounds, isDark, realSize, screenSize, viewport } = options
  const vr = computeViewportRect(bounds, realSize, viewport, screenSize)
  const w = vr.right - vr.left
  const h = vr.bottom - vr.top

  ctx.fillStyle = isDark ? 'rgba(137, 180, 250, 0.15)' : 'rgba(59, 130, 246, 0.1)'
  ctx.fillRect(vr.left, vr.top, w, h)

  ctx.strokeStyle = isDark ? '#89b4fa' : '#3b82f6'
  ctx.lineWidth = 1 * MINIMAP_DPR
  ctx.strokeRect(vr.left, vr.top, w, h)
}
