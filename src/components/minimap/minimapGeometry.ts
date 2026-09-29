/**
 * @file minimapGeometry.ts - 小地图几何计算
 */

import type { GenealogyNode } from '@/types'
import { isPersonNode } from '@/types'
import { getNodeVisualBounds } from '@/utils/coords'
import {
  MINIMAP_BOUNDS_PADDING,
  MINIMAP_MIN_SCALE,
  MINIMAP_SINGLE_BOUNDS_HALF_H,
  MINIMAP_SINGLE_BOUNDS_HALF_W,
} from '@/constants/constant'

export interface MiniMapBounds {
  minX: number
  minY: number
  maxX: number
  maxY: number
  width: number
  height: number
}

export interface CanvasRectLike {
  x: number
  y: number
  width: number
  height: number
}

export interface ViewportLike {
  panX: number
  panY: number
  zoom: number
}

export interface SizeLike {
  width: number
  height: number
}

export interface MiniMapPoint {
  mx: number
  my: number
}

export interface WorldPoint {
  wx: number
  wy: number
}

export interface MiniMapViewportRect {
  left: number
  top: number
  right: number
  bottom: number
}

export function canvasBoundsToWorldBounds(canvas: CanvasRectLike): MiniMapBounds {
  const x1 = canvas.x
  const y1 = canvas.y
  const x2 = x1 + canvas.width
  const y2 = y1 + canvas.height
  return {
    minX: x1 - MINIMAP_BOUNDS_PADDING,
    minY: y1 - MINIMAP_BOUNDS_PADDING,
    maxX: x2 + MINIMAP_BOUNDS_PADDING,
    maxY: y2 + MINIMAP_BOUNDS_PADDING,
    width: canvas.width + MINIMAP_BOUNDS_PADDING * 2,
    height: canvas.height + MINIMAP_BOUNDS_PADDING * 2,
  }
}

export function computeWorldBounds(nodes: GenealogyNode[], canvas: CanvasRectLike): MiniMapBounds {
  const personNodes = nodes.filter(isPersonNode)
  if (personNodes.length === 0) {
    return canvasBoundsToWorldBounds(canvas)
  }

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  for (const node of personNodes) {
    const nodeBounds = getNodeVisualBounds(node)
    const x1 = nodeBounds.left
    const y1 = nodeBounds.top
    const x2 = nodeBounds.left + nodeBounds.width
    const y2 = nodeBounds.top + nodeBounds.height
    if (x1 < minX) minX = x1
    if (y1 < minY) minY = y1
    if (x2 > maxX) maxX = x2
    if (y2 > maxY) maxY = y2
  }

  if (maxX - minX < 1 && maxY - minY < 1) {
    const cx = (minX + maxX) / 2
    const cy = (minY + maxY) / 2
    minX = cx - MINIMAP_SINGLE_BOUNDS_HALF_W
    minY = cy - MINIMAP_SINGLE_BOUNDS_HALF_H
    maxX = cx + MINIMAP_SINGLE_BOUNDS_HALF_W
    maxY = cy + MINIMAP_SINGLE_BOUNDS_HALF_H
  }

  const canvasX1 = canvas.x
  const canvasY1 = canvas.y
  const canvasX2 = canvas.x + canvas.width
  const canvasY2 = canvas.y + canvas.height
  if (canvasX1 < minX) minX = canvasX1
  if (canvasY1 < minY) minY = canvasY1
  if (canvasX2 > maxX) maxX = canvasX2
  if (canvasY2 > maxY) maxY = canvasY2

  return {
    minX: minX - MINIMAP_BOUNDS_PADDING,
    minY: minY - MINIMAP_BOUNDS_PADDING,
    maxX: maxX + MINIMAP_BOUNDS_PADDING,
    maxY: maxY + MINIMAP_BOUNDS_PADDING,
    width: maxX - minX + MINIMAP_BOUNDS_PADDING * 2,
    height: maxY - minY + MINIMAP_BOUNDS_PADDING * 2,
  }
}

export function getFitScale(bounds: MiniMapBounds, realSize: SizeLike): number {
  const scaleX = realSize.width / bounds.width
  const scaleY = realSize.height / bounds.height
  return Math.min(scaleX, scaleY)
}

export function getEffectiveScale(bounds: MiniMapBounds, realSize: SizeLike, zoom: number): number {
  const fitScale = getFitScale(bounds, realSize)
  const zoomFactor = Math.min(1.0, zoom)
  return fitScale * Math.max(MINIMAP_MIN_SCALE, zoomFactor)
}

export function worldToMini(
  wx: number,
  wy: number,
  bounds: MiniMapBounds,
  realSize: SizeLike,
  zoom: number
): MiniMapPoint {
  const scale = getEffectiveScale(bounds, realSize, zoom)
  const offsetX = (realSize.width - bounds.width * scale) / 2
  const offsetY = (realSize.height - bounds.height * scale) / 2

  return {
    mx: (wx - bounds.minX) * scale + offsetX,
    my: (wy - bounds.minY) * scale + offsetY,
  }
}

export function miniToWorld(
  mx: number,
  my: number,
  bounds: MiniMapBounds,
  realSize: SizeLike,
  zoom: number
): WorldPoint {
  const scale = getEffectiveScale(bounds, realSize, zoom)
  const offsetX = (realSize.width - bounds.width * scale) / 2
  const offsetY = (realSize.height - bounds.height * scale) / 2

  return {
    wx: (mx - offsetX) / scale + bounds.minX,
    wy: (my - offsetY) / scale + bounds.minY,
  }
}

export function computeViewportRect(
  bounds: MiniMapBounds,
  realSize: SizeLike,
  viewport: ViewportLike,
  screenSize: SizeLike
): MiniMapViewportRect {
  const worldLeft = (0 - viewport.panX) / viewport.zoom
  const worldTop = (0 - viewport.panY) / viewport.zoom
  const worldRight = worldLeft + screenSize.width / viewport.zoom
  const worldBottom = worldTop + screenSize.height / viewport.zoom

  const tl = worldToMini(worldLeft, worldTop, bounds, realSize, viewport.zoom)
  const br = worldToMini(worldRight, worldBottom, bounds, realSize, viewport.zoom)

  return {
    left: tl.mx,
    top: tl.my,
    right: br.mx,
    bottom: br.my,
  }
}

export function isInsideViewport(mx: number, my: number, vr: MiniMapViewportRect): boolean {
  return mx >= vr.left && mx <= vr.right && my >= vr.top && my <= vr.bottom
}
