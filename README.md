# AblaufDiagramm

[![Version](https://img.shields.io/badge/version-v2.0.0-blue)](./src/constants/storage.ts)
[![Platform](https://img.shields.io/badge/platform-Windows-0078D4)](./package.json)
[![Electron](https://img.shields.io/badge/runtime-Electron-47848F)](./package.json)
[![License](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)

A visual diagram editor.

[![汉语](https://img.shields.io/badge/文档-汉语-8B5CF6?style=flat-square)](./README-zh.md)

## Overview

A canvas editor.

The Windows desktop artifact is named `AD.exe`. The packaged application keeps its archive and exported files beside the executable so the executable and its data can be moved together.

## Features

### Canvas editor

- Create, move, resize, duplicate, and delete person nodes.
- Add child nodes and spouse nodes from the node context toolbar.
- Connect nodes with parent-child or spouse edges.
- Edit names, titles, periods, extra information, avatars, badges, and colors.
- Use orthogonal edge paths with colors inherited from the source node.
- Select one or multiple nodes, select edges, and drag-select an area.
- Undo and redo editing operations.
- Pan and zoom the canvas from `10%` to `1000%`.
- Resize the canvas in four directions.
- Snap nodes to the grid or align them with nearby nodes using visual guides.
- Navigate large diagrams with the mini map.

### Archive JSON sidebar

- Open the sidebar with the `≡` button in the editor's left toolbar to read the archive JSON of the current canvas.
- The sidebar shows and edits the same project JSON that saves use; it adds no separate top-level structure, field naming, or node and edge shape.
- Canvas changes refresh the editor text through the existing serialization function, and applying edited JSON loads the canvas through the same validation and deserialization path that opening a save uses.

### Home menu, users, and saves

- Create and switch between local users.
- Create, rename, open, and delete named saves.
- Restore the selected user, selected save, and last-opened save when the application starts.
- Use IndexedDB for the local application data layer.
- In Electron, automatically import and update the archive stored in the `saves/` directory beside the executable.

### Import and export

- Import complete projects from `.json` files as unsaved projects.
- Export the current project as JSON, PNG, SVG, or WebP.
- Include nodes, edges, viewport state, canvas bounds, and the project title in project JSON files.
- In Electron, write all exported files to the executable's `saves/` directory.
- In a browser, use the browser's normal file-download mechanism.
- Export images from an off-screen copy so the visible canvas is not moved or rewritten.

### Interface and settings

- Dark and light themes.
- Chinese, English, Spanish, French, Russian, Japanese, German, and Arabic UI translations.
- Configurable grid display, snap alignment, default node color, unsaved-change prompts, and developer mode.
- Startup splash screen, About dialog, Help dialog, and keyboard shortcut reference.
- Dialogs with focus trapping, Escape handling, and focus restoration to the trigger button.
- Toast notifications; success toasts dismiss automatically and failure toasts stay until dismissed.

### Image handling

- Accept avatar images from HTTP(S) URLs, data URIs, or local uploads.
- Use the development proxy or Electron image proxy to handle cross-origin image loading.
- Restrict proxied responses to image content types and a maximum response size.

## Technology stack

- Vue 3 and TypeScript
- Vite
- Pinia
- Vue Router
- Electron 44
- electron-builder portable Windows target
- `html-to-image` for PNG and SVG rendering
- `markdown-it` for localized Help content
- C++ GraphCore source for graph validation and diagnostic integration
- IndexedDB for local users, saves, and application state

## Requirements

- Node.js 22 or newer
- npm
- Windows is required for the portable `AD.exe` packaging workflow.

## Getting started

Install dependencies:

```cmd
npm.cmd ci
```

Start the Vite development server:

```cmd
npm.cmd run dev
```

Build the web application:

```cmd
npm.cmd run build:web
```

Build the portable Windows application:

```cmd
npm.cmd run build:desktop
```

The packaged artifact is written to `release/AD.exe`.

## One-click Windows launcher

Run `launcher/dowser.bat` from the project directory or double-click it. The launcher:

1. Locates the project root.
2. Checks for Node.js and npm.
3. Runs `npm ci` when the Vite dependency is not installed.
4. Uses the configured Electron and electron-builder mirror URLs.
5. Builds the web application and packages the portable Electron application.
6. Copies `release/AD.exe` to the project root.

The final executable is therefore available as:

```text
<project root>\AD.exe
```

## Archive layout

In development, the Electron archive root is the project root. In a packaged portable application, it is the directory containing `AD.exe`.

```text
saves/
├─ manifest.json
├─ export_<project>_<timestamp>.json
├─ export_<project>_<timestamp>.png
├─ export_<project>_<timestamp>.svg
├─ export_<project>_<timestamp>.webp
└─ users/
   └─ <userId>/
      ├─ profile.json
      └─ saves/
         └─ <saveId>.json
```

- `manifest.json` stores the archive version, update time, and user summaries.
- `profile.json` stores a complete local-user profile.
- `<saveId>.json` stores save metadata and the complete project file.
- Export files are stored directly under `saves/` and are not imported as saves.
- Archive JSON writes use temporary files and renaming to reduce the risk of partial files.
- User IDs, save IDs, and export names are validated before they are used as paths.

## Project file format

A project JSON file contains:

- `version`: project format version.
- `title`: optional project title.
- `exportedAt`: ISO timestamp.
- `viewport`: canvas position and zoom.
- `canvas`: canvas origin, width, and height.
- `nodes`: serialized person nodes with position, size, and person data.
- `edges`: serialized relationships with source, target, and relationship type.

The importer validates the JSON structure and limits imported files to `10 MB`.

## Keyboard shortcuts

| Shortcut | Action |
| --- | --- |
| `Ctrl + Z` | Undo |
| `Ctrl + Y` / `Ctrl + Shift + Z` | Redo |
| `Ctrl + D` | Duplicate selected nodes |
| `Delete` / `Backspace` | Delete selected nodes or edges |
| `Ctrl + A` | Select all person nodes |
| `Ctrl + =` / `Ctrl + +` | Zoom in |
| `Ctrl + -` | Zoom out |
| `Escape` | Clear selection or cancel an edge |
| `Space + Drag` | Pan the canvas |
| `Mouse Wheel` | Zoom the canvas |
| `Ctrl + Click` | Add or remove individual nodes from a multi-selection |
| `Drag on empty canvas` | Rubber-band select nodes |

## Source tree

| Path | Purpose |
| --- | --- |
| `src/components/` | Vue components for the home menu, project save page, editor, canvas, toolbars, panels, dialogs, nodes, edges, and mini map |
| `src/dvl/` | Archive JSON sidebar component and its synchronization store |
| `src/views/` | Home and editor views |
| `src/router/` | Route table for the home menu, project save page, and editor |
| `src/stores/` | Pinia stores for graph data, viewport, canvas, history, settings, and local archives |
| `src/services/project/` | Project import and file-download services |
| `src/services/export/` | PNG, SVG, WebP, image embedding, and export cleanup services |
| `src/services/localArchive/` | IndexedDB persistence services |
| `src/i18n/` | Translation dictionaries and i18n initialization |
| `src/constants/helps/` | Help documents |
| `electron/` | Electron main process, preload bridge, archive access, and image proxy |
| `launcher/` | Windows one-click packaging launcher |
| `tests/` | Unit and behavior tests |
| `cpp/graph_core/` | C++ GraphCore validation and diagnostic source |
| `public/` | Static assets, application icons, and the service-worker proxy |

## Testing

Run the project test suite with:

```cmd
npm.cmd test
```

## License

This project is distributed under the MIT License. See [LICENSE](./LICENSE) for the full text.
