<template>
  <div
    class="person-node"
    :class="{
      'is-selected': selected,
      'is-hovered': hovered,
      'is-dragging': dragging,
      'is-recently-created': recent
    }"
    :style="nodeStyle"
    @mousedown.stop="onDragStart"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
  >
    <!-- 右上角编号圆标 -->
    <div v-if="node.data.badge != null" class="node-badge" :style="badgeStyle">
      {{ node.data.badge }}
    </div>

    <!-- 左侧嵌入头像（仅特殊节点） -->
    <div v-if="avatarUrl" class="node-avatar">
      <img v-if="!avatarLoadFailed" :src="avatarUrl" alt="avatar" @error="onAvatarError" />
    </div>

    <!-- 卡片正文 -->
    <div class="node-body" :style="nodeBodyStyle">
      <div class="node-name">{{ node.data.name }}</div>
      <div v-if="node.data.nativeName" class="node-native-name">{{ node.data.nativeName }}</div>
      <div v-if="node.data.nativeName2" class="node-native-name">{{ node.data.nativeName2 }}</div>
      <div class="node-title">{{ node.data.title }}</div>
      <div class="node-period">{{ node.data.period }}</div>
      <div v-if="node.data.extra" class="node-extra">{{ node.data.extra }}</div>
    </div>

    <!-- 四方向 Handle（hover 时显示） -->
    <template v-if="showHandles">
      <NodeHandle :node-id="node.id" position="top" />
      <NodeHandle :node-id="node.id" position="bottom" />
      <NodeHandle :node-id="node.id" position="left" />
      <NodeHandle :node-id="node.id" position="right" />
    </template>
  </div>
</template>

<script setup lang="ts">
/**
 * @file PersonNode.vue - 人物节点组件
 * @brief 谱系图中的人物卡片节点。显示人物姓名、头衔、生卒年份、头像等。
 *        支持分组颜色、选中高亮、hover 显示连线手柄、拖拽移动。
 * @author 自动生成
 * @date 2026-07-31
 */
import { ref, computed, inject, watch, type Ref } from 'vue'
import type { PersonNode } from '@/types'
import NodeHandle from './NodeHandle.vue'
import { useSelectionStore } from '@/stores/selectionStore'
import {
  DEFAULT_NODE_COLOR,
  LUM_R_COEFF,
  LUM_G_COEFF,
  LUM_B_COEFF,
  LUMINANCE_THRESHOLD,
  AVATAR_WIDTH,
  AVATAR_GAP,
  NODE_PADDING_X,
  HANDLE_HIDE_DELAY_MS,
} from '@/constants/constant'
import { getNodeVisualBounds, normalizeAvatarUrl } from '@/utils/coords'

const props = defineProps<{
  node: PersonNode
  selected: boolean
  recent: boolean
}>()

const emit = defineEmits<{
  (e: 'dragStart', nodeId: string, event: MouseEvent): void
  (e: 'select', nodeId: string, event: MouseEvent): void
}>()

// ===== 状态 =====
/** 是否处于鼠标悬停状态 */
const hovered = ref(false)
/** 是否正在拖拽 */
const dragging = ref(false)
/** 是否显示连线手柄 */
const showHandles = ref(false)
/** 当前头像资源是否加载失败 */
const avatarLoadFailed = ref(false)
/** 手柄延迟隐藏定时器 */
let hideTimer: ReturnType<typeof setTimeout> | null = null
const selection = useSelectionStore()

const globalDraggingNodeId = inject<Ref<string | null>>('draggingNodeId', ref(null))
watch(
  () => selection.hoveredNodeId,
  (id) => {
    hovered.value = id === props.node.id
    showHandles.value = id === props.node.id
  },
  { immediate: true }
)
watch(
  globalDraggingNodeId,
  (id) => {
    dragging.value = id === props.node.id
  },
  { immediate: true }
)

// ===== 分组色（用于边框等） =====
/** 节点的分组颜色，默认 #cba6f7 */
const groupColor = computed(() => props.node.data.color ?? DEFAULT_NODE_COLOR)

// ===== 文字颜色：根据背景色亮度自动选择黑/白 =====
/**
 * @brief 根据节点背景色亮度计算合适的文字颜色
 * @description 使用相对亮度公式计算背景色的明度，浅色背景用黑字，深色背景用白字。
 * @returns CSS 变量引用
 */
const textColor = computed(() => {
  const hex = groupColor.value
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const luminance = (LUM_R_COEFF * r + LUM_G_COEFF * g + LUM_B_COEFF * b) / 255
  return luminance > LUMINANCE_THRESHOLD ? 'var(--node-text-light-bg)' : 'var(--node-text-dark-bg)'
})

// ===== 头像状态 =====
/**
 * @brief 头像 URL，自动补全协议前缀
 * @description 若 avatar 不以 http/https/data: 开头，自动添加 https:// 前缀。
 * @returns 头像 URL 或空字符串
 */
