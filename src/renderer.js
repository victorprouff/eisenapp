// État de l'application
let tasks = [];
let draggedTask = null;
let dragCounter = 0;
let undoPending = null; // { task, index, timeout }
function getDefaultQuadrantNames() {
  return [t('q1_default'), t('q2_default'), t('q3_default'), t('q4_default')];
}
function getDefaultQuadrantColors() {
  return ['#dc2626', '#007aff', '#ea580c', '#0d9488'];
}
let quadrantNames = null;
let quadrantColors = null;
let _savedColors = null; // snapshot à l'ouverture de la modale
let _savedFlagsEnabled = null;
let flagsEnabled = true;
let _savedCompactMode = null;
let compactMode = false;
let activeFilter = 'all'; // 'all' | 'pro' | 'perso'

const EMPTY_FLAG_ICON = `<svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 1.5h7l-2.5 4 2.5 5H2V1.5z"/></svg>`;

const PRESET_COLORS = [
  '#dc2626', '#e11d48', '#db2777', '#7c3aed',
  '#2563eb', '#007aff', '#0d9488', '#16a34a',
  '#65a30d', '#d97706', '#ea580c', '#64748b',
  '#ffffff',
];

// Éléments DOM
const taskInput = document.getElementById('taskInput');
const addTaskBtn = document.getElementById('addTaskBtn');
const taskList = document.getElementById('taskList');
const dropZones = document.querySelectorAll('.quadrant-tasks');

// Initialisation
document.addEventListener('DOMContentLoaded', async () => {
  applyTranslations();
  await loadTasks();
  await loadSettings();
  setupEventListeners();
  render();
});

