// État de l'application
let tasks = [];
let draggedTask = null;

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
