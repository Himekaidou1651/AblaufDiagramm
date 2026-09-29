/**
 * @file main.ts - 应用入口
 * @brief 创建 Vue 应用实例，安装 Pinia / i18n / Router 插件，挂载到 #app。
 *        配置全局错误处理器防止组件异常导致白屏。
 * @author 自动生成
 * @date 2026-07-31
 */
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { initI18n } from './i18n'
import { pinia } from '@/stores/pinia'

const app = createApp(App)

// 全局错误处理器：捕获未处理的组件错误，防止白屏
app.config.errorHandler = (err, _instance, info) => {
  console.error('[Global Error]', err)
  console.error('[Error Info]', info)
  // 可通过 toast 等方式提示用户，目前仅控制台输出
}

app.use(pinia)
// 必须在 Pinia 安装后初始化 i18n（依赖 settingsStore）
initI18n()
app.use(router)

app.mount('#app')
