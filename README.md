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
- **Mises à jour automatiques** : vérification au démarrage + bouton 🔄 dans la barre de titre
- **Édition inline** : double-cliquer sur une tâche pour modifier son texte (Entrée pour valider, Échap pour annuler)
- **Import de tâches** : importer une liste depuis un fichier `.txt`/`.md` (bouton, drag & drop sur la fenêtre, ou coller une liste multiligne). Supporte le format markdown (`- [ ]`, `- [x]`, `-`)
- **Export markdown** : exporter la liste priorisée en `.md` (copie presse-papier ou sauvegarde avec boîte de dialogue native)

## TODO :

- Créer un change log dans github
- Pouvoir rajouter une date et une heure au tâche. Valeur modifiable
- Pouvoir rajouter une durée
- Rajouter settings pour modifier couleurs de l'interface
- Depuis les settings pouvoir personnaliser les différents titres des catégories
- Gérer le multilingue

## Architecture

```
eisenhower-tasks-rust/
├── src-tauri/
│   ├── Cargo.toml           # Dépendances Rust (tauri, serde, serde_json)
│   ├── tauri.conf.json       # Config Tauri (fenêtre, bundle, identifiant)
│   ├── build.rs              # Script de build Tauri
│   └── src/
│       ├── main.rs           # Point d'entrée
│       └── lib.rs            # Commands Tauri : load_tasks, save_tasks, check_for_updates, install_update, save_markdown
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

## Télécharger

Les releases sont disponibles sur la [page GitHub Releases](https://github.com/victorprouff/eisenapp/releases). L'application se met à jour automatiquement dès qu'une nouvelle version est publiée.

### macOS — premier lancement

L'app n'étant pas notarisée par Apple, Gatekeeper bloque l'exécution au premier lancement. Deux options :

**Option 1 — clic droit**

Clic droit sur l'app → **Ouvrir** → **Ouvrir quand même**. macOS mémorise le choix, l'avertissement ne réapparaît plus.

**Option 2 — Terminal**

```bash
xattr -cr "/Applications/Eisenhower Tasks.app"
```

## Publier une nouvelle version

1. Mettre à jour la version dans `src-tauri/tauri.conf.json` :

    ```json
    "version": "1.x.0",
    ```

2. Commiter, tagger et pousser :
    ```bash
    git add src-tauri/tauri.conf.json
    git commit -m "chore: bump version to 1.x.0"
    git tag v1.x.0
    git push origin main && git push origin v1.x.0
    ```

Le workflow GitHub Actions build automatiquement pour macOS (arm64 + x64), Windows et Linux, puis publie la release.
