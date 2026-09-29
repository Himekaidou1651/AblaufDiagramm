<template>
  <aside class="json-sidebar">
    <header class="json-sidebar__header">
      <div class="json-sidebar__headings">
        <h2 class="json-sidebar__title">{{ t('jsonSidebar.title') }}</h2>
        <span class="json-sidebar__archive">{{ archiveLabel }}</span>
      </div>
      <button
        class="json-sidebar__close"
        type="button"
        :title="t('jsonSidebar.close')"
        @click="store.requestClose()"
      >
        ×
      </button>
    </header>

    <div class="json-sidebar__actions">
      <button
        class="json-sidebar__btn json-sidebar__btn--primary"
        type="button"
        @click="store.applyJson()"
      >
        {{ t('jsonSidebar.apply') }}
      </button>
      <button class="json-sidebar__btn" type="button" @click="store.formatText()">
        {{ t('jsonSidebar.format') }}
      </button>
      <button class="json-sidebar__btn" type="button" @click="store.reloadJson()">
        {{ t('jsonSidebar.reload') }}
      </button>
    </div>

    <p class="json-sidebar__status" :data-status="store.status">{{ statusLabel }}</p>
    <p v-if="message" class="json-sidebar__message" :data-status="store.status">{{ message }}</p>

    <textarea
      v-model="store.text"
      class="json-sidebar__editor"
      spellcheck="false"
      autocapitalize="off"
      autocomplete="off"
    />

    <ConfirmDialog
      :model-value="store.prompt !== null"
      :title="promptConfig.title"
      :message="promptConfig.message"
      :actions="promptActions"
      @update:model-value="onPromptDismiss"
      @action="onPromptAction"
    />
  </aside>
</template>

<script setup lang="ts">
/**
 * @file JsonSidebar.vue
 * @brief 当前存档 JSON 侧边栏，显示并编辑当前画布对应的存档 JSON。
 * @author 项目维护者
 * @date 2026-09-29
 */
import { computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from '@/i18n'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import {
  useJsonSidebarStore,
  type JsonPromptChoice,
} from '@/dvl/jsonSidebarStore'

/** @brief 侧边栏裁决按钮结构，与 ConfirmDialog 的 actions 一致。 */
interface PromptAction {
  key: string
  label: string
  variant?: 'primary' | 'default' | 'danger'
}

const { t } = useI18n()
const store = useJsonSidebarStore()

/** @brief 顶栏显示的当前存档名。 */
const archiveLabel = computed(() => store.archiveName || t('editor.contextUnsaved'))

/** @brief 当前同步状态文案。 */
const statusLabel = computed(() => t(`jsonSidebar.status.${store.status}`))

/** @brief 错误或冲突提示文案，无提示时为空。 */
const message = computed(() => {
  const syntax = store.syntaxError
  if (syntax) {
    const head = t('jsonSidebar.syntaxError', [syntax.message])
    if (syntax.line === null) return head
    return `${head} ${t('jsonSidebar.errorAt', [syntax.line, syntax.column ?? ''])}`
  }
  if (store.formatError) return t('jsonSidebar.formatError', [store.formatError])
  if (store.conflict) return t('jsonSidebar.conflictHint')
  return ''
})

/** @brief 当前提示的标题与正文。 */
const promptConfig = computed(() => {
  if (store.prompt === 'close') {
    return { title: t('jsonSidebar.closeTitle'), message: t('jsonSidebar.closeDesc') }
  }
  if (store.prompt === 'save') {
    return { title: t('jsonSidebar.saveTitle'), message: t('jsonSidebar.saveDesc') }
  }
  if (store.prompt === 'conflict') {
    return { title: t('jsonSidebar.conflictTitle'), message: t('jsonSidebar.conflictDesc') }
  }
  return { title: '', message: '' }
})

/** @brief 当前提示的裁决按钮。 */
const promptActions = computed<PromptAction[]>(() => {
  if (store.prompt === 'conflict') {
    return [
      { key: 'keep', label: t('jsonSidebar.conflictKeep'), variant: 'primary' },
      { key: 'reload', label: t('jsonSidebar.conflictReload') },
      { key: 'cancel', label: t('common.cancel') },
    ]
  }
  return [
    { key: 'apply', label: t('jsonSidebar.applyEdits'), variant: 'primary' },
    { key: 'discard', label: t('jsonSidebar.discardEdits') },
    { key: 'cancel', label: t('common.cancel') },
  ]
})

/** @brief 提交裁决结果。 */
function onPromptAction(key: string) {
  store.answerPrompt(key as JsonPromptChoice)
}

/** @brief 覆盖层或 Escape 关闭提示时按取消处理。 */
function onPromptDismiss() {
  store.answerPrompt('cancel')
}

/** @brief 未应用修改尚未丢弃时，阻止页面直接关闭或刷新。 */
function onBeforeUnload(event: BeforeUnloadEvent) {
  if (!store.hasPendingEdits) return
  event.preventDefault()
  event.returnValue = ''
}

onMounted(() => { window.addEventListener('beforeunload', onBeforeUnload) })
onUnmounted(() => { window.removeEventListener('beforeunload', onBeforeUnload) })
</script>

<style scoped>
.json-sidebar {
  width: 400px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px 10px 10px;
  background: var(--bg-panel);
  border-right: 1px solid var(--border-default);
  z-index: 15;
}

.json-sidebar__header {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.json-sidebar__headings {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.json-sidebar__title {
  margin: 0;
  font-size: 13px;
  font-family: var(--font-serif);
  color: var(--text-body);
}

.json-sidebar__archive {
  font-size: 11px;
  color: var(--text-dim);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.json-sidebar__close {
  width: 24px;
  height: 24px;
  border: 1px solid var(--border-light);
  border-radius: 6px;
  background: var(--bg-element);
  color: var(--text-body);
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
}

.json-sidebar__close:hover {
  background: var(--bg-element-hover);
  border-color: var(--accent-blue);
}

.json-sidebar__actions {
  display: flex;
  gap: 6px;
}

.json-sidebar__btn {
  flex: 1;
  padding: 6px 8px;
  border: 1px solid var(--border-light);
  border-radius: 6px;
  background: var(--bg-element);
  color: var(--text-body);
  font-size: 12px;
  font-family: var(--font-serif);
  cursor: pointer;
}

.json-sidebar__btn:hover {
  background: var(--bg-element-hover);
  border-color: var(--accent-blue);
}

.json-sidebar__btn--primary {
  border-color: var(--accent-blue);
}

.json-sidebar__status {
  margin: 0;
  font-size: 11px;
  color: var(--text-dim);
}

.json-sidebar__status[data-status='pending'],
.json-sidebar__status[data-status='conflict'] {
  color: var(--accent-blue);
}

.json-sidebar__status[data-status='invalid'],
.json-sidebar__status[data-status='failed'] {
  color: var(--danger, #d55353);
}

.json-sidebar__message {
  margin: 0;
  font-size: 11px;
  line-height: 1.5;
  color: var(--danger, #d55353);
  overflow-wrap: anywhere;
}

.json-sidebar__message[data-status='conflict'] {
  color: var(--accent-blue);
}

.json-sidebar__editor {
  flex: 1;
  min-height: 0;
  resize: none;
  padding: 8px;
  border: 1px solid var(--border-light);
  border-radius: 6px;
  background: var(--bg-body);
  color: var(--text-body);
  font-family: var(--font-mono);
  font-size: 11px;
  line-height: 1.5;
  tab-size: 2;
  white-space: pre;
  overflow: auto;
}
</style>