// Configuration des événements
function setupEventListeners() {
  // Ajouter une tâche
  addTaskBtn.addEventListener('click', addTask);
  taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTask();
  });

  // Drag & Drop sur les quadrants
  dropZones.forEach(zone => {
    zone.addEventListener('dragover', handleDragOver);
    zone.addEventListener('drop', handleDrop);
    zone.addEventListener('dragleave', handleDragLeave);
  });

  // Drag & Drop vers la zone non assignée
  const unassignedZone = document.querySelector('.unassigned-tasks');
  unassignedZone.addEventListener('dragover', handleDragOver);
  unassignedZone.addEventListener('drop', handleDrop);
  unassignedZone.addEventListener('dragleave', handleDragLeave);

  // Supprimer toutes les tâches
  document.getElementById('clearTasks').addEventListener('click', removeAllTasks);

  // Annuler la dernière suppression
  document.getElementById('undoBtn').addEventListener('click', () => {
    if (!undoPending) return;
    clearTimeout(undoPending.timeout);
    tasks.splice(Math.min(undoPending.index, tasks.length), 0, undoPending.task);
    undoPending = null;
    saveTasks();
    render();
    document.getElementById('undoToast').classList.remove('visible');
  });

  // Bouton import
  document.getElementById('importBtn').addEventListener('click', () => {
    document.getElementById('importFileInput').click();
  });
  document.getElementById('importFileInput').addEventListener('change', (e) => {
    if (e.target.files[0]) handleFileImport(e.target.files[0]);
    e.target.value = '';
  });

  // Drag & drop de fichier sur toute la fenêtre
  const fileDropOverlay = document.getElementById('fileDropOverlay');
  document.addEventListener('dragenter', (e) => {
    if (e.dataTransfer.types.includes('Files')) {
      dragCounter++;
      fileDropOverlay.classList.add('visible');
    }
  });
  document.addEventListener('dragleave', (e) => {
    if (e.dataTransfer.types.includes('Files')) {
      if (--dragCounter <= 0) {
        dragCounter = 0;
        fileDropOverlay.classList.remove('visible');
      }
    }
  });
  document.addEventListener('dragover', (e) => {
    if (e.dataTransfer.types.includes('Files')) e.preventDefault();
  });
  document.addEventListener('drop', (e) => {
    dragCounter = 0;
    fileDropOverlay.classList.remove('visible');
    if (e.dataTransfer.files.length > 0) {
      e.preventDefault();
      handleFileImport(e.dataTransfer.files[0]);
    }
  });

  // Sélecteur de langue
  document.getElementById('langSelect').addEventListener('change', (e) => setLang(e.target.value));

  // Settings — onglets
  document.querySelectorAll('.settings-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.settings-tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.settings-tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.querySelector(`.settings-tab-panel[data-panel="${btn.dataset.tab}"]`).classList.add('active');
    });
  });

  // Settings — toggle flags
  document.getElementById('flagsToggle').addEventListener('change', (e) => {
    flagsEnabled = e.target.checked;
    applyFlagsEnabled();
  });

  // Settings — density buttons
  document.querySelectorAll('.density-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.density-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      compactMode = btn.dataset.density === 'compact';
      applyCompactMode();
    });
  });

  // Settings — ouverture
  document.getElementById('settingsBtn').addEventListener('click', () => {
    _savedColors = [...quadrantColors];
    _savedFlagsEnabled = flagsEnabled;
    _savedCompactMode = compactMode;
    for (let i = 0; i < 4; i++)
      document.getElementById(`qName${i + 1}`).value = quadrantNames[i];
    document.getElementById('flagsToggle').checked = flagsEnabled;
    document.querySelectorAll('.density-btn').forEach(b =>
      b.classList.toggle('active', b.dataset.density === (compactMode ? 'compact' : 'normal'))
    );
    buildColorPalettes();
    document.getElementById('settingsOverlay').classList.add('visible');
  });

  // Settings — annuler
  document.getElementById('settingsCancel').addEventListener('click', () => {
    quadrantColors = [..._savedColors];
    flagsEnabled = _savedFlagsEnabled;
    compactMode = _savedCompactMode;
    applyFlagsEnabled();
    applyCompactMode();
    applyQuadrantColors();
    _savedColors = null;
    _savedFlagsEnabled = null;
    _savedCompactMode = null;
    document.getElementById('settingsOverlay').classList.remove('visible');
  });

  // Reset individuel par quadrant
  document.querySelector('.settings-fields').addEventListener('click', (e) => {
    const btn = e.target.closest('.quadrant-reset-btn');
    if (!btn) return;
    const qi = parseInt(btn.dataset.quadrantIndex);
    document.getElementById(`qName${qi + 1}`).value = getDefaultQuadrantNames()[qi];
    quadrantColors[qi] = getDefaultQuadrantColors()[qi];
    applyQuadrantColors();
    rebuildPalette(document.querySelector(`.color-palette[data-quadrant="${qi + 1}"]`), qi);
  });

  // Settings — enregistrer
  document.getElementById('settingsSave').addEventListener('click', async () => {
    quadrantNames = [1, 2, 3, 4].map(i =>
      document.getElementById(`qName${i}`).value.trim() || quadrantNames[i - 1]
    );
    flagsEnabled = document.getElementById('flagsToggle').checked;
    compactMode = document.querySelector('.density-btn.active')?.dataset.density === 'compact';
    applyFlagsEnabled();
    applyCompactMode();
    _savedColors = null;
    _savedFlagsEnabled = null;
    _savedCompactMode = null;
    await saveSettings();
    document.getElementById('settingsOverlay').classList.remove('visible');
  });

  // Export
  document.getElementById('exportBtn').addEventListener('click', () => {
    document.getElementById('exportModal').classList.add('visible');
  });
  document.getElementById('exportModalClose').addEventListener('click', () => {
    document.getElementById('exportModal').classList.remove('visible');
  });
  document.getElementById('exportClipboard').addEventListener('click', () => {
    navigator.clipboard.writeText(generateExportContent());
    document.getElementById('exportModal').classList.remove('visible');
  });
  document.getElementById('exportMarkdown').addEventListener('click', async () => {
    const content = generateExportContent();
    document.getElementById('exportModal').classList.remove('visible');
    try {
      const saved = await window.__TAURI__.core.invoke('save_markdown', { content });
      if (saved) showExportToast();
    } catch (e) {
      console.error('Erreur export:', e);
    }
  });

  // Boutons filtre pro/perso
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeFilter = btn.dataset.filter;
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      render();
    });
  });

  // Paste multiligne
  document.addEventListener('paste', (e) => {
    if (e.target.classList.contains('task-edit-input')) return;
    const text = e.clipboardData.getData('text/plain');
    if (!text.includes('\n')) return;
    const lines = parseTaskLines(text);
    if (lines.length > 0) {
      e.preventDefault();
      importTaskLines(lines);
    }
  });
}

