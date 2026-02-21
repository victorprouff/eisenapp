// État de l'application
let tasks = [];
let draggedTask = null;
let dragCounter = 0;

// Éléments DOM
const taskInput = document.getElementById('taskInput');
const addTaskBtn = document.getElementById('addTaskBtn');
const taskList = document.getElementById('taskList');
const dropZones = document.querySelectorAll('.quadrant-tasks');

// Initialisation
document.addEventListener('DOMContentLoaded', async () => {
  await loadTasks();
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

  // Supprimer toutes les tâches
  document.getElementById('clearTasks').addEventListener('click', removeAllTasks);

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
    { label: 'Non trié',                            tasks: tasks.filter(t => !t.quadrant) },
    { label: 'Faire immédiatement',                 tasks: tasks.filter(t => t.quadrant === 1) },
    { label: 'Planifier',                           tasks: tasks.filter(t => t.quadrant === 2) },
    { label: 'Faire si on a le temps',              tasks: tasks.filter(t => t.quadrant === 3) },
    { label: 'À piocher si on a le temps et envie', tasks: tasks.filter(t => t.quadrant === 4) },
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

// Supprimer une tâche
function deleteTask(id) {
  tasks = tasks.filter(task => task.id !== id);
  saveTasks();
  render();
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
  textSpan.title = 'Double-cliquer pour modifier';

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

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'task-delete';
  deleteBtn.innerHTML = '×';
  deleteBtn.onclick = (e) => {
    e.stopPropagation();
    deleteTask(task.id);
  };

  taskEl.appendChild(checkbox);
  taskEl.appendChild(textSpan);
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

  // Retirer l'état drag-over de tous les quadrants
  document.querySelectorAll('.quadrant').forEach(q => {
    q.classList.remove('drag-over');
  });
}

function handleDragOver(e) {
  if (e.preventDefault) {
    e.preventDefault();
  }

  e.dataTransfer.dropEffect = 'move';

  // Ajouter l'effet visuel au quadrant
  const quadrant = e.target.closest('.quadrant');
  if (quadrant) {
    quadrant.classList.add('drag-over');
  }

  return false;
}

function handleDragLeave(e) {
  const quadrant = e.target.closest('.quadrant');
  if (quadrant && !quadrant.contains(e.relatedTarget)) {
    quadrant.classList.remove('drag-over');
  }
}

function handleDrop(e) {
  if (e.stopPropagation) {
    e.stopPropagation();
  }

  e.preventDefault();

  if (e.dataTransfer.files.length > 0) {
    handleFileImport(e.dataTransfer.files[0]);
    dragCounter = 0;
    document.getElementById('fileDropOverlay').classList.remove('visible');
    const quadrant = e.target.closest('.quadrant');
    if (quadrant) quadrant.classList.remove('drag-over');
    return false;
  }

  const quadrant = e.target.closest('.quadrant');
  quadrant.classList.remove('drag-over');

  if (draggedTask) {
    const taskId = draggedTask.dataset.taskId;
    const dropZone = e.target.closest('[data-drop-zone]');
    const quadrantNumber = dropZone ? parseInt(dropZone.dataset.dropZone) : NaN;

    // Mettre à jour la tâche
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      task.quadrant = quadrantNumber;
      saveTasks();
      render();
    }
  }

  return false;
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
  const unassignedTasks = tasks
    .filter(t => !t.quadrant)
    .sort((a, b) => a.completed - b.completed);

  if (unassignedTasks.length === 0) {
    taskList.innerHTML = '<div class="empty-state">Aucune tâche en attente</div>';
  } else {
    unassignedTasks.forEach(task => {
      taskList.appendChild(createTaskElement(task));
    });
  }

  // Afficher les tâches dans les quadrants
  for (let i = 1; i <= 4; i++) {
    const quadrantTasks = tasks.filter(t => t.quadrant === i)
          .sort((a, b) => a.completed === b.completed ? 0 : a.completed ? 1 : -1);

    const zone = document.querySelector(`[data-drop-zone="${i}"]`);

    if (quadrantTasks.length === 0) {
      zone.innerHTML = '<div class="empty-state">Glissez une tâche ici</div>';
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
    const quadrantTasks = tasks.filter(t => t.quadrant === i)
          .sort((a, b) => a.completed === b.completed ? 0 : a.completed ? 1 : -1);

    if (quadrantTasks.length === 0) {
      priorityContainer.innerHTML = '<div class="empty-state">Aucune tâche</div>';
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
const themeIcon = themeToggle.querySelector('.theme-icon');

// Charger le thème sauvegardé
const savedTheme = localStorage.getItem('theme') || 'dark';
if (savedTheme === 'dark') {
  document.body.classList.add('dark-theme');
  themeIcon.textContent = '☀️';
}

// Basculer le thème
themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark-theme');
  const isDark = document.body.classList.contains('dark-theme');
  themeIcon.textContent = isDark ? '☀️' : '🌙';
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
  updateModalTitle.textContent = 'Mise à jour disponible';
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
  progressText.textContent = 'Téléchargement en cours…';

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
          progressText.textContent = `Téléchargement… ${pct}%`;
        } else {
          progressText.textContent = `Téléchargement… ${Math.round(downloaded / 1024)} Ko`;
        }
      } else if (event.event === 'finished') {
        progressFill.style.width = '100%';
        progressText.textContent = 'Installation en cours…';
      }
    };

    await window.__TAURI__.core.invoke('install_update', { onEvent });
  } catch (e) {
    console.error('Erreur installation mise à jour:', e);
    progressText.textContent = 'Erreur : ' + e;
    updateModalButtons.style.display = 'flex';
    updateModalInstall.style.display = 'none';
  }
});
