// Application State
let tasksState = [];
let activeFilter = 'all'; // 'all', 'todo', 'in_progress', 'completed'
let activePriorityFilter = null; // 'low', 'medium', 'high' or null
let viewMode = 'kanban'; // 'kanban' or 'list'
let searchQuery = '';

// API URL (Relative to host)
const API_BASE = '/api/tasks';

// DOM Elements
const taskModal = document.getElementById('task-modal');
const taskForm = document.getElementById('task-form');
const modalHeading = document.getElementById('modal-heading-title');
const formTaskId = document.getElementById('form-task-id');
const formTitle = document.getElementById('form-title');
const formDescription = document.getElementById('form-description');
const formStatus = document.getElementById('form-status');
const formPriority = document.getElementById('form-priority');
const formDueDate = document.getElementById('form-due-date');
const toastContainer = document.getElementById('toast-container-wrapper');

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    fetchTasks();
    setupDragAndDrop();
});

// Fetch all tasks from Backend
async function fetchTasks() {
    try {
        const response = await fetch(API_BASE);
        if (!response.ok) throw new Error('Failed to retrieve tasks');
        tasksState = await response.json();
        renderWorkspace();
        updateAnalytics();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// Render the application based on current viewMode, filters, and searches
function renderWorkspace() {
    // 1. Filter tasks state
    let filtered = [...tasksState];

    // Filter by main status (if not 'all')
    if (activeFilter !== 'all') {
        filtered = filtered.filter(task => task.status === activeFilter);
    }

    // Filter by priority (if selected)
    if (activePriorityFilter) {
        filtered = filtered.filter(task => task.priority === activePriorityFilter);
    }

    // Filter by search query
    if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(task => 
            task.title.toLowerCase().includes(query) || 
            (task.description && task.description.toLowerCase().includes(query))
        );
    }

    // Update column badges (for the full counts regardless of sidebar filters, or current filters?)
    // Standard approach: column badges show count of tasks matching current active priority/search filters
    updateColumnBadges(filtered);

    // 2. Render view modes
    if (viewMode === 'kanban') {
        renderKanban(filtered);
    } else {
        renderList(filtered);
    }
}

// Render Kanban Board columns
function renderKanban(tasks) {
    const todoContainer = document.getElementById('tasks-todo');
    const progressContainer = document.getElementById('tasks-progress');
    const completedContainer = document.getElementById('tasks-completed');

    // Clear previous
    todoContainer.innerHTML = '';
    progressContainer.innerHTML = '';
    completedContainer.innerHTML = '';

    const columns = {
        todo: { container: todoContainer, count: 0 },
        in_progress: { container: progressContainer, count: 0 },
        completed: { container: completedContainer, count: 0 }
    };

    tasks.forEach(task => {
        const col = columns[task.status];
        if (col) {
            col.container.appendChild(createTaskCardElement(task));
            col.count++;
        }
    });

    // Handle empty columns
    Object.keys(columns).forEach(status => {
        if (columns[status].count === 0) {
            columns[status].container.innerHTML = `
                <div class="empty-state">
                    <i class="fa-regular fa-folder-open"></i>
                    <p class="empty-state-text">No tasks here</p>
                </div>
            `;
        }
    });
}

// Create Task HTML Card element for Kanban
function createTaskCardElement(task) {
    const card = document.createElement('div');
    card.className = 'task-card';
    card.setAttribute('draggable', 'true');
    card.setAttribute('data-id', task.id);
    card.id = `task-card-${task.id}`;

    // Format Due date
    let dueHTML = '';
    if (task.due_date) {
        const due = new Date(task.due_date);
        const isOverdue = due < new Date() && task.status !== 'completed';
        const formatted = due.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        dueHTML = `
            <div class="task-card-due ${isOverdue ? 'overdue' : ''}">
                <i class="fa-regular fa-clock"></i>
                <span>${formatted}${isOverdue ? ' (Overdue)' : ''}</span>
            </div>
        `;
    }

    card.innerHTML = `
        <div class="task-card-header">
            <h4 class="task-card-title">${escapeHTML(task.title)}</h4>
            <div class="task-card-actions">
                <button class="task-action-btn btn-edit" onclick="openEditModal(${task.id})" title="Edit Task">
                    <i class="fa-solid fa-pen-to-square"></i>
                </button>
                <button class="task-action-btn btn-delete" onclick="deleteTask(${task.id})" title="Delete Task">
                    <i class="fa-regular fa-trash-can"></i>
                </button>
            </div>
        </div>
        <p class="task-card-desc">${task.description ? escapeHTML(task.description) : 'No description provided.'}</p>
        <div class="task-card-footer">
            <span class="priority-badge badge-${task.priority}">${task.priority}</span>
            ${dueHTML}
        </div>
    `;

    // Attach drag events
    card.addEventListener('dragstart', (e) => {
        card.classList.add('dragging');
        e.dataTransfer.setData('text/plain', task.id);
    });

    card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
    });

    return card;
}

