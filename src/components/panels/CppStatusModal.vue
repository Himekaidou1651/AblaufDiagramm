<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="modal-overlay"
      @click.self="close"
      @keydown.escape="close"
    >
      <div class="modal-panel cpp-status-modal">
        <div class="modal-header">
          <h2 class="modal-title">{{ t('cppStatus.title') }}</h2>
          <button class="modal-close" @click="close">×</button>
        </div>

        <div class="modal-body cpp-status-body">
          <div class="cpp-status-summary">
            <span>{{ t('cppStatus.nodes') }} {{ activeSnapshot.input.nodes.length }}</span>
            <span>{{ t('cppStatus.edges') }} {{ activeSnapshot.input.edges.length }}</span>
            <span>{{ t('cppStatus.diagnostics') }} {{ activeSnapshot.diagnostics.length }}</span>
          </div>

          <section class="cpp-status-section">
            <h3 class="cpp-status-heading">{{ t('cppStatus.nodeOutput') }}</h3>
            <pre class="cpp-status-output">{{ nodeOutput }}</pre>
          </section>

          <section class="cpp-status-section">
            <h3 class="cpp-status-heading">{{ t('cppStatus.edgeOutput') }}</h3>
            <pre class="cpp-status-output">{{ edgeOutput }}</pre>
          </section>

          <section class="cpp-status-section">
            <h3 class="cpp-status-heading">{{ t('cppStatus.graphCoreOutput') }}</h3>
            <pre class="cpp-status-output">{{ graphCoreOutput }}</pre>
          </section>

          <section v-if="activeSnapshot.diagnostics.length > 0" class="cpp-status-section">
            <h3 class="cpp-status-heading">{{ t('cppStatus.diagnosticOutput') }}</h3>
            <pre class="cpp-status-output">{{ diagnosticsOutput }}</pre>
          </section>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
/**
 * @file CppStatusModal.vue
 * @brief 展示当前画布同步到 C++ 图核心时的节点、边、图状态和诊断信息。
 * @author 项目维护者
 * @date 2026-08-26
 */

import { computed, ref, watch } from 'vue'
import { useEdgeStore } from '@/stores/edgeStore'
import { useNodeStore } from '@/stores/nodeStore'
import { useI18n } from '@/i18n'
import { buildGraphCoreSnapshot, type GraphCoreSnapshot } from '@/wasm/graphCoreInput'
import {
  DEFAULT_GRAPH_CORE_DEBUG_LIMIT,
  formatGraphCoreDump,
  formatGraphCoreEdgeSequence,
  formatGraphCoreNodeSequence,
} from '@/wasm/graphCoreDebug'

/**
 * @brief 定义 C++ 状态弹窗的显示状态属性。
 */
const props = defineProps<{
  modelValue: boolean
}>()

/**
 * @brief 定义 C++ 状态弹窗的双向绑定事件。
 */
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const nodeStore = useNodeStore()
const edgeStore = useEdgeStore()
const { t } = useI18n()

/**
 * @interface CppStatusViewState
 * @brief 表示 C++ 状态弹窗中用于渲染的快照和格式化输出。
 */
interface CppStatusViewState {
  /** @brief 当前图核心输入快照。 */
  snapshot: GraphCoreSnapshot
  /** @brief 节点序列的格式化输出。 */
  nodeOutput: string
  /** @brief 边序列的格式化输出。 */
  edgeOutput: string
  /** @brief 图核心整体状态的格式化输出。 */
  graphCoreOutput: string
}

/**
 * @brief 创建空的图核心快照。
 * @param diagnostics 初始诊断信息列表。
 * @return 空的图核心快照。
 */
function createEmptySnapshot(diagnostics: string[] = []): GraphCoreSnapshot {
  return {
    input: {
      nodes: [],
      edges: [],
    },
    maps: {
      nodeIdToIndex: new Map(),
      indexToNodeId: [],
      edgeIdToIndex: new Map(),
      indexToEdgeId: [],
    },
    diagnostics,
  }
}

/**
 * @brief 从未知错误对象中提取可展示的错误消息。
 * @param error 待解析的错误对象。
 * @return 可展示的错误消息。
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message || error.name
  }

  return String(error)
}

/** @brief 无节点和边的默认空快照。 */
const emptySnapshot = createEmptySnapshot()

/** @brief 控制调试输出中最多展示的节点数和边数。 */
const debugLimit = {
  maxNodes: DEFAULT_GRAPH_CORE_DEBUG_LIMIT,
  maxEdges: DEFAULT_GRAPH_CORE_DEBUG_LIMIT,
}

