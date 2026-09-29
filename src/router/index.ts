/**
 * @file index.ts - Vue Router 路由配置
 * @brief 定义应用的路由表：首页（HomeMenu）和编辑器（Editor）两个路由。
 *        使用 HTML5 History 模式。
 * @author 自动生成
 * @date 2026-07-31
 */
import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router'
import HomeMenu from '@/views/HomeMenu.vue'
import Editor from '@/views/Editor.vue'
import SaveBrowserView from '@/components/saves/SaveBrowserView.vue'

const router = createRouter({
  history: window.location.protocol === 'file:'
    ? createWebHashHistory()
    : createWebHistory(),
  routes: [
    {
      /** 首页路由 */
      path: '/',
      name: 'home',
      component: HomeMenu
    },
    {
      /** 当前用户的项目存档页。 */
      path: '/saves',
      name: 'saves',
      component: SaveBrowserView,
    },
    {
      /** 编辑器路由 */
      path: '/editor',
      name: 'editor',
      component: Editor
    }
  ]
})

export default router