// Génère le contenu markdown de l'export
function generateExportContent() {
  const sections = [
    { label: t('export_unsorted'), tasks: filterByFlag(tasks.filter(t => !t.quadrant)) },
    { label: t('export_q1'),       tasks: filterByFlag(tasks.filter(t => t.quadrant === 1)) },
    { label: t('export_q2'),       tasks: filterByFlag(tasks.filter(t => t.quadrant === 2)) },
    { label: t('export_q3'),       tasks: filterByFlag(tasks.filter(t => t.quadrant === 3)) },
    { label: t('export_q4'),       tasks: filterByFlag(tasks.filter(t => t.quadrant === 4)) },
  ];

  return sections
    .filter(s => s.tasks.length > 0)
    .map(s => {
      const lines = s.tasks.map(t => `- [${t.completed ? 'x' : ' '}] ${t.text}`);
      return `## ${s.label}\n\n${lines.join('\n')}`;
    })
    .join('\n\n');
}

// Affiche le toast de confirmation d'export
function showExportToast() {
  const toast = document.getElementById('exportToast');
  toast.classList.add('visible');
  setTimeout(() => toast.classList.remove('visible'), 2500);
}

// Parse le texte brut en [{text, completed}]
function parseTaskLines(text) {
  return text.split('\n')
    .map(line => {
      const t = line.trim();
      if (!t || t === '-') return null;
      if (/^-\s*\[x\]\s+/i.test(t))
        return { text: t.replace(/^-\s*\[x\]\s+/i, '').trim(), completed: true };
      if (/^-\s*\[\s*\]\s+/.test(t))
        return { text: t.replace(/^-\s*\[\s*\]\s+/, '').trim(), completed: false };
      if (/^-\s+/.test(t))
        return { text: t.replace(/^-\s+/, '').trim(), completed: false };
      return { text: t, completed: false };
    })
    .filter(item => item && item.text.length > 0);
}

// Crée et ajoute les tâches parsées
function importTaskLines(parsedLines) {
  parsedLines.forEach(({ text, completed }) => {
    tasks.push({
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      text, quadrant: null, completed,
      createdAt: new Date().toISOString()
    });
  });
  saveTasks();
  render();
}

// Lit un File et importe ses tâches
function handleFileImport(file) {
  const reader = new FileReader();
  reader.onload = (ev) => {
    const lines = parseTaskLines(ev.target.result);
    if (lines.length > 0) importTaskLines(lines);
  };
  reader.readAsText(file);
}

// Ajouter une nouvelle tâche
function addTask() {
  const text = taskInput.value.trim();
  if (!text) return;

  const task = {
    id: Date.now().toString(),
    text: text,
    quadrant: null,
    completed: false,
    createdAt: new Date().toISOString()
  };

  tasks.push(task);
  taskInput.value = '';
  saveTasks();
  render();
}

// Confirme la suppression en attente (si existante)
function confirmPendingDelete() {
  if (!undoPending) return;
  clearTimeout(undoPending.timeout);
  saveTasks();
  undoPending = null;
  document.getElementById('undoToast').classList.remove('visible');
}

// Supprimer une tâche (avec undo pendant 10s)
function deleteTask(id) {
  confirmPendingDelete();

  const index = tasks.findIndex(t => t.id === id);
  const task = tasks[index];
  tasks = tasks.filter(t => t.id !== id);
  render(); // affiche sans la tâche, sans sauvegarder

  const toast = document.getElementById('undoToast');
  toast.classList.add('visible');

  const timeout = setTimeout(() => {
    undoPending = null;
    saveTasks();
    toast.classList.remove('visible');
  }, 10000);

  undoPending = { task, index, timeout };
}

// Modifier le texte d'une tâche
function editTask(id, newText) {
  const trimmed = newText.trim();
  if (!trimmed) return false;
  const task = tasks.find(t => t.id === id);
  if (task && task.text !== trimmed) {
    task.text = trimmed;
    saveTasks();
    render();
    return true;
  }
  return false;
}

function toggleTaskComplete(id) {
  const task = tasks.find(t => t.id === id);
  if (task) {
    task.completed = !task.completed;
    saveTasks();
    render();
  }
}

function removeAllTasks() {
  confirmPendingDelete();
  const modal = document.getElementById('confirmModal');
  modal.classList.add('visible');

  document.getElementById('confirmYes').onclick = () => {
    modal.classList.remove('visible');
    tasks = [];
    saveTasks();
    render();
  };
  document.getElementById('confirmNo').onclick = () => {
    modal.classList.remove('visible');
  };
}

