# AblaufDiagramm Help

## Keyboard Shortcuts

| Shortcut | Action |
| --- | --- |
| `Ctrl + Z` | Undo the last operation |
| `Ctrl + Y` / `Ctrl + Shift + Z` | Redo the undone operation |
| `Ctrl + D` | Duplicate selected node(s), including multi-select |
| `Delete` / `Backspace` | Delete selected node(s) or edge, ignored inside text inputs |
| `Ctrl + A` | Select all person nodes |
| `Ctrl + =` / `Ctrl + +` | Zoom in |
| `Ctrl + -` | Zoom out |
| `Escape` | Deselect all / cancel an in-progress edge |
| `Space + Drag` | Hold Space and drag to pan the canvas |
| `Mouse Wheel` | Zoom canvas (10% ~ 1000%) |
| `Ctrl + Click` | Multi-select / deselect individual nodes |
| `Drag on empty canvas` | Rubber-band select multiple nodes |

## User Guide

### Adding Nodes

1. Click `+` in the compact left toolbar to create a new person node on the canvas.
2. Select a node, then click `↳` in the left toolbar or `+` in the node context toolbar to create a child node below it with an automatic parent-child edge.
3. Select a node, then click `⇄` in the node context toolbar to create a spouse node beside it with an automatic spouse edge.
4. The node context toolbar also provides `⧉` to duplicate the node and `×` to delete it.

### Selecting Nodes And Edges

1. Click a node to select it; a blue selection outline appears around the node.
2. Click an edge to select it; the contextual right-side inspector shows edge properties.
3. Click an empty canvas area to clear the current selection and hide the selection outline.
4. Hold `Ctrl` while clicking nodes to multi-select or deselect individual nodes.
5. Drag on an empty canvas area to rubber-band select multiple nodes.

### Creating Edges

1. Hover over a node's edge to reveal four connection handles at top, bottom, left, and right.
2. Drag from a handle and drop onto a target node's handle.
3. Before dragging, select the relation type from the left toolbar `⇄` relation menu: **Parent-Child** or **Spouse**.
4. Edge color inherits the source node's custom color; selected edges are highlighted in blue.
5. Click an empty canvas area to cancel an in-progress edge.

### Property Inspector

When a node is selected, the contextual right-side inspector appears and allows editing the following properties:

| Field | Description |
| --- | --- |
| Avatar | Embedded image on the left side; supports URL input (http/https/data URI) or local image upload |
| Title | First line of the node, displayed in bold |
| Subtitle 1 | Second line |
| Subtitle 2 | Third line |
| Identity | Identity text |
| Time | Time text |
| Extra Info | Optional extra text |
| Badge | Optional top-right circular badge text |
| Node Color | Custom node background color |
| Position | Node X / Y in canvas world coordinates |

When an edge is selected, you can change its relation type (Parent-Child / Spouse) or delete it.

### Node Sizes

- Nodes without avatars are fixed at `180 × 100`.
- Nodes with avatars are fixed at `270 × 120`.
- Adding, importing, or editing avatar data always normalizes nodes to one of these two sizes.

### Save & Export

| Feature | Description |
| --- | --- |
| Auto Save | Automatically saves to browser local storage (localStorage) while editing |
| Export JSON | Export the current project as a `.json` file, including nodes, edges, viewport state, and canvas bounds |
| Import JSON | Restore a complete project from a `.json` file |
| Export PNG | Export the full canvas as a PNG raster image |
| Export SVG | Export the full canvas as an SVG vector graphic |
| Export WebP | Export the full canvas as a WebP image |

Image export runs on an offscreen export object. `html-to-image` does not capture or temporarily rewrite the real interactive canvas, so exporting should not make the visible canvas jump.

### Mini Map

- The mini map in the bottom-right corner shows a global thumbnail of the canvas.
- The blue rectangle indicates the current visible area.
- Drag the blue rectangle to quickly navigate to any position.
- Click the `-` / `+` button to collapse or expand the mini map.

### Zoom Panel

- Click the toolbar percentage to open the zoom panel.
- Fine-tune zoom with `-` / `+` buttons, a slider, and direct percentage input (10% ~ 1000%).

### Canvas Resize

- Click **Canvas** in the top toolbar to open the canvas resize panel directly.
- Expand or shrink the canvas boundary in four directions: up, down, left, and right.
- Configure the step size for each adjustment.

### Snap Alignment

- Nodes can snap to grid intersections while dragging.
- Nodes can also align with nearby node edges or centers, with orange guide lines shown during snapping.
- Toggle this feature in Settings.

### Debug Mode

- Debug Mode is controlled in the Settings modal and is enabled by default.
- When Debug Mode is enabled, the **View** menu shows **View Clone Canvas** and **CPP Status**.
- When Debug Mode is enabled, the contextual inspector shows block IDs, edge IDs, edge source/target IDs, and connected edge IDs for the selected block.
- **CPP Status** shows the C++ GraphCore node, edge, and diagnostic output.
- **View Clone Canvas** shows a thumbnail preview of the hidden clone canvas.

### Editor Layout

- The top toolbar groups commands into **File**, **Edit**, **View**, **Canvas**, Settings, and Help.
- The compact left toolbar provides quick actions for adding nodes, adding child nodes, choosing relation type, and opening graph statistics.
- The node context toolbar appears for a single selected node and provides add child, add spouse, duplicate, and delete actions.
- The right-side inspector appears only after selecting a node or edge; when it is open, its width can be resized and is auto-saved.

### Project Title

- Double-click the title in the toolbar center to rename the project.
- Press Enter to confirm, Escape to cancel.
- The title appears in exported filenames.

## Node Types

| Type | Description |
| --- | --- |
| **Person Node** | Visible rectangular node containing title, subtitles, identity, time, etc.; supports avatar, badge, and custom color |

## Tips

- All edges use orthogonal right-angle paths, with color inherited from the source node's custom color.
- Click an empty canvas area to quickly clear the selected node or edge.
- Hold `Ctrl` to click-select multiple nodes individually; drag on an empty canvas area to rubber-band select.
- Canvas zoom range: 10% ~ 1000%, via mouse wheel, touchpad, or `Ctrl+=` / `Ctrl+-` shortcuts.
- The top menus provide import/export, undo/redo, delete, duplicate, fit view, grid toggle, theme toggle, and developer tools.
- All settings (theme, language, grid, snap alignment, default node color, Debug Mode) take effect instantly and are auto-saved.
