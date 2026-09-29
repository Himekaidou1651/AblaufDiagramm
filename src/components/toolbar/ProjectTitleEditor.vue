<template>
  <input
    v-if="isEditingTitle"
    ref="titleInputRef"
    v-model="projectName"
    class="toolbar-title-input"
    :placeholder="t('editor.untitled')"
    maxlength="30"
    @blur="finishEditTitle"
    @keydown.enter="finishEditTitle"
    @keydown.escape="cancelEditTitle"
  />
  <span
    v-else
    class="toolbar-title"
    @dblclick="startEditTitle"
    :title="t('editor.titleHint')"
  >{{ projectName || t('editor.untitled') }}</span>
</template>

<script setup lang="ts">
/**
 * @file ProjectTitleEditor.vue - 工具栏标题编辑
 */
import { nextTick, ref } from 'vue'
import { useI18n } from '@/i18n'
import { useProjectTitle, setProjectTitle } from '@/stores/projectTitleStore'

const { t } = useI18n()
const { projectTitle: projectName } = useProjectTitle()
const isEditingTitle = ref(false)
const titleInputRef = ref<HTMLInputElement | null>(null)
let titleBeforeEdit = ''

function persistTitle() {
  setProjectTitle(projectName.value)
}

function startEditTitle() {
  titleBeforeEdit = projectName.value
  isEditingTitle.value = true
  nextTick(() => titleInputRef.value?.select())
}

function finishEditTitle() {
  if (!isEditingTitle.value) return
  isEditingTitle.value = false
  persistTitle()
}

function cancelEditTitle() {
  projectName.value = titleBeforeEdit
  isEditingTitle.value = false
}
</script>
