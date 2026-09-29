<template>
  <div
    class="node-handle"
    :class="[position, { 'is-connecting': connection.connecting }]"
    @mousedown.stop="onMouseDown"
    @mouseup.stop="onMouseUp"
  >
    <div class="handle-dot">
      <svg class="handle-plus" viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg">
        <line x1="5" y1="1" x2="5" y2="9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        <line x1="1" y1="5" x2="9" y2="5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * @file NodeHandle.vue - 节点连接手柄组件
 * @brief 显示在人物节点四边的十字连线手柄，支持 hover 显示、点击启动连线、
 *        再次点击完成连线。四方向（top/bottom/left/right）各一个手柄。
 * @author 自动生成
 * @date 2026-07-31
 */
import { inject, ref, type Ref } from 'vue'
import { useConnectionStore } from '@/stores/connectionStore'
import type { HandlePosition } from '@/stores/connectionStore'

const props = defineProps<{
  nodeId: string
  position: HandlePosition
}>()

const connection = useConnectionStore()

// B16 fix: 注入连接处理标志位，mouseup 完成连线时设为 true 阻止误取消
const connectionHandled = inject<Ref<boolean>>('connectionHandled', ref(false))

/**
 * @brief 手柄鼠标按下事件
 * @description 若当前正在连线且目标不是自己，则完成连线；
 *              否则以当前节点为源启动新连线。
 * @param event - 鼠标按下事件
 */
function onMouseDown(event: MouseEvent) {
  if (event.button !== 0) return
  if (connection.connecting && connection.sourceNodeId !== props.nodeId) {
    connectionHandled.value = true
    connection.completeConnection(props.nodeId)
    return
  }
  connection.startConnection(props.nodeId, props.position)
}

/**
 * @brief 手柄鼠标松开事件：若目标不是自己则完成连线
 * @param event - 鼠标松开事件
 */
function onMouseUp(event: MouseEvent) {
  if (connection.connecting && connection.sourceNodeId !== props.nodeId) {
    event.stopPropagation()
    connectionHandled.value = true
    connection.completeConnection(props.nodeId)
  }
}
</script>

<style scoped>
.node-handle {
  position: absolute;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
}

.node-handle.top {
  top: -9px;
  left: 50%;
  transform: translateX(-50%);
}

.node-handle.bottom {
  bottom: -9px;
  left: 50%;
  transform: translateX(-50%);
}

.node-handle.left {
  left: -9px;
  top: 50%;
  transform: translateY(-50%);
}

.node-handle.right {
  right: -9px;
  top: 50%;
  transform: translateY(-50%);
}

.handle-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--border-default);
  border: 1.5px solid var(--border-light);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: crosshair;
  transition: all 0.12s;
  color: transparent;
}

.handle-dot .handle-plus {
  width: 8px;
  height: 8px;
  opacity: 0;
  transition: opacity 0.12s;
}

.node-handle:hover .handle-dot {
  background: var(--accent-blue);
  border-color: var(--accent-blue);
  transform: scale(1.2);
}

.node-handle:hover .handle-dot .handle-plus {
  opacity: 1;
  color: var(--node-text-light-bg);
}

.node-handle.is-connecting .handle-dot {
  background: var(--border-light);
  border-color: var(--text-muted);
}
</style>