/** @brief 保存 C++ 状态弹窗当前用于展示的数据。 */
const cppStatus = ref<CppStatusViewState>({
  snapshot: emptySnapshot,
  nodeOutput: '<empty>',
  edgeOutput: '<empty>',
  graphCoreOutput: formatGraphCoreDump(emptySnapshot.input, debugLimit),
})

/** @brief 当前激活的图核心快照。 */
const activeSnapshot = computed(() => cppStatus.value.snapshot)

/** @brief 当前节点序列输出文本。 */
const nodeOutput = computed(() => cppStatus.value.nodeOutput)

/** @brief 当前边序列输出文本。 */
const edgeOutput = computed(() => cppStatus.value.edgeOutput)

/** @brief 当前图核心整体输出文本。 */
const graphCoreOutput = computed(() => cppStatus.value.graphCoreOutput)

/** @brief 当前诊断信息输出文本。 */
const diagnosticsOutput = computed(() => activeSnapshot.value.diagnostics.join('\n'))

/**
 * @brief 执行单个 C++ 状态格式化步骤，并将异常写入诊断列表。
 * @param stepName 当前格式化步骤名称。
 * @param action 生成格式化文本的回调函数。
 * @param diagnostics 用于收集异常诊断信息的列表。
 * @return 格式化输出文本；执行失败时返回错误占位文本。
 */
function runCppStatusStep(stepName: string, action: () => string, diagnostics: string[]): string {
  try {
    return action()
  } catch (error) {
    const message = `${stepName} failed: ${getErrorMessage(error)}`
    diagnostics.push(message)
    return `<${message}>`
  }
}

/**
 * @brief 从当前节点和边状态重新生成 C++ 图核心快照和调试输出。
 * @return 无返回值。
 */
function refreshSnapshot() {
  let nextSnapshot = emptySnapshot
  const diagnostics: string[] = []

  try {
    nextSnapshot = buildGraphCoreSnapshot(nodeStore.nodes, edgeStore.edges)
    diagnostics.push(...nextSnapshot.diagnostics)
  } catch (error) {
    diagnostics.push(`buildGraphCoreSnapshot failed: ${getErrorMessage(error)}`)
  }

  const nodeOutput = runCppStatusStep(
    'formatGraphCoreNodeSequence',
    () => formatGraphCoreNodeSequence(nextSnapshot.input, debugLimit),
    diagnostics
  )
  const edgeOutput = runCppStatusStep(
    'formatGraphCoreEdgeSequence',
    () => formatGraphCoreEdgeSequence(nextSnapshot.input, debugLimit),
    diagnostics
  )
  const graphCoreOutput = runCppStatusStep(
    'formatGraphCoreDump',
    () => formatGraphCoreDump(nextSnapshot.input, debugLimit),
    diagnostics
  )

  cppStatus.value = {
    snapshot: {
      ...nextSnapshot,
      diagnostics,
    },
    nodeOutput,
    edgeOutput,
    graphCoreOutput,
  }
}

/**
 * @brief 在弹窗显示时刷新 C++ 图核心状态快照。
 */
watch(
  () => props.modelValue,
  (visible) => {
    if (visible) {
      refreshSnapshot()
    }
  },
  { immediate: true }
)

/**
 * @brief 关闭 C++ 状态弹窗。
 * @return 无返回值。
 */
function close() {
  emit('update:modelValue', false)
}
</script>

<style scoped>
.cpp-status-modal {
  width: min(960px, 92vw);
}

.cpp-status-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.cpp-status-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  color: var(--text-secondary);
  font-size: 12px;
}

.cpp-status-summary span {
  padding: 4px 8px;
  border: 1px solid var(--border-default);
  border-radius: 4px;
  background: var(--bg-element);
}

.cpp-status-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cpp-status-heading {
  margin: 0;
  color: var(--text-body);
  font-size: 13px;
  font-weight: 600;
}

.cpp-status-modal .cpp-status-output {
  max-height: 220px;
  margin: 0;
  padding: 10px 12px;
  overflow: auto;
  border: 1px solid var(--border-default);
  border-radius: 6px;
  background: var(--bg-input);
  color: var(--text-body);
  font-family: var(--font-mono);
  font-size: 12px;
  line-height: 1.55;
  white-space: pre;
}

@media (max-width: 768px) {
  .cpp-status-modal {
    width: 95vw;
  }
}
</style>
