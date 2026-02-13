# Eisenhower Tasks (Tauri)

Application de gestion de tâches basée sur la **Matrice d'Eisenhower**, construite avec [Tauri](https://tauri.app/) (backend Rust + frontend web).

Portage de la version Electron vers Tauri pour un binaire plus léger et performant.

## Fonctionnalités

- **Matrice 4 quadrants** : Urgent & Important, Important & Non urgent, Urgent & Non important, Non urgent & Non important
- **Drag & drop** : glisser les tâches depuis la liste vers les quadrants
- **Liste priorisée** : vue consolidée des tâches par priorité (colonne droite)
- **Complétion** : cocher/décocher les tâches (barré + opacité réduite)
- **Suppression** : individuelle ou globale (avec confirmation)
- **Thème clair/sombre** : bascule avec persistance (localStorage)
- **Raccourci clavier** : `Cmd/Ctrl+N` pour focus sur l'input
- **Persistance** : sauvegarde JSON sur disque (app data dir)

## Architecture

```
eisenhower-tasks-rust/
├── src-tauri/
│   ├── Cargo.toml           # Dépendances Rust (tauri, serde, serde_json)
│   ├── tauri.conf.json       # Config Tauri (fenêtre, bundle, identifiant)
│   ├── build.rs              # Script de build Tauri
│   └── src/
│       ├── main.rs           # Point d'entrée
│       └── lib.rs            # Commands Tauri : load_tasks, save_tasks
├── src/                      # Frontend
│   ├── index.html            # Interface (matrice + sidebars)
│   ├── styles.css            # Styles (thème clair/sombre, animations)
│   └── renderer.js           # Logique applicative (drag & drop, rendu, API)
└── package.json              # npm + Tauri CLI
```

## Prérequis

- [Rust](https://rustup.rs/) (stable)
- [Node.js](https://nodejs.org/) (v18+)

## Installation

```bash
cd eisenhower-tasks-rust
npm install
```

## Développement

```bash
npm run tauri:dev
```

## Build

```bash
npm run tauri:build
```

Les bundles sont générés dans `src-tauri/target/release/bundle/` :
- **macOS** : `.app` + `.dmg`
- **Windows** : NSIS installer
- **Linux** : AppImage + `.deb`