const avatarUrl = computed(() => {
  return normalizeAvatarUrl(props.node.data.avatar)
})
/** 是否有头像 */
const hasAvatar = computed(() => !!avatarUrl.value)

watch(
  avatarUrl,
  () => {
    avatarLoadFailed.value = false
  }
)

// ===== 节点样式：有头像时使用视觉尺寸，视觉中心不变 =====
/**
 * @brief 计算节点的 CSS 定位样式
 * @description 无头像时使用原始块尺寸；有头像时宽度增加头像宽度，高度增加头像额外高度。
 * @returns CSS 定位样式对象
 */
const nodeStyle = computed(() => {
  const bounds = getNodeVisualBounds(props.node)
  return {
    '--avatar-width': `${AVATAR_WIDTH}px`,
    left: `${bounds.left}px`,
    top: `${bounds.top}px`,
    width: `${bounds.width}px`,
    height: `${bounds.height}px`,
    background: groupColor.value
  }
})

const nodeBodyStyle = computed(() => ({
  '--text-color': textColor.value,
  paddingLeft: hasAvatar.value ? `${AVATAR_WIDTH + AVATAR_GAP}px` : `${NODE_PADDING_X}px`,
}))

// ===== 编号圆标样式：背景跟随卡片色、文字跟随自适应文字色 =====
/** 右上角编号圆标的 CSS 样式 */
const badgeStyle = computed(() => ({
  background: groupColor.value,
  color: textColor.value
}))

// ===== hover 控制 Handle 显示 =====
/**
 * @brief 鼠标进入节点：显示连线手柄
 */
function onMouseEnter() {
  selection.setHoveredNode(props.node.id)
  if (hideTimer) { clearTimeout(hideTimer); hideTimer = null }
}

/**
 * @brief 鼠标离开节点：延迟隐藏连线手柄（给 Handle 点击留时间）
 */
function onMouseLeave() {
  // 延迟隐藏，给 Handle 点击留时间
  hideTimer = setTimeout(() => {
    if (selection.hoveredNodeId === props.node.id) {
      selection.setHoveredNode(null)
    }
  }, HANDLE_HIDE_DELAY_MS)
}

function onAvatarError() {
  avatarLoadFailed.value = true
}

// ===== 拖拽 =====
/**
 * @brief 节点拖拽启动
 * @description 仅响应左键。触发 dragStart 和 select 事件。
 * @param event - 鼠标按下事件
 */
function onDragStart(event: MouseEvent) {
  if (event.button !== 0) return
  event.stopPropagation()
  emit('dragStart', props.node.id, event)
  emit('select', props.node.id, event)
}
</script>

<style scoped>
.person-node {
  position: absolute;
  display: flex;
  border-radius: 0;
  border: 0;
  cursor: grab;
  user-select: none;
  transition: box-shadow 0.12s;
  overflow: visible;
  font-family: var(--font-serif);
}

.person-node:hover,
.person-node.is-hovered {
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.3);
}

.person-node.is-selected {
  box-shadow: 0 0 0 2px rgba(137, 180, 250, 0.5);
}

.person-node.is-dragging {
  cursor: grabbing;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  z-index: 1000;
}

.person-node.is-recently-created {
  animation: recent-node-flash 0.9s ease-out;
}

@keyframes recent-node-flash {
  0% {
    box-shadow: 0 0 0 2px rgba(166, 227, 161, 0.95), 0 0 0 10px rgba(166, 227, 161, 0.28);
  }
  100% {
    box-shadow: 0 0 0 2px rgba(137, 180, 250, 0.5), 0 0 0 0 rgba(166, 227, 161, 0);
  }
}

/* 节点内容 */
.node-body {
  flex: 1;
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
  text-align: center;
  gap: 2px;
  font-family: var(--font-serif);
}

.node-name {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-color);
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.node-title {
  font-size: 11px;
  font-weight: 500;
  color: var(--text-color);
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.node-period {
  font-size: 10px;
  color: var(--text-color);
  line-height: 1.3;
}

.node-extra {
  font-size: 9px;
  color: var(--text-color);
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 本国文字行 */
.node-native-name {
  font-size: 13px;
  color: var(--text-color);
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 编号圆标 — 圆心在卡片右上角端点 */
.node-badge {
  position: absolute;
  right: 0;
  top: 0;
  transform: translate(50%, -50%);
  width: 24px;
  height: 24px;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
}

/* 嵌入头像：左侧头像宽度 × 块全高，cover 裁剪不拉伸，无边距贴边 */
.node-avatar {
  position: absolute;
  left: 0;
  top: 0;
  width: var(--avatar-width);
  height: 100%;
  overflow: hidden;
  z-index: 2;
}

.node-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
