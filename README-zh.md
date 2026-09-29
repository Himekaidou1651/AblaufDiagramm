# AblaufDiagramm

[![Version](https://img.shields.io/badge/version-v2.0.0-blue)](./src/constants/storage.ts)
[![Platform](https://img.shields.io/badge/platform-Windows-0078D4)](./package.json)
[![Electron](https://img.shields.io/badge/runtime-Electron-47848F)](./package.json)
[![License](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)

一款可视化图表编辑器。

[![English](https://img.shields.io/badge/Docs-English-8B5CF6?style=flat-square)](./README.md)

## 项目概览

一个画布编辑器。

Windows 桌面程序名称为 `AD.exe`。打包后的应用会将存档和导出文件放在可执行文件旁边，使可执行文件与数据可以一起移动。

## 功能特性

### 画布编辑器

- 创建、移动、调整大小、复制和删除人物节点。
- 通过节点上下文工具栏添加子节点和配偶节点。
- 使用父子关系或配偶关系连接节点。
- 编辑姓名、标题、时期、附加信息、头像、徽标和颜色。
- 使用直角连线路径，连线颜色继承源节点颜色。
- 单选或多选节点，选择连线，并拖拽框选区域。
- 撤销和重做编辑操作。
- 将画布缩放范围控制在 `10%` 到 `1000%`。
- 向四个方向调整画布尺寸。
- 将节点吸附到网格，或与附近节点对齐并显示辅助线。
- 使用小地图浏览大型图表。

### 存档 JSON 侧边栏

- 在编辑器左侧工具栏点击 `≡` 按钮，打开并读取当前画布的存档 JSON。
- 侧边栏显示和编辑的正是存档所用的项目 JSON，不引入额外的顶层结构、字段命名或节点与连线结构。
- 画布变化通过现有序列化函数刷新编辑区文本，应用编辑后的 JSON 则通过与打开存档相同的校验和反序列化流程加载画布。

### 主菜单、用户与存档

- 创建和切换本地用户。
- 创建、重命名、打开和删除命名存档。
- 应用启动时恢复当前用户、当前存档和上次打开的存档。
- 使用 IndexedDB 作为应用本地数据层。
- 在 Electron 中自动导入和更新可执行文件旁边 `saves/` 目录中的存档。

### 导入与导出

- 从 `.json` 文件导入完整项目，并作为未保存项目打开。
- 将当前项目导出为 JSON、PNG、SVG 或 WebP。
- 项目 JSON 包含节点、连线、视口状态、画布边界和项目标题。
- 在 Electron 中，所有导出文件都写入可执行文件旁边的 `saves/` 目录。
- 在浏览器中，使用浏览器自带的文件下载机制。
- 从离屏副本导出图片，不移动或改写当前可见画布。

### 界面与设置

- 深色和浅色主题。
- 支持中文、英语、西班牙语、法语、俄语、日语、德语和阿拉伯语界面。
- 可配置网格显示、吸附对齐、默认节点颜色、未保存变更提示和开发者模式。
- 提供启动开屏、关于窗口、帮助窗口和快捷键说明。
- 弹窗支持焦点循环、Escape 关闭，并在关闭后把焦点还原到触发按钮。
- 使用 Toast 提示；成功提示自动消失，失败提示需手动关闭。

### 图片处理

- 支持使用 HTTP(S) URL、data URI 或本地上传作为头像图片。
- 使用开发环境代理或 Electron 图片代理处理跨域图片加载。
- 对代理响应的图片类型和最大响应大小进行限制。

## 技术栈

- Vue 3 和 TypeScript
- Vite
- Pinia
- Vue Router
- Electron 44
- electron-builder Windows portable 目标
- 使用 `html-to-image` 渲染 PNG 和 SVG
- 使用 `markdown-it` 渲染本地化帮助文档
- 用于图结构校验和诊断集成的 C++ GraphCore 源码
- 用于本地用户、存档和应用状态的 IndexedDB

## 环境要求

- Node.js 22+
- npm
- portable 版 `AD.exe` 的打包流程需要 Windows。

## 开始使用

安装依赖：

```cmd
npm.cmd ci
```

启动 Vite 开发服务器：

```cmd
npm.cmd run dev
```

构建网页应用：

```cmd
npm.cmd run build:web
```

构建 Windows portable 桌面应用：

```cmd
npm.cmd run build:desktop
```

打包产物写入 `release/AD.exe`。

## Windows 一键启动器

在项目目录中运行或双击 `launcher/dowser.bat`。该启动器会：

1. 定位项目根目录。
2. 检查 Node.js 和 npm。
3. 在 Vite 依赖未安装时运行 `npm ci`。
4. 使用已配置的 Electron 和 electron-builder 镜像地址。
5. 构建网页应用并打包 Electron portable 桌面应用。
6. 将 `release/AD.exe` 复制到项目根目录。

最终可执行文件位于：

```text
<项目根目录>\AD.exe
```

## 存档目录结构

开发环境下，Electron 存档根目录为项目根目录。打包后的 portable 应用使用 `AD.exe` 所在目录作为存档根目录。

```text
saves/
├─ manifest.json
├─ export_<项目>_<时间戳>.json
├─ export_<项目>_<时间戳>.png
├─ export_<项目>_<时间戳>.svg
├─ export_<项目>_<时间戳>.webp
└─ users/
   └─ <userId>/
      ├─ profile.json
      └─ saves/
         └─ <saveId>.json
```

- `manifest.json` 保存存档版本、更新时间和用户摘要。
- `profile.json` 保存完整的本地用户资料。
- `<saveId>.json` 保存存档元数据和完整项目文件。
- 导出文件直接放在 `saves/` 下，不会被当作存档导入。
- 存档 JSON 使用临时文件和重命名方式写入，降低产生残缺文件的风险。
- 使用文件路径前会校验用户 ID、存档 ID 和导出文件名。

## 项目文件格式

项目 JSON 文件包含：

- `version`：项目格式版本。
- `title`：可选的项目标题。
- `exportedAt`：ISO 时间戳。
- `viewport`：画布位置和缩放比例。
- `canvas`：画布原点、宽度和高度。
- `nodes`：包含位置、尺寸和人物数据的序列化人物节点。
- `edges`：包含源节点、目标节点和关系类型的序列化关系。

导入器会校验 JSON 结构，并将导入文件大小限制为 `10 MB`。

## 键盘快捷键

| 快捷键 | 操作 |
| --- | --- |
| `Ctrl + Z` | 撤销 |
| `Ctrl + Y` / `Ctrl + Shift + Z` | 重做 |
| `Ctrl + D` | 复制选中的节点 |
| `Delete` / `Backspace` | 删除选中的节点或连线 |
| `Ctrl + A` | 选择所有人物节点 |
| `Ctrl + =` / `Ctrl + +` | 放大 |
| `Ctrl + -` | 缩小 |
| `Escape` | 清除选择或取消连线 |
| `Space + 拖拽` | 平移画布 |
| `鼠标滚轮` | 缩放画布 |
| `Ctrl + 单击` | 添加或移除单个多选节点 |
| `在空白画布上拖拽` | 框选节点 |

## 源码目录

| 路径 | 用途 |
| --- | --- |
| `src/components/` | 主菜单、项目存档页、编辑器、画布、工具栏、面板、弹窗、节点、连线和小地图 Vue 组件 |
| `src/dvl/` | 存档 JSON 侧边栏组件及其同步 Store |
| `src/views/` | 首页和编辑器视图 |
| `src/router/` | 主菜单、项目存档页和编辑器的路由表 |
| `src/stores/` | 图结构、视口、画布、历史记录、设置和本地存档 Pinia Store |
| `src/services/project/` | 项目导入和文件下载服务 |
| `src/services/export/` | PNG、SVG、WebP、图片嵌入和导出清理服务 |
| `src/services/localArchive/` | IndexedDB 持久化服务 |
| `src/i18n/` | 翻译字典和 i18n 初始化 |
| `src/constants/helps/` | 帮助文档 |
| `electron/` | Electron 主进程、preload 桥接、存档访问和图片代理 |
| `launcher/` | Windows 一键打包启动器 |
| `tests/` | 单元测试和行为测试 |
| `cpp/graph_core/` | C++ GraphCore 校验和诊断源码 |
| `public/` | 静态资源、应用图标和 Service Worker 代理 |

## 测试

运行项目测试套件：

```cmd
npm.cmd test
```

## 许可证

本项目以 MIT License 发布，完整文本见 [LICENSE](./LICENSE)。
