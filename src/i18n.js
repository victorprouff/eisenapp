const translations = {
  fr: {
    // Titlebar
    btn_settings_title: 'Paramètres',
    btn_clear_title: 'Supprimer toutes les tâches',
    btn_theme_title: 'Changer de thème',
    update_banner: 'Mise à jour disponible',

    // Sidebar gauche
    new_task: 'Nouvelle tâche',
    task_placeholder: 'Entrez une tâche...',
    btn_add: 'Ajouter',
    btn_import: 'Importer une liste',
    unassigned_tasks: 'Tâches non assignées',

    // États vides
    empty_unassigned: 'Aucune tâche en attente',
    empty_quadrant: 'Glissez une tâche ici',
    empty_priority: 'Aucune tâche',

    // Sidebar droite
    priority_list: 'Liste priorisée',
    btn_export: 'Exporter',

    // Quadrant labels (fixes)
    q1_label: 'Urgent & Important',
    q2_label: 'Important & Non urgent',
    q3_label: 'Urgent & Non important',
    q4_label: 'Non urgent & Non important',

    // Noms par défaut des quadrants (réinitialisables)
    q1_default: 'Faire immédiatement',
    q2_default: 'Planifier',
    q3_default: 'Déléguer - Annuler si pas le temps',
    q4_default: 'À piocher si on en a envie et le temps',

    // Priorité droite
    priority_q1: 'Faire maintenant',
    priority_q2: 'Planifier',
    priority_q3: 'Déléguer',
    priority_q4: 'À piocher',

    // File drop overlay
    file_drop_label: 'Déposer le fichier ici',

    // Modale suppression
    confirm_delete_all: 'Êtes-vous sûr de vouloir supprimer toutes les tâches ?',
    btn_cancel: 'Annuler',
    btn_delete: 'Supprimer',

    // Modale mise à jour
    update_available: 'Mise à jour disponible',
    update_later: 'Plus tard',
    update_install: 'Installer',
    update_downloading: 'Téléchargement en cours…',
    update_downloading_pct: (pct) => `Téléchargement… ${pct}%`,
    update_downloading_kb: (kb) => `Téléchargement… ${kb} Ko`,
    update_installing: 'Installation en cours…',
    update_error: 'Erreur : ',

    // Modale export
    export_title: 'Exporter la liste',
    btn_export_cancel: 'Annuler',
    btn_export_clipboard: 'Copier dans le presse-papier',
    btn_export_download: 'Télécharger .md',
    export_unsorted: 'Non trié',
    export_q1: 'Faire immédiatement',
    export_q2: 'Planifier',
    export_q3: 'Faire si on a le temps',
    export_q4: 'À piocher si on a le temps et envie',

    // Modale settings
    settings_title: 'Paramètres des quadrants',
    settings_q1_label: 'Quadrant 1 — Urgent & Important',
    settings_q2_label: 'Quadrant 2 — Important & Non urgent',
    settings_q3_label: 'Quadrant 3 — Urgent & Non important',
    settings_q4_label: 'Quadrant 4 — Non urgent & Non important',
    btn_reset: 'Réinitialiser',
    btn_save: 'Enregistrer',
    language_label: 'Langue',

    // Toasts
    toast_file_saved: 'Fichier enregistré !',
    toast_task_deleted: 'Tâche supprimée',
    toast_undo: 'Annuler',

    // Tooltip édition
    task_edit_tooltip: 'Double-cliquer pour modifier',
  },

  en: {
    // Titlebar
    btn_settings_title: 'Settings',
    btn_clear_title: 'Delete all tasks',
    btn_theme_title: 'Toggle theme',
    update_banner: 'Update available',

    // Sidebar gauche
    new_task: 'New task',
    task_placeholder: 'Enter a task...',
    btn_add: 'Add',
    btn_import: 'Import a list',
    unassigned_tasks: 'Unassigned tasks',

    // États vides
    empty_unassigned: 'No pending tasks',
    empty_quadrant: 'Drag a task here',
    empty_priority: 'No tasks',

    // Sidebar droite
    priority_list: 'Priority list',
    btn_export: 'Export',

    // Quadrant labels (fixes)
    q1_label: 'Urgent & Important',
    q2_label: 'Important & Not urgent',
    q3_label: 'Urgent & Not important',
    q4_label: 'Not urgent & Not important',

    // Noms par défaut des quadrants (réinitialisables)
    q1_default: 'Do immediately',
    q2_default: 'Schedule',
    q3_default: 'Delegate - Cancel if no time',
    q4_default: 'Do if time and interest',

    // Priorité droite
    priority_q1: 'Do now',
    priority_q2: 'Schedule',
    priority_q3: 'Delegate',
    priority_q4: 'Pick if time',

    // File drop overlay
    file_drop_label: 'Drop file here',

    // Modale suppression
    confirm_delete_all: 'Are you sure you want to delete all tasks?',
    btn_cancel: 'Cancel',
    btn_delete: 'Delete',

    // Modale mise à jour
    update_available: 'Update available',
    update_later: 'Later',
    update_install: 'Install',
    update_downloading: 'Downloading…',
    update_downloading_pct: (pct) => `Downloading… ${pct}%`,
    update_downloading_kb: (kb) => `Downloading… ${kb} KB`,
    update_installing: 'Installing…',
    update_error: 'Error: ',

    // Modale export
    export_title: 'Export list',
    btn_export_cancel: 'Cancel',
    btn_export_clipboard: 'Copy to clipboard',
    btn_export_download: 'Download .md',
    export_unsorted: 'Unsorted',
    export_q1: 'Do immediately',
    export_q2: 'Schedule',
    export_q3: 'Do if time allows',
    export_q4: 'Do if time and interest',

    // Modale settings
    settings_title: 'Quadrant settings',
    settings_q1_label: 'Quadrant 1 — Urgent & Important',
    settings_q2_label: 'Quadrant 2 — Important & Not urgent',
    settings_q3_label: 'Quadrant 3 — Urgent & Not important',
    settings_q4_label: 'Quadrant 4 — Not urgent & Not important',
    btn_reset: 'Reset',
    btn_save: 'Save',
    language_label: 'Language',

    // Toasts
    toast_file_saved: 'File saved!',
    toast_task_deleted: 'Task deleted',
    toast_undo: 'Undo',

    // Tooltip édition
    task_edit_tooltip: 'Double-click to edit',
  },

  es: {
    // Titlebar
    btn_settings_title: 'Configuración',
    btn_clear_title: 'Eliminar todas las tareas',
    btn_theme_title: 'Cambiar tema',
    update_banner: 'Actualización disponible',

    // Sidebar gauche
    new_task: 'Nueva tarea',
    task_placeholder: 'Escribe una tarea...',
    btn_add: 'Añadir',
    btn_import: 'Importar lista',
    unassigned_tasks: 'Tareas sin asignar',

    // États vides
    empty_unassigned: 'Sin tareas pendientes',
    empty_quadrant: 'Arrastra una tarea aquí',
    empty_priority: 'Sin tareas',

    // Sidebar droite
    priority_list: 'Lista priorizada',
    btn_export: 'Exportar',

    // Quadrant labels (fixes)
    q1_label: 'Urgente & Importante',
    q2_label: 'Importante & No urgente',
    q3_label: 'Urgente & No importante',
    q4_label: 'No urgente & No importante',

    // Noms par défaut des quadrants (réinitialisables)
    q1_default: 'Hacer inmediatamente',
    q2_default: 'Planificar',
    q3_default: 'Delegar - Cancelar si no hay tiempo',
    q4_default: 'Hacer si hay tiempo e interés',

    // Priorité droite
    priority_q1: 'Hacer ahora',
    priority_q2: 'Planificar',
    priority_q3: 'Delegar',
    priority_q4: 'Elegir si hay tiempo',

    // File drop overlay
    file_drop_label: 'Soltar archivo aquí',

    // Modale suppression
    confirm_delete_all: '¿Seguro que quieres eliminar todas las tareas?',
    btn_cancel: 'Cancelar',
    btn_delete: 'Eliminar',

    // Modale mise à jour
    update_available: 'Actualización disponible',
    update_later: 'Más tarde',
    update_install: 'Instalar',
    update_downloading: 'Descargando…',
    update_downloading_pct: (pct) => `Descargando… ${pct}%`,
    update_downloading_kb: (kb) => `Descargando… ${kb} KB`,
    update_installing: 'Instalando…',
    update_error: 'Error: ',

    // Modale export
    export_title: 'Exportar lista',
    btn_export_cancel: 'Cancelar',
    btn_export_clipboard: 'Copiar al portapapeles',
    btn_export_download: 'Descargar .md',
    export_unsorted: 'Sin clasificar',
    export_q1: 'Hacer inmediatamente',
    export_q2: 'Planificar',
    export_q3: 'Hacer si hay tiempo',
    export_q4: 'Hacer si hay tiempo e interés',

    // Modale settings
    settings_title: 'Configuración de cuadrantes',
    settings_q1_label: 'Cuadrante 1 — Urgente & Importante',
    settings_q2_label: 'Cuadrante 2 — Importante & No urgente',
    settings_q3_label: 'Cuadrante 3 — Urgente & No importante',
    settings_q4_label: 'Cuadrante 4 — No urgente & No importante',
    btn_reset: 'Restablecer',
    btn_save: 'Guardar',
    language_label: 'Idioma',

    // Toasts
    toast_file_saved: '¡Archivo guardado!',
    toast_task_deleted: 'Tarea eliminada',
    toast_undo: 'Deshacer',

    // Tooltip édition
    task_edit_tooltip: 'Doble clic para editar',
  },

  de: {
    // Titlebar
    btn_settings_title: 'Einstellungen',
    btn_clear_title: 'Alle Aufgaben löschen',
    btn_theme_title: 'Design wechseln',
    update_banner: 'Update verfügbar',

    // Sidebar gauche
    new_task: 'Neue Aufgabe',
    task_placeholder: 'Aufgabe eingeben...',
    btn_add: 'Hinzufügen',
    btn_import: 'Liste importieren',
    unassigned_tasks: 'Nicht zugewiesene Aufgaben',

    // États vides
    empty_unassigned: 'Keine ausstehenden Aufgaben',
    empty_quadrant: 'Aufgabe hierher ziehen',
    empty_priority: 'Keine Aufgaben',

    // Sidebar droite
    priority_list: 'Prioritätsliste',
    btn_export: 'Exportieren',

    // Quadrant labels (fixes)
    q1_label: 'Dringend & Wichtig',
    q2_label: 'Wichtig & Nicht dringend',
    q3_label: 'Dringend & Nicht wichtig',
    q4_label: 'Nicht dringend & Nicht wichtig',

    // Noms par défaut des quadrants (réinitialisables)
    q1_default: 'Sofort erledigen',
    q2_default: 'Planen',
    q3_default: 'Delegieren - Abbrechen wenn keine Zeit',
    q4_default: 'Erledigen wenn Zeit und Lust',

    // Priorité droite
    priority_q1: 'Jetzt erledigen',
    priority_q2: 'Planen',
    priority_q3: 'Delegieren',
    priority_q4: 'Bei Gelegenheit',

    // File drop overlay
    file_drop_label: 'Datei hier ablegen',

    // Modale suppression
    confirm_delete_all: 'Alle Aufgaben wirklich löschen?',
    btn_cancel: 'Abbrechen',
    btn_delete: 'Löschen',

    // Modale mise à jour
    update_available: 'Update verfügbar',
    update_later: 'Später',
    update_install: 'Installieren',
    update_downloading: 'Wird heruntergeladen…',
    update_downloading_pct: (pct) => `Herunterladen… ${pct}%`,
    update_downloading_kb: (kb) => `Herunterladen… ${kb} KB`,
    update_installing: 'Wird installiert…',
    update_error: 'Fehler: ',

    // Modale export
    export_title: 'Liste exportieren',
    btn_export_cancel: 'Abbrechen',
    btn_export_clipboard: 'In Zwischenablage kopieren',
    btn_export_download: '.md herunterladen',
    export_unsorted: 'Unsortiert',
    export_q1: 'Sofort erledigen',
    export_q2: 'Planen',
    export_q3: 'Erledigen wenn Zeit',
    export_q4: 'Erledigen wenn Zeit und Lust',

    // Modale settings
    settings_title: 'Quadranteneinstellungen',
    settings_q1_label: 'Quadrant 1 — Dringend & Wichtig',
    settings_q2_label: 'Quadrant 2 — Wichtig & Nicht dringend',
    settings_q3_label: 'Quadrant 3 — Dringend & Nicht wichtig',
    settings_q4_label: 'Quadrant 4 — Nicht dringend & Nicht wichtig',
    btn_reset: 'Zurücksetzen',
    btn_save: 'Speichern',
    language_label: 'Sprache',

    // Toasts
    toast_file_saved: 'Datei gespeichert!',
    toast_task_deleted: 'Aufgabe gelöscht',
    toast_undo: 'Rückgängig',

    // Tooltip édition
    task_edit_tooltip: 'Doppelklick zum Bearbeiten',
  },
};

const SUPPORTED_LANGS = ['fr', 'en', 'es', 'de'];

let currentLang = localStorage.getItem('eisen-lang')
  || SUPPORTED_LANGS.find(l => navigator.language.startsWith(l))
  || 'en';

function t(key, ...args) {
  const val = translations[currentLang]?.[key] ?? translations['fr'][key] ?? key;
  return typeof val === 'function' ? val(...args) : val;
}

function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    el.title = t(el.dataset.i18nTitle);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
  document.documentElement.lang = currentLang;

  const sel = document.getElementById('langSelect');
  if (sel) sel.value = currentLang;
}

function setLang(lang) {
  currentLang = lang;
  localStorage.setItem('eisen-lang', lang);
  applyTranslations();
  if (typeof resetQuadrantNamesToDefaults === 'function') resetQuadrantNamesToDefaults();
  if (typeof render === 'function') render();
}
