<template>
  <article
    class="save-card"
    :class="{ 'save-card--current': current, 'save-card--busy': busy }"
    role="button"
    :tabindex="busy ? -1 : 0"
    :aria-current="current ? 'true' : undefined"
    :aria-disabled="busy"
    :aria-label="t('saves.openNamed', [save.name])"
    @click="open"
    @keydown.enter.prevent="open"
    @keydown.space.prevent="open"
  >
    <div class="save-card__main">
      <div class="save-card__title-row">
        <h2 class="save-card__title" :title="save.name">{{ save.name }}</h2>
        <span v-if="current" class="save-card__badge">{{ t('saves.currentBadge') }}</span>
      </div>
      <p class="save-card__meta">
        {{ t('saves.metaLine', [save.nodeCount, save.edgeCount, formattedTime]) }}
      </p>
    </div>

    <div class="save-card__actions" @click.stop @keydown.stop>
      <button type="button" class="save-card__button save-card__button--open" :disabled="busy" @click="open">
        {{ busy ? t('saves.opening') : t('saves.open') }}
      </button>
      <button type="button" class="save-card__button" :disabled="busy" @click="emit('rename')">
        {{ t('saves.rename') }}
      </button>
      <button type="button" class="save-card__button save-card__button--danger" :disabled="busy" @click="emit('delete')">
        {{ t('saves.delete') }}
      </button>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { SaveSlot } from '@/types/localArchive'
import { useI18n } from '@/i18n'

const props = defineProps<{
  save: SaveSlot
  current: boolean
  busy?: boolean
}>()

const emit = defineEmits<{
  open: []
  rename: []
  delete: []
}>()

const { t, locale } = useI18n()
const formattedTime = computed(() => new Date(props.save.updatedAt).toLocaleString(locale.value))

function open() {
  if (!props.busy) emit('open')
}
</script>

<style scoped>
.save-card {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 18px;
  border: 1px solid var(--border-light);
  border-radius: 10px;
  color: var(--text-body);
  background: var(--bg-panel);
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease, transform 0.15s ease;
}
.save-card:hover,
.save-card:focus-visible { border-color: var(--accent-blue); background: var(--bg-element-hover); }
.save-card:focus-visible { outline: 2px solid var(--accent-blue); outline-offset: 2px; }
.save-card--current { border-width: 2px; border-color: var(--home-menu-primary-border, var(--accent-blue)); }
.save-card--busy { cursor: wait; opacity: 0.78; }
.save-card__main { min-width: 0; flex: 1; }
.save-card__title-row { display: flex; min-width: 0; align-items: center; gap: 10px; }
.save-card__title { min-width: 0; margin: 0; overflow: hidden; font-size: 1rem; text-overflow: ellipsis; white-space: nowrap; }
.save-card__badge {
  flex: 0 0 auto;
  padding: 3px 8px;
  border: 1px solid var(--home-menu-primary-border, var(--accent-blue));
  border-radius: 999px;
  font-size: 0.74rem;
}
.save-card__meta { margin: 7px 0 0; color: var(--text-secondary); font-size: 0.84rem; line-height: 1.4; }
.save-card__actions { display: flex; flex: 0 0 auto; flex-wrap: wrap; justify-content: flex-end; gap: 8px; }
.save-card__button {
  min-height: 34px;
  padding: 7px 11px;
  border: 1px solid var(--border-light);
  border-radius: 6px;
  color: var(--text-body);
  background: var(--bg-element);
  cursor: pointer;
  white-space: normal;
  font-family: var(--font-serif);
}
.save-card__button--open { border-color: var(--accent-blue); background: var(--accent-blue); color: #fff; }
.save-card__button--danger { border-color: transparent; color: var(--danger, #d55353); background: transparent; }
.save-card__button:disabled { opacity: 0.55; cursor: wait; }

@media (max-width: 768px) {
  .save-card { align-items: stretch; flex-direction: column; }
  .save-card__actions { justify-content: stretch; }
  .save-card__button { flex: 1 1 120px; }
}
</style>
