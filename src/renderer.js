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
let compactMode = true;
let flagList = ['Pro', 'Perso'];
let editingFlagList = null;
let flagColors = { Pro: '#1d4ed8', Perso: '#be185d' };
let editingFlagColors = null;
let newFlagColor = '#16a34a';
let activeFilter = new Set(); // ensemble vide = "Tous"
let showCompleted = true;

// Dropdown flag
let _dropdownTask = null;
let _dropdownBtn = null;

// Palette couleur flag
let _colorPaletteCallback = null;
let _colorPaletteCurrentDot = null;

const FLAG_COLORS = [
  '#1d4ed8', '#be185d', '#16a34a', '#d97706',
  '#7c3aed', '#0d9488', '#dc2626', '#f97316', '#64748b',
];

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
  buildFilterBar();
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

  // Feedback
  document.getElementById('feedbackBtn').addEventListener('click', openFeedbackModal);
  document.getElementById('feedbackClose').addEventListener('click', () => document.getElementById('feedbackModal').classList.remove('visible'));
  document.getElementById('feedbackDone').addEventListener('click', () => document.getElementById('feedbackModal').classList.remove('visible'));
  document.getElementById('feedbackFormEl').addEventListener('submit', submitFeedback);
  document.getElementById('feedbackIssuesLink').addEventListener('click', (e) => {
    e.preventDefault();
    window.__TAURI__.opener.openUrl('https://github.com/victorprouff/eisenapp/issues');
  });

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

  // Fermer le dropdown flag au clic extérieur
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#flagDropdown') && !e.target.closest('.task-flag')) {
      closeFlagDropdown();
    }
  });

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
    editingFlagList = [...flagList];
    editingFlagColors = { ...flagColors };
    newFlagColor = getNextFlagColor();
    for (let i = 0; i < 4; i++)
      document.getElementById(`qName${i + 1}`).value = quadrantNames[i];
    document.getElementById('flagsToggle').checked = flagsEnabled;
    document.getElementById('newFlagColorDot').style.background = newFlagColor;
    document.querySelectorAll('.density-btn').forEach(b =>
      b.classList.toggle('active', b.dataset.density === (compactMode ? 'compact' : 'normal'))
    );
    buildFlagsList();
    buildColorPalettes();
    document.getElementById('settingsOverlay').classList.add('visible');
  });

  // Settings — annuler
  document.getElementById('settingsCancel').addEventListener('click', () => {
    quadrantColors = [..._savedColors];
    flagsEnabled = _savedFlagsEnabled;
    compactMode = _savedCompactMode;
    editingFlagList = null;
    editingFlagColors = null;
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

    // Nettoyer les tâches dont le flag a été supprimé
    const removedFlags = flagList.filter(f => !editingFlagList.includes(f));
    if (removedFlags.length > 0) {
      tasks.forEach(task => { if (removedFlags.includes(task.flag)) task.flag = null; });
      removedFlags.forEach(f => activeFilter.delete(f));
      await saveTasks();
    }
    flagList = [...editingFlagList];
    flagColors = { ...editingFlagColors };
    editingFlagList = null;
    editingFlagColors = null;

    applyFlagsEnabled();
    applyCompactMode();
    buildFilterBar();
    _savedColors = null;
    _savedFlagsEnabled = null;
    _savedCompactMode = null;
    await saveSettings();
    render();
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

  // Gestionnaire d'ajout de flag dans les settings
  document.getElementById('addFlagBtn').addEventListener('click', addFlagFromInput);
  document.getElementById('flagInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); addFlagFromInput(); }
  });
  document.getElementById('newFlagColorDot').addEventListener('click', (e) => {
    e.stopPropagation();
    openFlagColorPalette(e.currentTarget, (color) => {
      newFlagColor = color;
      document.getElementById('newFlagColorDot').style.background = color;
    });
  });

  // Fermer la palette couleur au clic extérieur
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#flagColorPalette') && !e.target.closest('.flag-color-dot')) {
      closeFlagColorPalette();
    }
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
      const lines = s.tasks.map(t => `- [${t.completed ? 'x' : ' '}] ${t.flag ? `[${t.flag}] ` : ''}${t.text}`);
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
  const flag = activeFilter.size === 1 ? [...activeFilter][0] : null;
  parsedLines.forEach(({ text, completed }) => {
    tasks.push({
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      text, quadrant: null, completed, flag,
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
    flag: activeFilter.size === 1 ? [...activeFilter][0] : null,
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
  const filterSection = document.getElementById('deleteFilterSection');
  const filterOptions = document.getElementById('deleteFilterOptions');

  filterOptions.innerHTML = '';

  if (flagsEnabled && flagList.length > 0) {
    filterSection.style.display = '';

    // Présélection : flags actifs si filtre en cours, sinon tous
    const defaultSelected = activeFilter.size > 0 ? activeFilter : new Set([...flagList, '__none__']);

    flagList.forEach(flag => {
      if (!tasks.some(t => t.flag === flag)) return;
      const row = document.createElement('label');
      row.className = 'delete-filter-row';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.value = flag;
      cb.checked = defaultSelected.has(flag);
      const dot = document.createElement('span');
      dot.className = 'flag-option-dot';
      dot.style.background = flagColors[flag] || '#888';
      const label = document.createElement('span');
      label.textContent = flag;
      row.append(cb, dot, label);
      filterOptions.appendChild(row);
    });

    if (tasks.some(t => !t.flag)) {
      const row = document.createElement('label');
      row.className = 'delete-filter-row';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.value = '__none__';
      cb.checked = defaultSelected.has('__none__');
      const label = document.createElement('span');
      label.textContent = t('flag_none');
      row.append(cb, label);
      filterOptions.appendChild(row);
    }
  } else {
    filterSection.style.display = 'none';
  }

  modal.classList.add('visible');

  document.getElementById('confirmYes').onclick = () => {
    modal.classList.remove('visible');
    if (flagsEnabled && flagList.length > 0) {
      const checkedFlags = new Set();
      let deleteNone = false;
      filterOptions.querySelectorAll('input[type=checkbox]').forEach(cb => {
        if (cb.checked) {
          if (cb.value === '__none__') deleteNone = true;
          else checkedFlags.add(cb.value);
        }
      });
      tasks = tasks.filter(t => {
        if (!t.flag) return !deleteNone;
        return !checkedFlags.has(t.flag);
      });
    } else {
      tasks = [];
    }
    saveTasks();
    render();
  };
  document.getElementById('confirmNo').onclick = () => {
    modal.classList.remove('visible');
  };
}

function openFeedbackModal() {
  document.getElementById('feedbackFormView').style.display = '';
  document.getElementById('feedbackSentView').style.display = 'none';
  document.getElementById('feedbackError').style.display = 'none';
  document.getElementById('feedbackFormEl').reset();
  document.getElementById('feedbackSubmit').disabled = false;
  document.getElementById('feedbackModal').classList.add('visible');
}

async function submitFeedback(e) {
  e.preventDefault();
  const form = e.target;
  const submitBtn = document.getElementById('feedbackSubmit');
  const errorEl = document.getElementById('feedbackError');
  submitBtn.disabled = true;
  errorEl.style.display = 'none';
  try {
    const data = Object.fromEntries(new FormData(form).entries());
    await window.__TAURI__.core.invoke('submit_feedback', {
      type: data.type,
      titre: data.titre,
      description: data.description,
      email: data.email ?? '',
    });
    document.getElementById('feedbackFormView').style.display = 'none';
    document.getElementById('feedbackSentView').style.display = '';
  } catch {
    errorEl.textContent = '';
    errorEl.style.display = '';
    submitBtn.disabled = false;
  }
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
  flagBtn.className = 'task-flag';
  flagBtn.dataset.flag = task.flag || '';
  flagBtn.title = t('task_flag_tooltip');
  flagBtn.innerHTML = task.flag ? task.flag : EMPTY_FLAG_ICON;
  if (task.flag) applyFlagBadgeStyle(flagBtn, task.flag);
  flagBtn.onclick = (e) => {
    e.stopPropagation();
    openFlagDropdown(task, flagBtn);
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

// Filtre uniquement par flag actif (sans tenir compte de showCompleted)
function filterByFlag(list) {
  if (activeFilter.size === 0) return list;
  return list.filter(t => activeFilter.has(t.flag));
}

// Filtre les tâches selon le flag actif et la visibilité des terminées
function filterTasks(list) {
  let result = filterByFlag(list);
  if (!showCompleted) result = result.filter(t => !t.completed);
  return result;
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
  const unassignedTasks = filterTasks(tasks
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
    const quadrantTasks = filterTasks(tasks.filter(t => t.quadrant === i))
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
    const quadrantTasks = filterTasks(tasks.filter(t => t.quadrant === i))
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

// Reconstruit la barre de filtre selon flagList
function buildFilterBar() {
  const bar = document.querySelector('.filter-bar');
  bar.innerHTML = '';

  const allBtn = document.createElement('button');
  allBtn.className = 'filter-btn' + (activeFilter.size === 0 ? ' active' : '');
  allBtn.dataset.filter = 'all';
  allBtn.textContent = t('filter_all');
  allBtn.addEventListener('click', () => {
    activeFilter = new Set();
    buildFilterBar();
    render();
  });
  bar.appendChild(allBtn);

  flagList.forEach(flag => {
    const btn = document.createElement('button');
    btn.className = 'filter-btn' + (activeFilter.has(flag) ? ' active' : '');
    btn.dataset.filter = flag;
    btn.textContent = flag;
    btn.addEventListener('click', () => {
      if (activeFilter.has(flag)) {
        activeFilter.delete(flag);
      } else {
        activeFilter.add(flag);
      }
      buildFilterBar();
      render();
    });
    bar.appendChild(btn);
  });

  const sep = document.createElement('span');
  sep.className = 'filter-separator';
  bar.appendChild(sep);

  const completedBtn = document.createElement('button');
  completedBtn.className = 'filter-btn filter-btn-completed' + (!showCompleted ? ' active' : '');
  completedBtn.textContent = t('filter_hide_completed');
  completedBtn.addEventListener('click', () => {
    showCompleted = !showCompleted;
    buildFilterBar();
    render();
  });
  bar.appendChild(completedBtn);
}

// Reconstruit la liste de flags dans les settings
function buildFlagsList() {
  const list = document.getElementById('flagsList');
  list.innerHTML = '';
  editingFlagList.forEach((flag, i) => {
    const item = document.createElement('div');
    item.className = 'flag-item';

    const colorDot = document.createElement('button');
    colorDot.className = 'flag-color-dot';
    colorDot.style.background = editingFlagColors[flag] || '#64748b';
    colorDot.title = 'Changer la couleur';
    colorDot.onclick = (e) => {
      e.stopPropagation();
      openFlagColorPalette(colorDot, (color) => {
        editingFlagColors[flag] = color;
        colorDot.style.background = color;
      }, editingFlagColors[flag]);
    };

    const name = document.createElement('span');
    name.textContent = flag;

    const delBtn = document.createElement('button');
    delBtn.className = 'flag-item-delete';
    delBtn.innerHTML = '×';
    delBtn.title = 'Supprimer';
    delBtn.onclick = () => {
      editingFlagList.splice(i, 1);
      delete editingFlagColors[flag];
      buildFlagsList();
    };

    item.appendChild(colorDot);
    item.appendChild(name);
    item.appendChild(delBtn);
    list.appendChild(item);
  });
  document.querySelector('.flags-add-row').style.display = editingFlagList.length >= 7 ? 'none' : '';
}

function addFlagFromInput() {
  const input = document.getElementById('flagInput');
  const name = input.value.trim();
  if (!name || editingFlagList.includes(name) || editingFlagList.length >= 7) return;
  editingFlagList.push(name);
  editingFlagColors[name] = newFlagColor;
  input.value = '';
  buildFlagsList();
  // Pré-sélectionner la prochaine couleur disponible
  newFlagColor = getNextFlagColor();
  document.getElementById('newFlagColorDot').style.background = newFlagColor;
}

// Dropdown de sélection de flag sur une tâche
function openFlagDropdown(task, btn) {
  if (_dropdownBtn === btn) { closeFlagDropdown(); return; }
  closeFlagDropdown();
  _dropdownTask = task;
  _dropdownBtn = btn;

  const dropdown = document.getElementById('flagDropdown');
  dropdown.innerHTML = '';

  const noneOpt = document.createElement('button');
  noneOpt.className = 'flag-option' + (!task.flag ? ' selected' : '');
  noneOpt.style.display = 'flex';
  noneOpt.style.alignItems = 'center';
  const noneDot = document.createElement('span');
  noneDot.className = 'flag-option-dot';
  noneDot.style.background = 'var(--border-color)';
  noneOpt.appendChild(noneDot);
  noneOpt.appendChild(document.createTextNode(t('flag_none')));
  noneOpt.onclick = () => setTaskFlag(task, null);
  dropdown.appendChild(noneOpt);

  flagList.forEach(flag => {
    const opt = document.createElement('button');
    opt.className = 'flag-option' + (task.flag === flag ? ' selected' : '');
    opt.style.display = 'flex';
    opt.style.alignItems = 'center';
    const dot = document.createElement('span');
    dot.className = 'flag-option-dot';
    dot.style.background = flagColors[flag] || '#64748b';
    opt.appendChild(dot);
    opt.appendChild(document.createTextNode(flag));
    opt.onclick = () => setTaskFlag(task, flag);
    dropdown.appendChild(opt);
  });

  const rect = btn.getBoundingClientRect();
  dropdown.style.left = rect.left + 'px';
  dropdown.style.top = (rect.bottom + 4) + 'px';
  dropdown.classList.add('visible');
}

function closeFlagDropdown() {
  document.getElementById('flagDropdown').classList.remove('visible');
  _dropdownTask = null;
  _dropdownBtn = null;
}

function setTaskFlag(task, flag) {
  task.flag = flag;
  closeFlagDropdown();
  saveTasks();
  render();
}

function getNextFlagColor() {
  const used = new Set(Object.values(editingFlagColors));
  return FLAG_COLORS.find(c => !used.has(c)) || FLAG_COLORS[0];
}

function applyFlagBadgeStyle(btn, flagName) {
  const color = flagColors[flagName];
  if (color) {
    btn.style.background = hexToRgba(color, 0.15);
    btn.style.color = color;
    btn.style.borderColor = hexToRgba(color, 0.4);
  }
}

function openFlagColorPalette(dotBtn, onSelect, currentColor) {
  closeFlagColorPalette();
  _colorPaletteCallback = onSelect;
  _colorPaletteCurrentDot = dotBtn;

  const palette = document.getElementById('flagColorPalette');
  palette.innerHTML = '';
  FLAG_COLORS.forEach(color => {
    const btn = document.createElement('button');
    btn.className = 'flag-color-option' + (color === currentColor ? ' active' : '');
    btn.style.background = color;
    btn.onclick = (e) => {
      e.stopPropagation();
      onSelect(color);
      closeFlagColorPalette();
    };
    palette.appendChild(btn);
  });

  const rect = dotBtn.getBoundingClientRect();
  palette.style.left = rect.left + 'px';
  palette.style.top = (rect.bottom + 6) + 'px';
  palette.classList.add('visible');
}

function closeFlagColorPalette() {
  document.getElementById('flagColorPalette').classList.remove('visible');
  _colorPaletteCallback = null;
  _colorPaletteCurrentDot = null;
}

function applyCompactMode() {
  document.body.classList.toggle('compact-mode', compactMode);
}

function applyFlagsEnabled() {
  document.body.classList.toggle('flags-disabled', !flagsEnabled);
  if (!flagsEnabled && activeFilter.size > 0) {
    activeFilter = new Set();
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
    compactMode = s.compact_mode ?? true;
    flagList = s.flags?.length ? s.flags : ['Pro', 'Perso'];
    flagColors = Object.keys(s.flag_colors || {}).length
      ? s.flag_colors
      : { Pro: '#1d4ed8', Perso: '#be185d' };
  } catch (e) {
    quadrantNames = getDefaultQuadrantNames();
    quadrantColors = getDefaultQuadrantColors();
    flagsEnabled = true;
    compactMode = true;
    flagList = ['Pro', 'Perso'];
    flagColors = { Pro: '#1d4ed8', Perso: '#be185d' };
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
      settings: { quadrant_names: quadrantNames, quadrant_colors: quadrantColors, flags_enabled: flagsEnabled, compact_mode: compactMode, flags: flagList, flag_colors: flagColors }
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