function createTaskElement(task, isDraggable = true) {
  const taskEl = document.createElement('div');
  taskEl.className = 'task-item';
  taskEl.dataset.taskId = task.id;

  if (task.completed) {
    taskEl.classList.add('completed');
  }

  if (task.quadrant) {
    taskEl.classList.add(`q${task.quadrant}`);
  }

  if (isDraggable) {
    taskEl.draggable = true;
    taskEl.addEventListener('dragstart', handleDragStart);
    taskEl.addEventListener('dragend', handleDragEnd);
  }

  // Case à cocher
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'task-checkbox';
  checkbox.checked = task.completed;
  checkbox.onclick = (e) => {
    e.stopPropagation();
    toggleTaskComplete(task.id);
  };

  const textSpan = document.createElement('span');
  textSpan.className = 'task-text';
  textSpan.textContent = task.text;
  textSpan.title = t('task_edit_tooltip');

  textSpan.addEventListener('dblclick', (e) => {
    e.stopPropagation();
    if (isDraggable) taskEl.draggable = false;

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'task-edit-input';
    input.value = task.text;
    textSpan.replaceWith(input);
    input.focus();
    input.select();

    let committed = false;
    const commit = () => {
      if (committed) return;
      committed = true;
      const changed = editTask(task.id, input.value);
      if (!changed) {
        input.replaceWith(textSpan);
        if (isDraggable) taskEl.draggable = true;
      }
      // si changed = true, render() est appelé et reconstruit le DOM
    };
    const cancel = () => {
      if (committed) return;
      committed = true;
      input.replaceWith(textSpan);
      if (isDraggable) taskEl.draggable = true;
    };

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); commit(); }
      if (e.key === 'Escape') { e.preventDefault(); cancel(); }
    });
    input.addEventListener('blur', commit);
  });

  const flagBtn = document.createElement('button');
  flagBtn.className = 'task-flag' + (task.flag ? ` flag-${task.flag}` : '');
  flagBtn.title = t('task_flag_tooltip');
  flagBtn.innerHTML = task.flag ? t(`flag_${task.flag}`) : EMPTY_FLAG_ICON;
  flagBtn.onclick = (e) => {
    e.stopPropagation();
    const next = task.flag === null || task.flag === undefined ? 'pro' : task.flag === 'pro' ? 'perso' : null;
    task.flag = next;
    saveTasks();
    render();
  };

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'task-delete';
  deleteBtn.innerHTML = '×';
  deleteBtn.onclick = (e) => {
    e.stopPropagation();
    deleteTask(task.id);
  };

  taskEl.appendChild(checkbox);
  taskEl.appendChild(textSpan);

  if (isDraggable && !task.completed) {
    const siblings = getSiblingTasks(task);
    const idx = siblings.indexOf(task);

    const arrows = document.createElement('div');
    arrows.className = 'task-arrows';

    const upBtn = document.createElement('button');
    upBtn.className = 'task-arrow';
    upBtn.innerHTML = '↑';
    upBtn.disabled = idx <= 0;
    upBtn.onclick = (e) => { e.stopPropagation(); moveTask(task, 'up'); };

    const downBtn = document.createElement('button');
    downBtn.className = 'task-arrow';
    downBtn.innerHTML = '↓';
    downBtn.disabled = idx >= siblings.length - 1;
    downBtn.onclick = (e) => { e.stopPropagation(); moveTask(task, 'down'); };

    arrows.appendChild(upBtn);
    arrows.appendChild(downBtn);
    taskEl.appendChild(arrows);
  }

  taskEl.appendChild(flagBtn);
  taskEl.appendChild(deleteBtn);

  return taskEl;
}

// Gestion du drag
function handleDragStart(e) {
  draggedTask = e.target;
  e.target.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/html', e.target.innerHTML);
}

function handleDragEnd(e) {
  e.target.classList.remove('dragging');
  draggedTask = null;
  document.querySelectorAll('.quadrant, .unassigned-tasks').forEach(el => {
    el.classList.remove('drag-over');
  });
}

function handleDragOver(e) {
  if (e.preventDefault) e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  const dropTarget = e.target.closest('.quadrant, .unassigned-tasks');
  if (dropTarget) dropTarget.classList.add('drag-over');
  return false;
}

