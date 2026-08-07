# Changelog

All notable changes to **Mind Map Editor** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning scheme: `v0.0.1aNN` — alpha builds on the 0.0.1 foundation.

Saved maps carry a schema `version` field (currently `1`); it is independent
of the app version and only changes when the storage format does.

## [v0.0.1] — 2026-08-08

### Added
- Project meta-files: `README.md`, `LICENSE` (MIT), `CONTRIBUTING.md`,
  `CODE_OF_CONDUCT.md` (Contributor Covenant 2.1),
  `PULL_REQUEST_TEMPLATE.md`, `.gitignore`.
- `CHANGELOG.md` (this file).
- `MM.VERSION` constant — single source of truth for the release version;
  the toolbar chip and document title are now set from it at boot.
- Save payloads now record `appVersion` for easier debugging of old saves.
- Infinite light canvas: drag-to-pan, wheel zoom clamped to 50–200%,
  zoom-to-cursor, fit-to-view, live two-scale dot grid.
- Root node + unlimited children with balanced left/right auto-layout,
  animated node/edge transitions, SVG bezier connectors.
- Node interactions: click-select, double-click / `F2` inline rename with
  live re-layout, subtree delete (root protected).
- Toolbar (New / Add Child / Delete / Save / Load) and status bar
  (node count, selection, save state, zoom controls, shortcuts panel).
- Persistence: full map as JSON in LocalStorage (`mind-map-editor:map:v1`).
- Keyboard shortcuts: `Enter`, `Delete`, `F2`, `Ctrl+S`, `Ctrl+O`, `Esc`.
- UX polish: toasts, confirm dialog for destructive "New", first-run hint,
  responsive layout, `prefers-reduced-motion` support.

### Fixed
- **Reversed text while renaming** (e.g. typing `Zaqar` produced `raqaZ`):
  layout sync no longer rewrites a label that is being edited, so the caret
  no longer collapses to the start of the text.
- Caret now stays put when clicking mid-word during a rename.

### Changed
- Version bump in title, brand chip, stylesheet header and docs.

### Compatibility
- No storage-schema change — maps saved with v0.0.1a01 load unchanged.