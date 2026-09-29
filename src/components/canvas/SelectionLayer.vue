<template>
  <!-- 框选虚线矩形：鼠标左键按住拖拽时显示 -->
  <div
    v-if="selection.selectionRectVisible"
    class="selection-rect"
    :style="rectStyle"
  />
</template>

<script setup lang="ts">
/**
 * @file SelectionLayer.vue - 框选图层
 * @brief 提供鼠标左键拖拽框选功能，用于批量选取画布上的人物节点。
 *        框选矩形使用屏幕坐标计算，通过视口变换矩阵将屏幕坐标映射到世界坐标进行相交检测。
 * @author 自动生成
 * @date 2026-07-31
 */
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useSelectionStore } from '@/stores/selectionStore'
import { useViewportStore } from '@/stores/viewportStore'
import { useGraphStore } from '@/stores/graphStore'
import { useConnectionStore } from '@/stores/connectionStore'
import { isPersonNode } from '@/types'
import { SELECTION_DRAG_THRESHOLD } from '@/constants/constant'
import { getNodeVisualBounds, worldToScreen } from '@/utils/coords'

const selection = useSelectionStore()
const viewport = useViewportStore()
const graph = useGraphStore()
const connection = useConnectionStore()

const props = defineProps<{
  containerRef: HTMLElement | null
  interactive?: boolean
}>()

// ===== 框选状态 =====
/** 是否正在框选中 */
/** 框选起始 X 坐标（容器相对坐标） */
const startX = ref(0)
/** 框选起始 Y 坐标（容器相对坐标） */
const startY = ref(0)
/** 框选当前 X 坐标（容器相对坐标） */
const currentX = ref(0)
/** 框选当前 Y 坐标（容器相对坐标） */
const currentY = ref(0)

// ===== 矩形样式（屏幕坐标，始终从左上角展开） =====
/** 框选虚线矩形的 CSS 样式 */
const rectStyle = computed(() => ({
  left: `${Math.min(selection.selectionRect.startX, selection.selectionRect.currentX)}px`,
  top: `${Math.min(selection.selectionRect.startY, selection.selectionRect.currentY)}px`,
  width: `${Math.abs(selection.selectionRect.currentX - selection.selectionRect.startX)}px`,
  height: `${Math.abs(selection.selectionRect.currentY - selection.selectionRect.startY)}px`
}))

// ===== 事件处理 =====
/**
 * @brief 鼠标按下事件：启动框选
 * @description 仅响应左键。连线状态下、点击节点或 Handle 时均不触发框选。
 *              框选开始时自动清除已有选区。
 * @param event - 鼠标按下事件
 */
function onMouseDown(event: MouseEvent) {
  if (props.interactive === false) return
  // 仅响应左键
  if (event.button !== 0) return
  // 连线状态下不触发框选
  if (connection.connecting) return
  // 点击节点或 Handle 时不触发框选
  if ((event.target as HTMLElement).closest('.person-node, .node-handle')) return

  const el = props.containerRef
  if (!el) return

  const r = el.getBoundingClientRect()
  startX.value = event.clientX - r.left
  startY.value = event.clientY - r.top
  currentX.value = startX.value
  currentY.value = startY.value
  selection.startSelectionRect(startX.value, startY.value)

  // 框选总是新建选区
  selection.clearSelection()

  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
}

/**
 * @brief 鼠标移动事件：更新框选矩形
 * @param event - 鼠标移动事件
 */
function onMouseMove(event: MouseEvent) {
  if (!selection.selectionRectVisible) return
  const el = props.containerRef
  if (!el) return
  const r = el.getBoundingClientRect()
  currentX.value = event.clientX - r.left
  currentY.value = event.clientY - r.top
  selection.updateSelectionRect(currentX.value, currentY.value)
}

/**
 * @brief 鼠标松开事件：完成框选
 * @description 仅当拖拽距离超过 3px 时执行选区计算，否则视为单击（不改变选区）。
 */
function onMouseUp() {
  if (!selection.selectionRectVisible) { cleanup(); return }
  if (Math.abs(currentX.value - startX.value) > SELECTION_DRAG_THRESHOLD || Math.abs(currentY.value - startY.value) > SELECTION_DRAG_THRESHOLD) {
    performSelection()
  }
  selection.endSelectionRect()
  cleanup()
}

/**
 * @brief 清理全局鼠标事件监听
 */
function cleanup() {
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
}

/**
 * @brief 节点屏幕矩形与框选矩形相交检测
 * @description 遍历所有人物节点，将节点世界坐标转换为屏幕坐标后
 *              与框选矩形进行 AABB 相交检测，将相交的节点 ID 设置到选区。
 */
function performSelection() {
  const sl = Math.min(startX.value, currentX.value)
  const st = Math.min(startY.value, currentY.value)
  const sr = Math.max(startX.value, currentX.value)
  const sb = Math.max(startY.value, currentY.value)

  const ids: string[] = []
  for (const node of graph.nodes) {
    if (!isPersonNode(node)) continue

    const bounds = getNodeVisualBounds(node)
    const topLeft = worldToScreen({ x: bounds.left, y: bounds.top }, viewport.panX, viewport.panY, viewport.zoom)
    const nx = topLeft.x
    const ny = topLeft.y
    const nw = bounds.width * viewport.zoom
    const nh = bounds.height * viewport.zoom
    if (nx < sr && nx + nw > sl && ny < sb && ny + nh > st) {
      ids.push(node.id)
    }
  }
  selection.setSelectedNodes(ids)
}

// ===== 响应式挂载 =====
watch(
  () => props.containerRef,
  (cur, prev) => {
    prev?.removeEventListener('mousedown', onMouseDown)
    if (props.interactive !== false) {
      cur?.addEventListener('mousedown', onMouseDown)
    }
  }
)

onMounted(() => {
  if (props.interactive !== false) {
    props.containerRef?.addEventListener('mousedown', onMouseDown)
  }
})

onUnmounted(() => {
  props.containerRef?.removeEventListener('mousedown', onMouseDown)
  cleanup()
  if (props.interactive !== false) {
    selection.endSelectionRect()
  }
})
</script>

<style scoped>
.selection-rect {
  position: absolute;
  border: 1.5px dashed var(--accent-blue);
  background: rgba(137, 180, 250, 0.06);
  border-radius: 2px;
  pointer-events: none;
  z-index: 200;
}
</style>