function handleDragLeave(e) {
  const dropTarget = e.target.closest('.quadrant, .unassigned-tasks');
  if (dropTarget && !dropTarget.contains(e.relatedTarget)) {
    dropTarget.classList.remove('drag-over');
  }
}

function handleDrop(e) {
  if (e.stopPropagation) e.stopPropagation();
  e.preventDefault();

  const dropTarget = e.target.closest('.quadrant, .unassigned-tasks');
  if (dropTarget) dropTarget.classList.remove('drag-over');

  if (e.dataTransfer.files.length > 0) {
    handleFileImport(e.dataTransfer.files[0]);
    dragCounter = 0;
    document.getElementById('fileDropOverlay').classList.remove('visible');
    return false;
  }

  if (draggedTask) {
    const taskId = draggedTask.dataset.taskId;
    const dropZone = e.target.closest('[data-drop-zone]');
    const zoneValue = dropZone?.dataset.dropZone;
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      task.quadrant = (zoneValue && zoneValue !== 'unassigned') ? parseInt(zoneValue) : null;
      saveTasks();
      render();
    }
  }

  return false;
}

// Retourne les tâches non terminées du même quadrant visibles selon le filtre actif
function getSiblingTasks(task) {
  return filterByFlag(tasks.filter(t => t.quadrant === task.quadrant && !t.completed));
}

// Déplace une tâche vers le haut ou le bas au sein de son groupe visible
function moveTask(task, direction) {
  const siblings = getSiblingTasks(task);
  const idx = siblings.indexOf(task);
  const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
  if (targetIdx < 0 || targetIdx >= siblings.length) return;

  const other = siblings[targetIdx];
  const posA = tasks.indexOf(task);
  const posB = tasks.indexOf(other);
  tasks[posA] = other;
  tasks[posB] = task;

  saveTasks();
  render();
}

// Filtre les tâches selon le flag actif
function filterByFlag(taskList) {
  if (activeFilter === 'all') return taskList;
  return taskList.filter(t => t.flag === activeFilter);
}

// Rendu de l'interface
function render() {
  // Vider tous les conteneurs
  taskList.innerHTML = '';
  dropZones.forEach(zone => zone.innerHTML = '');

  // Réinitialiser les listes priorisées
  for (let i = 1; i <= 4; i++) {
    document.getElementById(`priority-${i}`).innerHTML = '';
  }

  // Afficher les tâches non assignées
  const unassignedTasks = filterByFlag(tasks
    .filter(t => !t.quadrant))
    .sort((a, b) => a.completed - b.completed);

  if (unassignedTasks.length === 0) {
    taskList.innerHTML = `<div class="empty-state">${t('empty_unassigned')}</div>`;
  } else {
    unassignedTasks.forEach(task => {
      taskList.appendChild(createTaskElement(task));
    });
  }

  // Afficher les tâches dans les quadrants
  for (let i = 1; i <= 4; i++) {
    const quadrantTasks = filterByFlag(tasks.filter(t => t.quadrant === i))
          .sort((a, b) => a.completed === b.completed ? 0 : a.completed ? 1 : -1);

    const zone = document.querySelector(`[data-drop-zone="${i}"]`);

    if (quadrantTasks.length === 0) {
      zone.innerHTML = `<div class="empty-state">${t('empty_quadrant')}</div>`;
    } else {
      quadrantTasks.forEach(task => {
        zone.appendChild(createTaskElement(task));
      });
    }
  }

  // Remplir la liste priorisée (colonne droite)
  renderPriorityList();
}

// Afficher la liste priorisée
function renderPriorityList() {
  for (let i = 1; i <= 4; i++) {
    const priorityContainer = document.getElementById(`priority-${i}`);
    const quadrantTasks = filterByFlag(tasks.filter(t => t.quadrant === i))
          .sort((a, b) => a.completed === b.completed ? 0 : a.completed ? 1 : -1);

    if (quadrantTasks.length === 0) {
      priorityContainer.innerHTML = `<div class="empty-state">${t('empty_priority')}</div>`;
    } else {
      quadrantTasks.forEach(task => {
        priorityContainer.appendChild(createTaskElement(task, false));
      });
    }
  }
}

// Sauvegarde et chargement via Tauri
async function saveTasks() {
  try {
    await window.__TAURI__.core.invoke('save_tasks', { tasks });
  } catch (e) {
    console.error('Erreur de sauvegarde:', e);
  }
}

