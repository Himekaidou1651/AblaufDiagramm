<template>
  <div class="toolbar-menu-wrap">
    <button
      ref="buttonRef"
      class="toolbar-menu-trigger"
      :class="{ active: open }"
      type="button"
      :title="title ?? label"
      :aria-expanded="open ? 'true' : 'false'"
      aria-haspopup="true"
      @click="toggle"
    >
      {{ label }}
    </button>
    <Teleport to="body">
      <div v-if="open" class="toolbar-menu-overlay" @mousedown.self="close">
        <div
          ref="menuRef"
          class="toolbar-menu"
          :class="{ 'menu-open': open }"
          :style="menuStyle"
          role="menu"
          tabindex="-1"
          @keydown.esc.prevent="close"
          @mousedown.stop
        >
          <slot :close="close" />
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
/**
 * @file ToolbarMenu.vue - 顶部工具栏通用菜单
 * @brief 为文件、编辑、视图、画布等全局菜单提供一致的打开、定位和关闭行为。
 *        改进点：支持 Esc 关闭、自动定位以避免超出视口、打开时聚焦以及简单的打开动画。
 */
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'

defineProps<{
  label: string
  title?: string
}>()

const open = ref(false)
const buttonRef = ref<HTMLElement | null>(null)
const menuRef = ref<HTMLElement | null>(null)

// reactive style strings for precise control after measuring
const top = ref<string | null>(null)
const left = ref<string | null>(null)
const minWidth = 170 // keep in sync with CSS

const menuStyle = computed(() => {
  const style: Record<string, string> = {}
  if (top.value) style.top = top.value
  if (left.value) style.left = left.value
  style.minWidth = `${minWidth}px`
  return style
})

function close() {
  open.value = false
}

function toggle() {
  open.value = !open.value
}

function updatePosition() {
  const btn = buttonRef.value
  const menu = menuRef.value
  if (!btn) return

  const rect = btn.getBoundingClientRect()
  const viewportW = window.innerWidth
  const viewportH = window.innerHeight

  // initial left anchored to button.left
  let calcLeft = rect.left
  const padding = 8
  const maxLeft = viewportW - minWidth - padding
  if (calcLeft > maxLeft) calcLeft = Math.max(padding, maxLeft)
  if (calcLeft < padding) calcLeft = padding

  // initial top below the button
  let calcTop = rect.bottom + 8

  // if menu already rendered, check if it would overflow bottom and prefer above
  if (menu) {
    const mRect = menu.getBoundingClientRect()
    if (mRect.bottom > viewportH - padding) {
      // place above button if enough space
      const aboveTop = rect.top - mRect.height - 8
      if (aboveTop > padding) {
        calcTop = aboveTop
      } else {
        // clamp to visible area
        calcTop = Math.max(padding, viewportH - mRect.height - padding)
      }
    }
  }

  top.value = `${Math.round(calcTop)}px`
  left.value = `${Math.round(calcLeft)}px`
}

let onKeydown: ((e: KeyboardEvent) => void) | null = null

watch(open, async (val) => {
  if (val) {
    // menu opening: compute position after it's in DOM
    await nextTick()
    updatePosition()
    // focus menu for keyboard interaction
    menuRef.value?.focus()

    onKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        e.preventDefault()
        close()
      }
    }
    window.addEventListener('keydown', onKeydown)
    // reposition on resize
    window.addEventListener('resize', updatePosition)
  } else {
    // cleanup
    if (onKeydown) {
      window.removeEventListener('keydown', onKeydown)
      onKeydown = null
    }
    window.removeEventListener('resize', updatePosition)
    top.value = null
    left.value = null
  }
})

onBeforeUnmount(() => {
  if (onKeydown) window.removeEventListener('keydown', onKeydown)
  window.removeEventListener('resize', updatePosition)
})
</script>

<style scoped>
.toolbar-menu-wrap {
  display: inline-flex;
}

.toolbar-menu-trigger {
  height: 28px;
  padding: 0 10px;
  border: 1px solid transparent;
  border-radius: 5px;
  background: transparent;
  color: var(--text-body);
  font-size: 12px;
  font-family: var(--font-serif);
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}

.toolbar-menu-trigger:hover,
.toolbar-menu-trigger.active {
  background: var(--bg-element);
  border-color: var(--border-light);
}

.toolbar-menu-overlay {
  position: fixed;
  inset: 0;
  z-index: 9998;
}

.toolbar-menu {
  position: fixed;
  min-width: 170px;
  padding: 6px;
  border: 1px solid var(--border-default);
  border-radius: 8px;
  background: var(--bg-panel);
  box-shadow: 0 14px 36px rgba(3, 8, 18, 0.36);
  color: var(--text-body);
  font-family: var(--font-serif);
  font-size: 12px;
  user-select: none;

  /* start hidden for animation */
  transform-origin: 0 0;
  transform: scale(0.98);
  opacity: 0;
  transition: transform 160ms cubic-bezier(.2,.9,.2,1), opacity 160ms ease;
}

.menu-open {
  transform: scale(1);
  opacity: 1;
}

/* improve internal spacing and item hit area for touch */
:deep(.menu-item) {
  width: 100%;
  min-height: 36px;
  padding: 8px 10px;
  border: 1px solid transparent;
  border-radius: 6px;
  background: transparent;
  color: var(--text-body);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  font-size: 12px;
  line-height: 1.2;
  font-family: var(--font-serif);
  text-align: left;
  cursor: pointer;
  outline: none;
  appearance: none;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
}

:deep(.menu-item *),
:deep(.menu-note),
:deep(.menu-shortcut) {
  font-size: 12px;
  line-height: 1.2;
  font-family: var(--font-serif);
}

:deep(.menu-item:hover:not(:disabled)) {
  background: var(--bg-element);
  border-color: var(--border-light);
}

:deep(.menu-item:focus-visible) {
  border-color: var(--accent-blue);
  box-shadow: 0 0 0 2px var(--shadow-focus);
}

:deep(.menu-item.danger) {
  border-color: transparent;
}

:deep(.menu-item:disabled) {
  opacity: 0.35;
  cursor: not-allowed;
}

:deep(.menu-divider) {
  height: 1px;
  margin: 6px 4px;
  background: var(--border-default);
}

</style>
