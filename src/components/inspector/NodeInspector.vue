<template>
  <div class="inspector-field">
    <label>{{ t('editor.prop.avatarUrl') }}</label>
    <div class="input-with-btn">
      <input
        class="input-inner"
        type="text"
        :value="node.data.avatar ?? ''"
        @input="onFieldInput('avatar', ($event.target as HTMLInputElement).value)"
      />
      <label class="avatar-upload-btn-inline" :title="t('editor.avatarUpload')">📂
        <input
          type="file"
          accept="image/*"
          style="display:none"
          @change="onAvatarFileChange"
        />
      </label>
    </div>
    <p v-if="avatarError" class="avatar-error">{{ avatarError }}</p>
  </div>

  <div class="inspector-field">
    <label>{{ t('editor.prop.name') }}</label>
    <input
      class="inspector-input"
      type="text"
      :value="node.data.name"
      @input="onFieldInput('name', ($event.target as HTMLInputElement).value)"
    />
  </div>

  <div class="inspector-field">
    <label>{{ t('editor.prop.nativeName') }}</label>
    <input
      class="inspector-input"
      type="text"
      :value="node.data.nativeName ?? ''"
      @input="onFieldInput('nativeName', ($event.target as HTMLInputElement).value)"
    />
  </div>

  <div class="inspector-field">
    <label>{{ t('editor.prop.nativeName2') }}</label>
    <input
      class="inspector-input"
      type="text"
      :value="node.data.nativeName2 ?? ''"
      @input="onFieldInput('nativeName2', ($event.target as HTMLInputElement).value)"
    />
  </div>

  <div class="inspector-field">
    <label>{{ t('editor.prop.identity') }}</label>
    <input
      class="inspector-input"
      type="text"
      :value="node.data.title"
      @input="onFieldInput('title', ($event.target as HTMLInputElement).value)"
    />
  </div>

  <div class="inspector-field">
    <label>{{ t('editor.prop.time') }}</label>
    <input
      class="inspector-input"
      type="text"
      :value="node.data.period"
      @input="onFieldInput('period', ($event.target as HTMLInputElement).value)"
    />
  </div>

  <div class="inspector-field">
    <label>{{ t('editor.prop.extraInfo') }}</label>
    <input
      class="inspector-input"
      type="text"
      :value="node.data.extra ?? ''"
      @input="onFieldInput('extra', ($event.target as HTMLInputElement).value)"
    />
  </div>

  <div class="inspector-field">
    <label>{{ t('editor.prop.badge') }}</label>
    <input
      class="inspector-input"
      type="text"
      :value="node.data.badge ?? ''"
      :placeholder="t('editor.placeholder.badge')"
      @input="onFieldInput('badge', ($event.target as HTMLInputElement).value)"
    />
  </div>

  <div class="inspector-field">
    <label>{{ t('editor.prop.nodeColor') }}</label>
    <div class="color-picker-row">
      <input
        class="color-input"
        type="color"
        :value="node.data.color ?? DEFAULT_NODE_COLOR"
        @input="onFieldInput('color', ($event.target as HTMLInputElement).value)"
      />
      <span class="color-hex">{{ node.data.color ?? DEFAULT_NODE_COLOR }}</span>
    </div>
  </div>

  <div class="inspector-field">
    <label>{{ t('editor.prop.position') }}</label>
    <div class="position-row">
      <label class="position-label">X</label>
      <input
        class="inspector-input position-input"
        type="number"
        :value="Math.round(node.position.x)"
        @input="onPositionXInput(($event.target as HTMLInputElement).value)"
      />
      <label class="position-label">Y</label>
      <input
        class="inspector-input position-input"
        type="number"
        :value="Math.round(node.position.y)"
        @input="onPositionYInput(($event.target as HTMLInputElement).value)"
      />
    </div>
  </div>

  <div v-if="developerMode" class="inspector-field">
    <label>{{ t('editor.node.id') }}</label>
    <div class="field-value mono" style="font-size:10px">{{ node.id }}</div>
  </div>

  <div v-if="developerMode" class="inspector-field">
    <label>{{ t('editor.node.connectedEdgeIds') }}</label>
    <div class="field-value mono edge-id-sequence">
      <template v-if="selectedNodeEdgeIds.length > 0">
        <div v-for="edgeId in selectedNodeEdgeIds" :key="edgeId">{{ edgeId }}</div>
      </template>
      <template v-else>&lt;empty&gt;</template>
    </div>
  </div>

  <div class="inspector-actions">
    <button class="inspector-btn" @click="$emit('addChild')">{{ t('editor.createConnection') }}</button>
  </div>
</template>

<script setup lang="ts">
/**
 * @file NodeInspector.vue - 单节点属性检查器
 */
import { watch } from 'vue'
import type { PersonData, PersonNode } from '@/types'
import { DEFAULT_NODE_COLOR, DEBOUNCE_MS } from '@/constants/constant'
import { useI18n } from '@/i18n'
import { debounce } from '@/utils/debounce'
import { AvatarUpload } from '@/composables/AvatarUpload'

const props = defineProps<{
  node: PersonNode
  developerMode: boolean
  selectedNodeEdgeIds: string[]
}>()

const emit = defineEmits<{
  addChild: []
  fieldChange: [nodeId: string, field: keyof PersonData, value: string | undefined]
  positionChange: [nodeId: string, x: number, y: number]
}>()

const { t } = useI18n()

const debouncedUpdate = debounce((nodeId: string, field: keyof PersonData, value: string | undefined) => {
  emit('fieldChange', nodeId, field, value)
}, DEBOUNCE_MS)

function onFieldInput(field: keyof PersonData, value: string) {
  if (field === 'avatar') {
    resetAvatarError()
  }
  const optionalFields: (keyof PersonData)[] = ['nativeName', 'nativeName2', 'extra', 'avatar', 'color', 'badge']
  let cleanValue: string | undefined = optionalFields.includes(field) ? (value || undefined) : value
  if (field === 'avatar' && cleanValue && !/^https?:\/\//i.test(cleanValue) && !cleanValue.startsWith('data:')) {
    cleanValue = 'https://' + cleanValue
  }
  debouncedUpdate(props.node.id, field, cleanValue)
}

const debouncedPositionUpdate = debounce((nodeId: string, x: number, y: number) => {
  emit('positionChange', nodeId, x, y)
}, DEBOUNCE_MS)

function onPositionXInput(value: string) {
  const x = parseFloat(value)
  if (isNaN(x)) return
  debouncedPositionUpdate(props.node.id, x, props.node.position.y)
}

function onPositionYInput(value: string) {
  const y = parseFloat(value)
  if (isNaN(y)) return
  debouncedPositionUpdate(props.node.id, props.node.position.x, y)
}

const { avatarError, resetAvatarError, onAvatarFileChange } = AvatarUpload(t, (dataUri) => {
  onFieldInput('avatar', dataUri)
})

watch(
  () => props.node.id,
  () => {
    resetAvatarError()
  }
)
</script>