async function loadTasks() {
  try {
    const loadedTasks = await window.__TAURI__.core.invoke('load_tasks');
    if (loadedTasks && loadedTasks.length > 0) {
      tasks = loadedTasks;
    }
  } catch (e) {
    console.error('Erreur de chargement:', e);
  }
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function applyQuadrantColors() {
  quadrantColors.forEach((color, i) => {
    document.documentElement.style.setProperty(`--q${i + 1}-color`, color);
    document.documentElement.style.setProperty(`--q${i + 1}-color-bg`, hexToRgba(color, 0.12));
  });
}

function rebuildPalette(palette, qi) {
  palette.innerHTML = '';
  PRESET_COLORS.forEach(color => {
    const btn = document.createElement('button');
    btn.className = 'color-swatch' + (quadrantColors[qi] === color ? ' active' : '');
    btn.style.background = color;
    btn.dataset.color = color;
    btn.addEventListener('click', () => {
      quadrantColors[qi] = color;
      applyQuadrantColors();
      palette.querySelectorAll('.color-swatch').forEach(s =>
        s.classList.toggle('active', s.dataset.color === color)
      );
    });
    palette.appendChild(btn);
  });
}

function buildColorPalettes() {
  document.querySelectorAll('.color-palette').forEach(palette => {
    rebuildPalette(palette, parseInt(palette.dataset.quadrant) - 1);
  });
}

function applyCompactMode() {
  document.body.classList.toggle('compact-mode', compactMode);
}

function applyFlagsEnabled() {
  document.body.classList.toggle('flags-disabled', !flagsEnabled);
  if (!flagsEnabled && activeFilter !== 'all') {
    activeFilter = 'all';
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('.filter-btn[data-filter="all"]').classList.add('active');
    render();
  }
}

async function loadSettings() {
  try {
    const s = await window.__TAURI__.core.invoke('load_settings');
    quadrantNames = s.quadrant_names;
    quadrantColors = s.quadrant_colors;
    flagsEnabled = s.flags_enabled ?? true;
    compactMode = s.compact_mode ?? false;
  } catch (e) {
    quadrantNames = getDefaultQuadrantNames();
    quadrantColors = getDefaultQuadrantColors();
    flagsEnabled = true;
    compactMode = false;
  }
  applyQuadrantNames();
  applyQuadrantColors();
  applyFlagsEnabled();
  applyCompactMode();
}

function applyQuadrantNames() {
  document.querySelectorAll('.quadrant h3').forEach((el, i) => {
    el.textContent = quadrantNames[i];
  });
}

function resetQuadrantNamesToDefaults() {
  quadrantNames = getDefaultQuadrantNames();
  quadrantColors = getDefaultQuadrantColors();
  for (let i = 0; i < 4; i++) {
    const input = document.getElementById(`qName${i + 1}`);
    if (input) input.value = quadrantNames[i];
  }
  saveSettings();
  applyQuadrantNames();
  applyQuadrantColors();
}

async function saveSettings() {
  try {
    await window.__TAURI__.core.invoke('save_settings', {
      settings: { quadrant_names: quadrantNames, quadrant_colors: quadrantColors, flags_enabled: flagsEnabled, compact_mode: compactMode }
    });
    applyQuadrantNames();
    applyQuadrantColors();
  } catch (e) {
    console.error('Erreur sauvegarde settings:', e);
  }
}

// Gestion des raccourcis clavier
document.addEventListener('keydown', (e) => {
  // Cmd/Ctrl + N : Nouvelle tâche
  if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
    e.preventDefault();
    taskInput.focus();
  }
});

// Gestion du thème
const themeToggle = document.getElementById('themeToggle');

const ICON_SUN = `<svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round">
  <circle cx="7.5" cy="7.5" r="2.5"/>
  <line x1="7.5" y1="1" x2="7.5" y2="2.5"/>
  <line x1="7.5" y1="12.5" x2="7.5" y2="14"/>
  <line x1="1" y1="7.5" x2="2.5" y2="7.5"/>
  <line x1="12.5" y1="7.5" x2="14" y2="7.5"/>
  <line x1="3.2" y1="3.2" x2="4.2" y2="4.2"/>
  <line x1="10.8" y1="10.8" x2="11.8" y2="11.8"/>
  <line x1="11.8" y1="3.2" x2="10.8" y2="4.2"/>
  <line x1="4.2" y1="10.8" x2="3.2" y2="11.8"/>
</svg>`;

