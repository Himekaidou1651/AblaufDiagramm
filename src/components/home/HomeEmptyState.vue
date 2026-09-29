<template>
  <section class="empty-state" role="status">
    <h2 class="empty-state__title">{{ title }}</h2>
    <p class="empty-state__description">{{ description }}</p>
    <button type="button" class="empty-state__action" @click="emit('action')">
      {{ actionLabel }}
    </button>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  description: string
  actionLabel: string
}>()

const emit = defineEmits<{
  action: []
}>()
</script>

<style scoped>
.empty-state {
  display: grid;
  justify-items: center;
  gap: 10px;
  padding: 36px 24px;
  border: 1px dashed var(--border-light);
  border-radius: 10px;
  text-align: center;
}
.empty-state__title { margin: 0; color: var(--text-body); font-size: 1.1rem; }
.empty-state__description { max-width: 38rem; margin: 0; color: var(--text-secondary); line-height: 1.5; }
.empty-state__action {
  margin-top: 6px;
  padding: 9px 18px;
  border: 1px solid var(--accent-blue);
  border-radius: 6px;
  color: var(--text-body);
  background: var(--accent-blue);
  cursor: pointer;
}
</style>