// Render List View
function renderList(tasks) {
    const listWrapper = document.getElementById('list-items-wrapper');
    listWrapper.innerHTML = '';

    if (tasks.length === 0) {
        listWrapper.innerHTML = `
            <div class="empty-state" style="padding: 60px 20px;">
                <i class="fa-regular fa-folder-open" style="font-size: 3rem;"></i>
                <h3 style="margin-top: 15px;">No tasks found</h3>
                <p class="empty-state-text">Try tweaking your search or filters.</p>
            </div>
        `;
        return;
    }

    tasks.forEach(task => {
        const row = document.createElement('div');
        row.className = 'list-item-row';
        row.id = `task-row-${task.id}`;

        let dueHTML = '<span style="color: var(--text-muted);">None</span>';
        if (task.due_date) {
            const due = new Date(task.due_date);
            const isOverdue = due < new Date() && task.status !== 'completed';
            const formatted = due.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
            dueHTML = `<span class="${isOverdue ? 'overdue' : ''}" style="${isOverdue ? 'color: var(--priority-high); font-weight: 600;' : ''}">${formatted}</span>`;
        }

        const statusLabels = {
            todo: { text: 'To Do', class: 'todo' },
            in_progress: { text: 'In Progress', class: 'progress' },
            completed: { text: 'Completed', class: 'completed' }
        };
        const statusDetails = statusLabels[task.status] || { text: task.status, class: 'todo' };

        row.innerHTML = `
            <div class="col-title">
                <span class="list-title-text">${escapeHTML(task.title)}</span>
                <span class="list-desc-text">${task.description ? escapeHTML(task.description) : 'No description'}</span>
            </div>
            <div class="col-status">
                <span class="status-pill status-pill-${statusDetails.class}">${statusDetails.text}</span>
            </div>
            <div class="col-priority">
                <span class="priority-badge badge-${task.priority}">${task.priority}</span>
            </div>
            <div class="col-due">
                ${dueHTML}
            </div>
            <div class="col-actions">
                <button class="task-action-btn btn-edit" onclick="openEditModal(${task.id})" title="Edit Task">
                    <i class="fa-solid fa-pen-to-square"></i>
                </button>
                <button class="task-action-btn btn-delete" onclick="deleteTask(${task.id})" title="Delete Task">
                    <i class="fa-regular fa-trash-can"></i>
                </button>
            </div>
        `;
        listWrapper.appendChild(row);
    });
}

// Update counters in Dashboard Analytics panel
function updateAnalytics() {
    const total = tasksState.length;
    const todo = tasksState.filter(t => t.status === 'todo').length;
    const progress = tasksState.filter(t => t.status === 'in_progress').length;
    const completed = tasksState.filter(t => t.status === 'completed').length;

    document.getElementById('stats-total').innerText = total;
    document.getElementById('stats-todo').innerText = todo;
    document.getElementById('stats-progress').innerText = progress;
    document.getElementById('stats-completed').innerText = completed;
}

// Update column header badges matching filter conditions
function updateColumnBadges(filteredTasks) {
    const todoCount = filteredTasks.filter(t => t.status === 'todo').length;
    const progressCount = filteredTasks.filter(t => t.status === 'in_progress').length;
    const completedCount = filteredTasks.filter(t => t.status === 'completed').length;

    document.getElementById('badge-todo').innerText = todoCount;
    document.getElementById('badge-progress').innerText = progressCount;
    document.getElementById('badge-completed').innerText = completedCount;
}

// Drag & Drop event setup
function setupDragAndDrop() {
    const columns = document.querySelectorAll('.kanban-column');
    columns.forEach(col => {
        col.addEventListener('dragenter', (e) => {
            e.preventDefault();
            col.classList.add('drag-over');
        });

        col.addEventListener('dragleave', () => {
            col.classList.remove('drag-over');
        });
    });
}

function allowDrop(e) {
    e.preventDefault();
}

