/**
 * @file canvasStore.ts - 画布矩形状态管理
 * @brief 管理画布矩形的位置和尺寸。画布矩形仅作为视觉参考框架，
 *        不限制节点坐标，不影响平移/拖拽/布局。
 *
 *        初始矩形: (0, 0, 1000, 1000)
 *        最小矩形: 200×200
 *        伸展步长: 100 单位
 *
 * @author 自动生成
 * @date 2026-08-04
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  CANVAS_INITIAL_WIDTH,
  CANVAS_INITIAL_HEIGHT,
  CANVAS_MIN_WIDTH,
  CANVAS_MIN_HEIGHT,
  CANVAS_EXPAND_STEP,
  CANVAS_FIT_PADDING
} from '@/constants/constant'

/** 伸展/收缩方向 */
export type ExpandDirection = 'left' | 'right' | 'top' | 'bottom'

export const useCanvasStore = defineStore('canvas', () => {
  // ===== 状态 =====
  /** 画布矩形左上角世界 X 坐标 */
  const x = ref(0)
  /** 画布矩形左上角世界 Y 坐标 */
  const y = ref(0)
  /** 画布矩形宽度 */
  const width = ref(CANVAS_INITIAL_WIDTH)
  /** 画布矩形高度 */
  const height = ref(CANVAS_INITIAL_HEIGHT)

  // ===== 计算属性 =====

  /** 画布矩形边界 */
  const bounds = computed(() => ({
    x: x.value,
    y: y.value,
    width: width.value,
    height: height.value
  }))

  /** 尺寸标签，如 "1000×1000" */
  const sizeLabel = computed(() => `${width.value}×${height.value}`)

  // ===== 动作 =====

  /**
   * @brief 向指定方向伸展画布矩形
   * @param direction - 伸展方向
   * @param step - 伸展步长（默认 CANVAS_EXPAND_STEP）
   */
  function expand(direction: ExpandDirection, step: number = CANVAS_EXPAND_STEP) {
    switch (direction) {
      case 'right':
        width.value += step
        break
      case 'bottom':
        height.value += step
        break
      case 'left':
        x.value -= step
        width.value += step
        break
      case 'top':
        y.value -= step
        height.value += step
        break
    }
  }

  /**
   * @brief 向指定方向收缩画布矩形
   * @param direction - 收缩方向
   * @param step - 收缩步长（默认 CANVAS_EXPAND_STEP）
   */
  function shrink(direction: ExpandDirection, step: number = CANVAS_EXPAND_STEP) {
    switch (direction) {
      case 'right':
        width.value = Math.max(CANVAS_MIN_WIDTH, width.value - step)
        break
      case 'bottom':
        height.value = Math.max(CANVAS_MIN_HEIGHT, height.value - step)
        break
      case 'left':
        if (width.value - step >= CANVAS_MIN_WIDTH) {
          x.value += step
          width.value -= step
        }
        break
      case 'top':
        if (height.value - step >= CANVAS_MIN_HEIGHT) {
          y.value += step
          height.value -= step
        }
        break
    }
  }

  /**
   * @brief 调整画布矩形以包裹所有节点
   * @param nodesAABB - 所有节点的包围盒 { minX, minY, maxX, maxY }
   */
  function fitToNodes(nodesAABB: { minX: number; minY: number; maxX: number; maxY: number }) {
    const pad = CANVAS_FIT_PADDING

    const newX = nodesAABB.minX - pad
    const newY = nodesAABB.minY - pad
    const newWidth = Math.max(CANVAS_MIN_WIDTH, nodesAABB.maxX - nodesAABB.minX + pad * 2)
    const newHeight = Math.max(CANVAS_MIN_HEIGHT, nodesAABB.maxY - nodesAABB.minY + pad * 2)

    x.value = newX
    y.value = newY
    width.value = newWidth
    height.value = newHeight
  }

  /**
   * @brief 重置画布矩形到初始状态 (0, 0, 1000, 1000)
   */
  function reset() {
    x.value = 0
    y.value = 0
    width.value = CANVAS_INITIAL_WIDTH
    height.value = CANVAS_INITIAL_HEIGHT
  }

  return {
    // 状态
    x,
    y,
    width,
    height,
    // 计算
    bounds,
    sizeLabel,
    // 动作
    expand,
    shrink,
    fitToNodes,
    reset
  }
})
