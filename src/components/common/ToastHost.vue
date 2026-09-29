<template>
  <Teleport to="body">
    <div class="toast-host" aria-live="polite" aria-atomic="false">
      <article
        v-for="toast in messages"
        :key="toast.id"
        class="toast-message"
        :class="`toast-message--${toast.kind}`"
        :role="toast.kind === 'error' ? 'alert' : 'status'"
      >
        <div class="toast-message__content">
          <p class="toast-message__text">{{ toast.message }}</p>
          <p v-if="toast.hint" class="toast-message__hint">{{ toast.hint }}</p>
        </div>
        <button
          v-if="toast.kind === 'error'"
          type="button"
          class="toast-message__close"
          :aria-label="t('common.close')"
          @click="dismiss(toast.id)"
        >
          ✕
        </button>
      </article>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useToast } from '@/composables/Toast'
import { useI18n } from '@/i18n'

const { messages, dismiss } = useToast()
const { t } = useI18n()
</script>

<style scoped>
.toast-host {
  position: fixed;
  z-index: 1400;
  top: 20px;
  right: 20px;
  display: grid;
  width: min(420px, calc(100vw - 32px));
  gap: 10px;
  pointer-events: none;
}

.toast-message {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 13px 14px;
  border: 1px solid var(--border-light);
  border-left-width: 4px;
  border-radius: 8px;
  color: var(--text-body);
  background: var(--bg-panel);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  pointer-events: auto;
}

.toast-message--success { border-left-color: #2f9e62; }
.toast-message--error { border-left-color: #d55353; }
.toast-message__content { min-width: 0; flex: 1; }
.toast-message__text,
.toast-message__hint { margin: 0; line-height: 1.4; overflow-wrap: anywhere; }
.toast-message__hint { margin-top: 4px; color: var(--text-secondary); font-size: 0.85rem; }
.toast-message__close { border: 0; color: var(--text-muted); background: none; cursor: pointer; }

@media (max-width: 480px) {
  .toast-host { top: 12px; right: 16px; }
}
</style>
