/**
 * @file coords.ts - 坐标转换工具
 * @brief 提供屏幕坐标 ↔ 坐标纸绝对坐标的互转函数，以及鼠标位置获取。
 *
 *        三种坐标系统：
 *        - Screen  — 屏幕坐标（鼠标 clientX/Y 相对画布容器）
 *        - Absolute — 坐标纸/画布中的绝对坐标，对应右侧栏 X/Y
 *        - VisualBounds — 根据绝对坐标和节点尺寸得到的视觉包围盒
 * @author 自动生成
 * @date 2026-07-31
 */
import type { GenealogyNode, Position, Size } from '@/types'
import {
  AVATAR_WIDTH,
  AVATAR_EXTRA_HEIGHT,
  DEFAULT_NODE_WIDTH,
  DEFAULT_NODE_HEIGHT,
} from '@/constants/constant'

/**
 * @brief 视觉包围盒（坐标纸绝对坐标系）
 */
export interface VisualBounds {
  left: number
  top: number
  width: number
  height: number
}

export function normalizeAvatarUrl(raw: string | undefined): string {
  if (!raw) return ''
  if (/^https?:\/\//i.test(raw) || raw.startsWith('data:')) return raw
  return 'https://' + raw
}

export function hasNodeAvatar(node: GenealogyNode): boolean {
  return node.kind === 'person' && normalizeAvatarUrl(node.data.avatar).length > 0
}

export function getAvatarExpansion(hasAvatar: boolean): Size {
  return {
    width: hasAvatar ? AVATAR_WIDTH : 0,
    height: hasAvatar ? AVATAR_EXTRA_HEIGHT : 0,
  }
}

export function getStoredNodeSize(): Size {
  return {
    width: DEFAULT_NODE_WIDTH,
    height: DEFAULT_NODE_HEIGHT,
  }
}

export function normalizeStoredNodeSize(): Size {
  return getStoredNodeSize()
}

export function getVisualSize(size: Size, hasAvatar: boolean): Size {
  const expansion = getAvatarExpansion(hasAvatar)
  return {
    width: size.width + expansion.width,
    height: size.height + expansion.height,
  }
}

/**
 * @brief 获取节点的视觉包围盒（坐标纸绝对坐标系）
 * @description 有头像时，节点向左扩展 AVATAR_WIDTH/2、向上扩展 AVATAR_EXTRA_HEIGHT/2，
 *              宽度增加 AVATAR_WIDTH、高度增加 AVATAR_EXTRA_HEIGHT。
 * @param pos - 节点绝对坐标（右侧栏 X/Y，当前锚点为视觉中心）
 * @param size - 节点原始尺寸
 * @param hasAvatar - 是否有头像
 * @returns 视觉包围盒
 */
export function getVisualBounds(
  pos: Position,
  size: Size,
  hasAvatar: boolean
): VisualBounds {
  const expansion = getAvatarExpansion(hasAvatar)
  const visualSize = getVisualSize(size, hasAvatar)
  // position 为节点中心 → 视觉包围盒也以 center 为准
  return {
    left: pos.x - visualSize.width / 2,
    top: pos.y - visualSize.height / 2,
    width: size.width + expansion.width,
    height: size.height + expansion.height
  }
}

export function getNodeVisualBounds(node: GenealogyNode): VisualBounds {
  return getVisualBounds(node.position, normalizeStoredNodeSize(), hasNodeAvatar(node))
}

export function getNodeVisualSize(node: GenealogyNode): Size {
  return getVisualSize(normalizeStoredNodeSize(), hasNodeAvatar(node))
}

/**
 * @brief 屏幕坐标 → 坐标纸绝对坐标
 * @description screenX → absoluteX = (screenX - panX) / zoom
 * @param screen - 屏幕坐标
 * @param panX - 画布 X 平移量
 * @param panY - 画布 Y 平移量
 * @param zoom - 缩放级别
 * @returns 坐标纸绝对坐标
 */
export function screenToWorld(
  screen: Position,
  panX: number,
  panY: number,
  zoom: number
): Position {
  return {
    x: (screen.x - panX) / zoom,
    y: (screen.y - panY) / zoom
  }
}

/**
 * @brief 坐标纸绝对坐标 → 屏幕坐标
 * @description absoluteX → screenX = absoluteX * zoom + panX
 * @param world - 坐标纸绝对坐标
 * @param panX - 画布 X 平移量
 * @param panY - 画布 Y 平移量
 * @param zoom - 缩放级别
 * @returns 屏幕坐标
 */
export function worldToScreen(
  world: Position,
  panX: number,
  panY: number,
  zoom: number
): Position {
  return {
    x: world.x * zoom + panX,
    y: world.y * zoom + panY
  }
}

/**
 * @brief 获取鼠标相对于某元素的屏幕坐标
 * @param event - 鼠标事件
 * @param container - 容器 HTMLElement
 * @returns 相对于容器左上角的坐标
 */
export function getMousePosition(
  event: MouseEvent,
  container: HTMLElement
): Position {
  const rect = container.getBoundingClientRect()
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  }
}
