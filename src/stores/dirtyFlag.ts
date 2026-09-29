/**
 * @file dirtyFlag.ts - 脏标记计数器
 * @brief 提供全局脏标记机制。
 *        每次数据变更调用 markDirty()，正式保存完成后调用 clearDirty()。
 * @author 自动生成
 * @date 2026-07-31
 */
import { ref } from 'vue'

/**
 * 脏标记计数器。
 * 每次 mutation 调用 markDirty() 递增，graphStore 通过 watch 此值触发序列化，
 * 替代原先的 deep: true watch（避免每次深层次属性变更都触发完整序列化）。
 */
const dirtyCounter = ref(0)
const isDirty = ref(false)

/**
 * @brief 标记数据已变更，触发 graphStore 的内存序列化 watch
 */
export function markDirty() {
  dirtyCounter.value++
  isDirty.value = true
}

/**
 * @brief 标记当前运行时项目已经保存或刚刚加载完成。
 */
export function clearDirty() {
  isDirty.value = false
}

/**
 * @brief 供 graphStore watch 使用的脏标记引用
 */
export { dirtyCounter, isDirty }
