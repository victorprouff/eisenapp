# EisenApp

A task management application based on the **Eisenhower Matrix**, built with [Tauri](https://tauri.app/) (Rust backend + web frontend).

## Features

- **4-quadrant matrix**: Urgent & Important, Important & Not urgent, Urgent & Not important, Not urgent & Not important
- **Drag & drop**: move tasks from the list to any quadrant
- **Priority list**: consolidated view of tasks by priority (right sidebar)
- **Completion**: check/uncheck tasks (strikethrough + reduced opacity)
- **Deletion**: individual or bulk (with confirmation), with 10-second undo
- **Light/dark theme**: toggle with persistence (localStorage)
- **Keyboard shortcut**: `Cmd/Ctrl+N` to focus the input
- **Persistence**: JSON saved to disk (app data dir)
- **Auto-updates**: checked at startup + banner in the title bar
- **Inline editing**: double-click a task to edit its text (Enter to confirm, Escape to cancel)
- **Task import**: import a list from a `.txt`/`.md` file (button, drag & drop onto the window, or paste a multi-line list). Supports markdown format (`- [ ]`, `- [x]`, `-`)
- **Markdown export**: export the priority list as `.md` (clipboard copy or save with native file dialog), respects the active filter
- **Pro/Personal flag**: tag tasks as Pro or Personal (click the badge on each task to cycle), with global filter in the title bar and export respecting the active filter
- **Multilingual**: French, English, Spanish, German — auto-detected from system language, persisted across sessions

## Architecture

```
eisenhower-tasks-rust/
├── src-tauri/
│   ├── Cargo.toml           # Rust dependencies (tauri, serde, serde_json)
│   ├── tauri.conf.json      # Tauri config (window, bundle, identifier)
│   ├── build.rs             # Tauri build script
│   └── src/
│       ├── main.rs          # Entry point
│       └── lib.rs           # Tauri commands: load_tasks, save_tasks, check_for_updates, install_update, save_markdown
├── src/                     # Frontend
│   ├── index.html           # UI (matrix + sidebars)
│   ├── styles.css           # Styles (light/dark theme, animations)
│   ├── i18n.js              # Translations (FR, EN, ES, DE)
│   └── renderer.js          # App logic (drag & drop, rendering, API)
└── package.json             # npm + Tauri CLI
```

## Requirements

- [Rust](https://rustup.rs/) (stable)
- [Node.js](https://nodejs.org/) (v18+)

## Installation

```bash
cd eisenhower-tasks-rust
npm install
```

## Development

```bash
npm run tauri:dev
```

## Build

```bash
npm run tauri:build
```

Bundles are generated in `src-tauri/target/release/bundle/`:

- **macOS**: `.app` + `.dmg`
- **Windows**: NSIS installer
- **Linux**: AppImage + `.deb`

## Download

Releases are available on the [GitHub Releases page](https://github.com/victorprouff/eisenapp/releases). The app updates automatically when a new version is published.

### macOS — first launch

The app is not notarized by Apple, so Gatekeeper blocks it on first launch. Two options:

**Option 1 — right-click**

Right-click the app → **Open** → **Open Anyway**. macOS remembers the choice and won't ask again.

**Option 2 — Terminal**

```bash
xattr -cr "/Applications/Eisenhower Tasks.app"
```

## Publishing a new release

1. Update the version in `src-tauri/tauri.conf.json`:

    ```json
    "version": "1.x.0",
    ```

2. Commit, tag and push:
    ```bash
    git add src-tauri/tauri.conf.json
    git commit -m "chore: bump version to 1.x.0"
    git tag v1.x.0
    git push origin main && git push origin v1.x.0
    ```

The GitHub Actions workflow automatically builds for macOS (arm64 + x64), Windows and Linux, then publishes the release.
