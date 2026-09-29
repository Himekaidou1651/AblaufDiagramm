/**
 * @file historyStore.ts - 撤销/重做历史管理
 * @brief 管理画布操作的撤销/重做栈。支持命令模式的 push/undo/redo，
 *        以及基于时间戳的连续操作合并策略（如同一节点 500ms 内的连续编辑合并）。
 * @author 自动生成
 * @date 2026-07-31
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { MAX_HISTORY, HISTORY_MERGE_WINDOW_MS } from '@/constants/constant'

/**
 * 历史命令数据结构
 * 每条记录包含正向操作（redo）和逆向操作（undo）
 */
export interface HistoryCommand {
  /** 操作类型标识 */
  type: string
  /** 时间戳（用于合并策略） */
  timestamp: number
  /** 逆向执行函数 */
  undo: () => void
  /** 正向重做函数 */
  redo: () => void
  /** 描述（可选，debug / UI 提示） */
  description?: string
  /** 关联的节点 ID（用于合并策略判断） */
  nodeId?: string
}

export const useHistoryStore = defineStore('history', () => {
  // ===== 状态 =====
  const undoStack = ref<HistoryCommand[]>([])
  const redoStack = ref<HistoryCommand[]>([])

  /**
   * 是否正在执行撤销/重做操作。
   * 当此标志为 true 时，graphStore 中的 mutation 不应再记录历史，
   * 否则会形成无限循环。
   */
  const isUndoRedoing = ref(false)

  // ===== 计算属性 =====

  /** 是否可以撤销 */
  const canUndo = computed(() => undoStack.value.length > 0)

  /** 是否可以重做 */
  const canRedo = computed(() => redoStack.value.length > 0)

  // ===== 方法 =====

  /**
   * 将一条命令压入撤销栈。
   * 新操作入栈时会清空重做栈（新分支覆盖旧历史）。
   *
   * 合并策略：同一节点 500ms 内的连续 updateNodeData 合并为一条，
   * 仅保留首尾状态（原始 undo + 最新 redo）。
   */
  function pushCommand(command: HistoryCommand) {
    redoStack.value = []

    // 合并策略：同一节点 500ms 内的连续 updateNodeData
    if (command.type === 'updateNodeData' && command.nodeId) {
      const last = undoStack.value[undoStack.value.length - 1]
      if (
        last &&
        last.type === 'updateNodeData' &&
        last.nodeId === command.nodeId &&
        command.timestamp - last.timestamp < HISTORY_MERGE_WINDOW_MS
      ) {
        // 合并：保留原始 undo（首状态），替换 redo（尾状态）
        last.redo = command.redo
        last.timestamp = command.timestamp
        last.description = command.description
        return
      }
    }

    undoStack.value.push(command)
    // 超出最大步数时移除最旧记录
    if (undoStack.value.length > MAX_HISTORY) {
      undoStack.value.shift()
    }
  }

  /** 撤销：弹出撤销栈顶，执行逆向操作，压入重做栈 */
  function undo() {
    const cmd = undoStack.value.pop()
    if (!cmd) return
    isUndoRedoing.value = true
    try {
      cmd.undo()
    } finally {
      isUndoRedoing.value = false
    }
    redoStack.value.push(cmd)
    // B20 fix: 对 redoStack 同样应用 MAX_HISTORY 限制
    if (redoStack.value.length > MAX_HISTORY) {
      redoStack.value.shift()
    }
  }

  /** 重做：弹出重做栈顶，执行正向操作，压回撤销栈 */
  function redo() {
    const cmd = redoStack.value.pop()
    if (!cmd) return
    isUndoRedoing.value = true
    try {
      cmd.redo()
    } finally {
      isUndoRedoing.value = false
    }
    undoStack.value.push(cmd)
  }

  /** 清空全部历史（用于新画布等场景） */
  function clear() {
    undoStack.value = []
    redoStack.value = []
  }

  return {
    undoStack,
    redoStack,
    isUndoRedoing,
    canUndo,
    canRedo,
    pushCommand,
    undo,
    redo,
    clear
  }
})