const ICON_MOON = `<svg width="15" height="15" viewBox="0 0 15 15" fill="currentColor" stroke="none">
  <path d="M7.5 1a6.5 6.5 0 1 0 0 13A6.5 6.5 0 0 0 7.5 1zm0 1a5.5 5.5 0 0 1 3.9 9.4A5 5 0 0 1 5 4.1 5.5 5.5 0 0 1 7.5 2z"/>
</svg>`;

// Charger le thème sauvegardé
const savedTheme = localStorage.getItem('theme') || 'dark';
if (savedTheme === 'dark') {
  document.body.classList.add('dark-theme');
  themeToggle.innerHTML = ICON_SUN;
} else {
  themeToggle.innerHTML = ICON_MOON;
}

// Basculer le thème
themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark-theme');
  const isDark = document.body.classList.contains('dark-theme');
  themeToggle.innerHTML = isDark ? ICON_SUN : ICON_MOON;
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
});

// ─── Gestion des mises à jour ────────────────────────────────────────────────
const updateBanner = document.getElementById('updateBanner');
const updateModal = document.getElementById('updateModal');
const updateModalTitle = document.getElementById('updateModalTitle');
const updateModalVersion = document.getElementById('updateModalVersion');
const updateModalNotes = document.getElementById('updateModalNotes');
const updateProgress = document.getElementById('updateProgress');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const updateModalButtons = document.getElementById('updateModalButtons');
const updateModalClose = document.getElementById('updateModalClose');
const updateModalInstall = document.getElementById('updateModalInstall');

let pendingUpdateInfo = null;

function showUpdateModal() {
  updateModalTitle.textContent = t('update_available');
  updateModalVersion.textContent = pendingUpdateInfo.version ? `Version ${pendingUpdateInfo.version}` : '';
  updateModalNotes.textContent = pendingUpdateInfo.notes || '';
  updateProgress.style.display = 'none';
  progressText.style.display = 'none';
  progressFill.style.width = '0%';
  updateModalButtons.style.display = 'flex';
  updateModalInstall.style.display = '';
  updateModal.classList.add('visible');
}

function signalUpdateAvailable(info) {
  pendingUpdateInfo = info;
  updateBanner.style.display = 'block';
}

// Écouter la détection automatique au démarrage
if (window.__TAURI__) {
  window.__TAURI__.event.listen('update-available', (event) => {
    signalUpdateAvailable(event.payload);
  });

  // Vérification de secours : si l'événement Rust est émis avant le listener,
  // on revérifie après un court délai
  setTimeout(async () => {
    if (!pendingUpdateInfo) {
      try {
        const info = await window.__TAURI__.core.invoke('check_for_updates');
        if (info.available) signalUpdateAvailable(info);
      } catch (e) {
        // silencieux, c'est une vérification de fond
      }
    }
  }, 3000);
}

// Clic sur le bandeau
updateBanner.addEventListener('click', showUpdateModal);

// Fermer la modale
updateModalClose.addEventListener('click', () => {
  updateModal.classList.remove('visible');
});

// Installer la mise à jour
updateModalInstall.addEventListener('click', async () => {
  updateModalButtons.style.display = 'none';
  updateProgress.style.display = 'block';
  progressText.style.display = 'block';
  progressText.textContent = t('update_downloading');

  let downloaded = 0;
  let total = null;

  try {
    const { Channel } = window.__TAURI__.core;
    const onEvent = new Channel();

    onEvent.onmessage = (event) => {
      if (event.event === 'started') {
        total = event.data.content_length || null;
        progressFill.style.width = '0%';
      } else if (event.event === 'progress') {
        downloaded += event.data.chunk_length;
        if (total) {
          const pct = Math.round((downloaded / total) * 100);
          progressFill.style.width = pct + '%';
          progressText.textContent = t('update_downloading_pct', pct);
        } else {
          progressText.textContent = t('update_downloading_kb', Math.round(downloaded / 1024));
        }
      } else if (event.event === 'finished') {
        progressFill.style.width = '100%';
        progressText.textContent = t('update_installing');
      }
    };

    await window.__TAURI__.core.invoke('install_update', { onEvent });
  } catch (e) {
    console.error('Erreur installation mise à jour:', e);
    progressText.textContent = t('update_error') + e;
    updateModalButtons.style.display = 'flex';
    updateModalInstall.style.display = 'none';
  }
});
