# Mind Map Editor

**v0.0.1 — Foundation Release**

A fast, minimal mind-mapping tool for the browser. Grow a tree of ideas
around a central topic with smooth panning, wheel zoom, animated auto-layout
and one-click persistence — no accounts, no build step, no dependencies.

Built with plain **HTML, CSS and vanilla JavaScript**.

---

## ✨ Features

- **Infinite canvas** — drag the background to pan, scroll to zoom (50–200%)
- **Root + unlimited children** — balanced left/right tree, auto-laid out
- **Animated layout** — nodes sprout from their parent and glide into place
- **SVG connectors** — smooth bezier edges that highlight with the selection
- **Inline editing** — double-click or `F2` to rename; layout reflows live
- **Persistence** — the whole map is saved as JSON in LocalStorage
- **Keyboard-first** — full shortcut workflow (see below)
- **Minimal light UI** — 12px radii, subtle shadows, accent `#4F46E5`

## 🚀 Quick start

1. Clone or download the repository.
2. Open `index.html` in any modern browser.

That's it. There is **no build step and no server requirement** —
the app runs directly from `file://`.

> Tip: the root node starts selected. Press `Enter` to grow your first branch.

## ⌨️ Keyboard shortcuts

| Action                    | Shortcut                |
| ------------------------- | ----------------------- |
| Add child node            | `Enter`                 |
| Delete selected node      | `Delete` / `Backspace`  |
| Rename selected node      | `F2`                    |
| Save mind map             | `Ctrl` + `S`            |
| Load mind map             | `Ctrl` + `O`            |
| Edit node text            | Double-click node       |
| Pan canvas                | Drag background         |
| Zoom 50–200%              | Mouse wheel             |
| Cancel edit / deselect    | `Esc`                   |

The **Shortcuts** button in the status bar shows this list in-app.
The status bar also shows the node count, current zoom (click `%` to reset,
corners icon to fit) and the save state.

## 🗂 Project structure

```text
mind-map-editor/
│
├── index.html                  # App shell, toolbar, status bar, overlays
├── css/
│   └── style.css               # All styling (design tokens in :root)
├── js/
│   ├── app.js                  # Orchestration: actions, editing, shortcuts
│   ├── canvas.js               # Viewport: pan/zoom, tree layout, SVG edges, tweens
│   ├── node.js                 # Tree model + (de)serialization
│   ├── storage.js              # LocalStorage persistence
│   └── ui.js                   # Toolbar, status bar, toasts, modal, panels
├── assets/                     # Future assets (screenshots, etc.)
│
├── .gitignore
├── CHANGELOG.md
├── CODE_OF_CONDUCT.md
├── CONTRIBUTING.md
├── LICENSE
├── PULL_REQUEST_TEMPLATE.md
└── README.md
```

## 🔖 Versioning & changelog

Releases are tracked as `v0.0.1a` alpha builds — see
[CHANGELOG.md](CHANGELOG.md)

## 💾 Storage format

`Save` writes one JSON document to LocalStorage under the key
`mind-map-editor:map:v1`. `Load` restores the most recent save.

```json
{
  "app": "mind-map-editor",
  "version": 1,
  "savedAt": 1767950400000,
  "nodes": [
    { "id": "a1b2c3", "text": "JavaScript", "parent": null },
    { "id": "d4e5f6", "text": "Closures",   "parent": "a1b2c3" }
  ]
}
```

Nodes are stored depth-first (root first), so child order survives a
round-trip.

## 🌐 Browser support

Any evergreen browser (Chrome, Edge, Firefox, Safari, 2023+).
Uses Pointer Events, `Map`/`Set`, `contenteditable` with graceful fallback,
and honors `prefers-reduced-motion`.

## 🚧 Out of scope (for now)

Collaboration · user accounts · AI features · image/PDF export ·
undo/redo · node colors · search.

These are deliberate non-goals of the Foundation Release — see
[CONTRIBUTING.md](CONTRIBUTING.md) before opening a PR for one of them.

## 🤝 Contributing

Contributions are welcome! Please read
[CONTRIBUTING.md](CONTRIBUTING.md) first, and note that this project
adopts the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md).

## 📄 License

[MIT](LICENSE) — free to use, modify and redistribute.
