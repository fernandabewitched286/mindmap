# Contributing to Mind Map Editor

Thanks for your interest! This document covers how to propose changes and
what we look for in a contribution. By participating, you agree to uphold our
[Code of Conduct](CODE_OF_CONDUCT.md).

## Project philosophy

Mind Map Editor is intentionally small:

- **No frameworks, no dependencies, no build step.** Plain HTML/CSS/JS that
  runs from `file://`.
- **Classic scripts, not ES modules** — this is what keeps `file://` working.
  Files share a single `window.MM` namespace (`storage → node → canvas →
  ui → app` load order matters; keep it).
- **Light theme, one accent** (`#4F46E5`), 12px radii, subtle motion.
- **Accessibility is a feature** — keep `prefers-reduced-motion` support,
  focus states and ARIA labels intact.

### Module map

| File             | Responsibility                                            |
| ---------------- | --------------------------------------------------------- |
| `index.html`     | App shell, toolbar, status bar, overlays, inline SVG icons |
| `css/style.css`  | All styling; design tokens live in `:root`                 |
| `js/app.js`      | Orchestration: state, actions, inline editing, shortcuts   |
| `js/canvas.js`   | Viewport pan/zoom, tree layout, SVG edges, tween engine    |
| `js/node.js`     | Tree model, traversal helpers, flat (de)serialization      |
| `js/storage.js`  | LocalStorage save/load (`mind-map-editor:map:v1`)          |
| `js/ui.js`       | Toolbar/status bar bindings, toasts, modal, shortcuts panel|

### Currently out of scope

Collaboration · user accounts · AI features · image/PDF export · undo/redo ·
node colors · search.

If you want one of these, open an issue first and discuss it — please don't
open a surprise PR that adds a dependency or a build step.

## Getting set up

1. Fork and clone the repository.
2. Open `index.html` in a browser. That's the whole setup.
3. Create a branch: `fix/…`, `feat/…` or `docs/…`.

## Reporting bugs

Open an issue with:

- Browser + OS versions.
- Exact steps to reproduce (node counts, actions, shortcuts used).
- What you expected vs. what happened.
- If it involves persistence, include the saved JSON from LocalStorage
  (DevTools → Application → Local Storage → `mind-map-editor:map:v1`).

## Suggesting features

Check the README's *Out of scope* list first. For anything else, describe the
user problem, the proposed behavior, and how it fits a zero-dependency app.

## Pull requests

1. Keep PRs small and focused — one change per PR.
2. Match the existing code style (guarded vanilla JS, small functions,
   comments for *why*).
3. Update `README.md` if you change UI, shortcuts or the storage format.
4. Fill in `PULL_REQUEST_TEMPLATE.md` (GitHub picks it up from the repo root).
5. Run the manual QA checklist below before submitting.

### Manual QA checklist

- [ ] New Mind Map (with and without unsaved changes → confirm dialog)
- [ ] Add child (`Enter` + toolbar), including from a fresh root
- [ ] Rename via double-click and `F2`; empty text reverts; mid-word caret works
- [ ] Delete (`Del`) a child and a subtree; root cannot be deleted
- [ ] Save → reload page → `Ctrl+O` restores the exact tree and order
- [ ] Pan by dragging; wheel zoom clamps at 50% and 200%; fit & reset work
- [ ] Shortcuts do **not** fire while editing text
- [ ] Responsive: ~360px, ~760px and desktop widths
- [ ] No console errors; animations respect `prefers-reduced-motion`

## Commit messages

Short, imperative, scoped: `fix: keep caret position while renaming`,
`docs: add storage format section`. Small commits > big dumps.

## Questions?

Open an issue and tag it `question` — we're happy to help you land your first
contribution. 🎉