async function drop(e, targetStatus) {
    e.preventDefault();
    
    // Remove hover styles
    document.querySelectorAll('.kanban-column').forEach(c => c.classList.remove('drag-over'));
    
    const taskId = e.dataTransfer.getData('text/plain');
    if (!taskId) return;

    // Find local task
    const taskIndex = tasksState.findIndex(t => t.id == taskId);
    if (taskIndex === -1) return;

    const task = tasksState[taskIndex];
    if (task.status === targetStatus) return; // No change

    // Optimistic Update
    const originalStatus = task.status;
    task.status = targetStatus;
    renderWorkspace();
    updateAnalytics();

    try {
        const response = await fetch(`${API_BASE}/${taskId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: targetStatus })
        });

        if (!response.ok) throw new Error('Could not sync status with server');
        
        // Update task state with actual response
        const updatedTask = await response.json();
        tasksState[taskIndex] = updatedTask;
        showToast('Task updated successfully', 'success');
    } catch (error) {
        // Rollback
        task.status = originalStatus;
        renderWorkspace();
        updateAnalytics();
        showToast(error.message, 'error');
    }
}

// Filter triggers
function filterBy(status) {
    activeFilter = status;
    
    // Manage Sidebar active state
    document.querySelectorAll('.sidebar-menu .menu-item').forEach(btn => btn.classList.remove('active'));
    
    const statusMap = {
        all: 'btn-filter-all',
        todo: 'btn-filter-todo',
        in_progress: 'btn-filter-progress',
        completed: 'btn-filter-completed'
    };
    document.getElementById(statusMap[status]).classList.add('active');
    
    // Reset priority filter when changing status folders
    activePriorityFilter = null;
    
    renderWorkspace();
}

function filterPriority(priority) {
    // If clicking active, disable priority filter
    if (activePriorityFilter === priority) {
        activePriorityFilter = null;
        document.getElementById(`btn-priority-${priority}`).classList.remove('active');
    } else {
        // Clear old active priorities
        ['high', 'medium', 'low'].forEach(p => {
            document.getElementById(`btn-priority-${p}`).classList.remove('active');
        });
        
        activePriorityFilter = priority;
        document.getElementById(`btn-priority-${priority}`).classList.add('active');
    }
    
    renderWorkspace();
}

function handleSearch(val) {
    searchQuery = val;
    renderWorkspace();
}

function setViewMode(mode) {
    viewMode = mode;
    
    document.getElementById('btn-view-kanban').classList.remove('active');
    document.getElementById('btn-view-list').classList.remove('active');
    
    if (mode === 'kanban') {
        document.getElementById('btn-view-kanban').classList.add('active');
        document.getElementById('workspace-kanban-view').classList.remove('hidden');
        document.getElementById('workspace-list-view').classList.add('hidden');
    } else {
        document.getElementById('btn-view-list').classList.add('active');
        document.getElementById('workspace-kanban-view').classList.add('hidden');
        document.getElementById('workspace-list-view').classList.remove('hidden');
    }
    
    renderWorkspace();
}

// Modal handling
function openCreateModal(defaultStatus = 'todo') {
    modalHeading.innerText = 'Create New Task';
    formTaskId.value = '';
    taskForm.reset();
    
    formStatus.value = defaultStatus;
    formPriority.value = 'medium';
    
    taskModal.classList.add('active');
    formTitle.focus();
}

function openEditModal(taskId) {
    const task = tasksState.find(t => t.id == taskId);
    if (!task) return;

    modalHeading.innerText = 'Edit Task Details';
    formTaskId.value = task.id;
    formTitle.value = task.title;
    formDescription.value = task.description || '';
    formStatus.value = task.status;
    formPriority.value = task.priority;
    
    // Format ISO string back to datetime-local friendly format
    if (task.due_date) {
        const date = new Date(task.due_date);
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        const hh = String(date.getHours()).padStart(2, '0');
        const min = String(date.getMinutes()).padStart(2, '0');
        formDueDate.value = `${yyyy}-${mm}-${dd}T${hh}:${min}`;
    } else {
        formDueDate.value = '';
    }

    taskModal.classList.add('active');
    formTitle.focus();
}

function closeModal() {
    taskModal.classList.remove('active');
    taskForm.reset();
}

// Save Task operation (handles both Create and Update)
async function saveTask(e) {
    e.preventDefault();

    const taskId = formTaskId.value;
    const taskData = {
        title: formTitle.value,
        description: formDescription.value || null,
        status: formStatus.value,
        priority: formPriority.value,
        due_date: formDueDate.value ? new Date(formDueDate.value).toISOString() : null
    };

    try {
        let response;
        if (taskId) {
            // Update
            response = await fetch(`${API_BASE}/${taskId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(taskData)
            });
        } else {
            // Create
            response = await fetch(API_BASE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(taskData)
            });
        }

        if (!response.ok) {
            const errorDetails = await response.json();
            throw new Error(errorDetails.detail || 'Failed to save task');
        }

        const savedTask = await response.json();
        
        if (taskId) {
            const idx = tasksState.findIndex(t => t.id == taskId);
            tasksState[idx] = savedTask;
            showToast('Task updated successfully', 'success');
        } else {
            tasksState.unshift(savedTask); // Add to top
            showToast('Task created successfully', 'success');
        }

        closeModal();
        renderWorkspace();
        updateAnalytics();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// Delete Task operation
async function deleteTask(taskId) {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
        const response = await fetch(`${API_BASE}/${taskId}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Could not delete task from server');
        
        tasksState = tasksState.filter(t => t.id != taskId);
        showToast('Task deleted successfully', 'success');
        renderWorkspace();
        updateAnalytics();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// Dynamic Toast Notifications
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconClass = 'fa-solid fa-circle-info toast-icon-info';
    if (type === 'success') iconClass = 'fa-regular fa-circle-check toast-icon-success';
    if (type === 'error') iconClass = 'fa-solid fa-circle-exclamation toast-icon-error';

    toast.innerHTML = `
        <i class="${iconClass}"></i>
        <div class="toast-message">${escapeHTML(message)}</div>
    `;

    toastContainer.appendChild(toast);

    // Fade and remove toast after 4 seconds
    setTimeout(() => {
        toast.style.animation = 'toast-in 0.3s ease reverse forwards';
        setTimeout(() => {
            if (toastContainer.contains(toast)) {
                toastContainer.removeChild(toast);
            }
        }, 300);
    }, 4000);
}

// Utilities
function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}
