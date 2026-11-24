/* =========================================================
   1. ESTADO DA APLICAÇÃO E PERSISTÊNCIA (localStorage)
   =========================================================
   Guardamos tudo em duas chaves do localStorage:
   - "todo.tasks": array com todas as tarefas de todas as listas/views
   - "todo.lists": array com as listas criadas pelo usuário (além das fixas)
   - "todo.theme": "light" ou "dark"
   Cada tarefa tem o formato:
   { id, title, description, completed, view }
   onde "view" diz a qual lista/visão a tarefa pertence
   (ex: "today", "personal", "work", "list1" ou o id de uma lista nova).
*/

const STORAGE_KEYS = {
    tasks: "todo.tasks",
    lists: "todo.lists",
    theme: "todo.theme"
};

// Sem tarefas de exemplo: a aplicação começa totalmente vazia
const SEED_TASKS = [];

// Listas "fixas" que já existem na sidebar (não podem ser apagadas)
const FIXED_LISTS = [
    { id: "personal", name: "Personal", icon: "👤" },
    { id: "work", name: "Work", icon: "💼" },
    { id: "list1", name: "List 1", icon: "📝" }
];

function loadTasks() {
    const raw = localStorage.getItem(STORAGE_KEYS.tasks);
    if (!raw) return structuredClone(SEED_TASKS);
    return JSON.parse(raw);
}

function saveTasks() {
    localStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(state.tasks));
}

function loadCustomLists() {
    const raw = localStorage.getItem(STORAGE_KEYS.lists);
    if (!raw) return [];
    return JSON.parse(raw);
}

function saveCustomLists() {
    localStorage.setItem(STORAGE_KEYS.lists, JSON.stringify(state.customLists));
}

// Estado global em memória (tudo passa por aqui antes de ir pro localStorage)
const state = {
    tasks: loadTasks(),
    customLists: loadCustomLists(),
    currentView: "today",       // view selecionada no momento (today, personal, upcoming...)
    currentFilter: "all",       // all | completed | pending
    searchTerm: "",
    editingTaskId: null         // id da tarefa que está em modo de edição, ou null
};

/* =========================================================
   2. REFERÊNCIAS AOS ELEMENTOS DO DOM
   ========================================================= */
const el = {
    pageTitle: document.getElementById("pageTitle"),
    taskForm: document.getElementById("taskForm"),
    taskTitleInput: document.getElementById("taskTitleInput"),
    taskDescInput: document.getElementById("taskDescInput"),
    taskList: document.getElementById("taskList"),
    filters: document.getElementById("filters"),
    searchInput: document.getElementById("searchInput"),
    taskNavList: document.getElementById("taskNavList"),
    listNavList: document.getElementById("listNavList"),
    addListBtn: document.getElementById("addListBtn"),
    toggleMode: document.getElementById("toggleMode"),
    toggleModeIcon: document.getElementById("toggleModeIcon"),
    taskView: document.getElementById("taskView"),
    calendarView: document.getElementById("calendarView"),
    stickyWallView: document.getElementById("stickyWallView")
};

/* =========================================================
   3. HELPERS DE DADOS (contagem, filtragem, próximo id)
   ========================================================= */

// "upcoming" mostra todas as tarefas não concluídas de qualquer lista
function getTasksForView(view) {
    if (view === "upcoming") {
        return state.tasks.filter(t => !t.completed);
    }
    return state.tasks.filter(t => t.view === view);
}

function countTasksForView(view) {
    return getTasksForView(view).length;
}

function getNextTaskId() {
    return state.tasks.length ? Math.max(...state.tasks.map(t => t.id)) + 1 : 1;
}

// Aplica o filtro (all/completed/pending) + a busca por título
function applyFiltersAndSearch(tasks) {
    return tasks.filter(task => {
        const matchesFilter =
            state.currentFilter === "all" ||
            (state.currentFilter === "completed" && task.completed) ||
            (state.currentFilter === "pending" && !task.completed);

        const matchesSearch = task.title
            .toLowerCase()
            .includes(state.searchTerm.toLowerCase());

        return matchesFilter && matchesSearch;
    });
}

/* =========================================================
   4. RENDERIZAÇÃO
   ========================================================= */

// Atualiza os números dentro dos badges azuis da sidebar
function renderBadges() {
    document.querySelectorAll("[data-badge]").forEach(badge => {
        const view = badge.dataset.badge;
        badge.textContent = countTasksForView(view);
    });
}

// Desenha a lista de listas customizadas (criadas pelo botão "+ Add New List")
function renderCustomLists() {
    // remove as customizadas já desenhadas antes de redesenhar
    el.listNavList.querySelectorAll("[data-custom='true']").forEach(li => li.remove());

    for (const list of state.customLists) {
        const li = document.createElement("li");
        li.className = "nav-item";
        li.dataset.view = list.id;
        li.dataset.custom = "true";
        li.innerHTML = `
            <i class="bi bi-folder nav-icon"></i>
            <span class="nav-name">${list.name}</span>
            <span class="badge" data-badge="${list.id}">0</span>
        `;
        el.listNavList.appendChild(li);
    }
}

// Marca visualmente qual item da sidebar está ativo
function renderActiveNav() {
    document.querySelectorAll(".nav-item").forEach(item => {
        item.classList.toggle("active", item.dataset.view === state.currentView);
    });
}

// Marca visualmente qual pílula de filtro está ativa
function renderActiveFilter() {
    el.filters.querySelectorAll(".filter-pill").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.filter === state.currentFilter);
    });
}

// Monta o card de uma tarefa (modo normal ou modo edição)
function buildTaskCard(task) {
    const card = document.createElement("div");
    card.className = `task-card ${task.completed ? "completed" : "pending"}`;
    card.dataset.id = task.id;

    if (state.editingTaskId === task.id) {
        // ---- modo edição: input + textarea no lugar do texto ----
        card.innerHTML = `
            <form class="task-edit-form" data-action="save-edit">
                <input type="text" value="${task.title}" maxlength="120" required data-field="title">
                <textarea maxlength="255" data-field="description">${task.description}</textarea>
                <div style="display:flex; gap:0.4rem;">
                    <button type="submit" class="btn-add-task" style="padding:0.4rem 0.8rem; font-size:0.8rem;">Salvar</button>
                    <button type="button" class="filter-pill" data-action="cancel-edit">Cancelar</button>
                </div>
            </form>
        `;
        return card;
    }

    // ---- modo normal: título + descrição + ícones de ação ----
    card.innerHTML = `
        <div class="task-info">
            <div class="task-info-title">${task.title}</div>
            ${task.description ? `<div class="task-info-desc">${task.description}</div>` : ""}
        </div>
        <div class="task-actions">
            <button class="btn-check" data-action="toggle" title="Concluir/Reabrir"><i class="bi bi-check-lg"></i></button>
            <button class="btn-edit" data-action="edit" title="Editar"><i class="bi bi-pencil"></i></button>
            <button class="btn-delete" data-action="delete" title="Excluir"><i class="bi bi-trash"></i></button>
        </div>
    `;
    return card;
}

// Redesenha a lista de tarefas da view atual
function renderTaskList() {
    el.taskList.innerHTML = "";

    const tasksOfView = getTasksForView(state.currentView);
    const visibleTasks = applyFiltersAndSearch(tasksOfView);

    if (visibleTasks.length === 0) {
        el.taskList.innerHTML = `<p class="empty-message">Nenhuma tarefa encontrada por aqui.</p>`;
        return;
    }


    for (const task of visibleTasks) {
        el.taskList.appendChild(buildTaskCard(task));
    }
}

// Troca entre a tela de tarefas / calendário / mural, e ajusta o título
function renderMainView() {
    const isCalendar = state.currentView === "calendar";
    const isStickyWall = state.currentView === "sticky-wall";

    el.taskView.classList.toggle("hidden", isCalendar || isStickyWall);
    el.calendarView.classList.toggle("hidden", !isCalendar);
    el.stickyWallView.classList.toggle("hidden", !isStickyWall);

    el.pageTitle.textContent = getViewLabel(state.currentView);
}

// Descobre o nome "bonito" da view atual, pra exibir no título da página
function getViewLabel(view) {
    const fixedLabels = {
        upcoming: "Próximas",
        today: "Hoje",
        calendar: "Calendário",
        "sticky-wall": "Mural",
        personal: "Pessoal",
        work: "Trabalho",
        list1: "Lista 1"
    };

    if (fixedLabels[view]) return fixedLabels[view];

    const custom = state.customLists.find(l => l.id === view);
    return custom ? custom.name : view;
}

// Função "mestra": chama todas as renderizações, na ordem certa
function renderAll() {
    renderCustomLists();
    renderBadges();
    renderActiveNav();
    renderActiveFilter();
    renderMainView();
    renderTaskList();
}

/* =========================================================
   5. AÇÕES (CRUD de tarefas, navegação, filtros, busca)
   ========================================================= */

function addTask(title, description) {
    state.tasks.push({
        id: getNextTaskId(),
        title: title.trim(),
        description: description.trim(),
        completed: false,
        view: state.currentView
    });
    saveTasks();
    renderAll();
}

function toggleTaskCompleted(id) {
    const task = state.tasks.find(t => t.id === id);
    if (!task) return;
    task.completed = !task.completed;
    saveTasks();
    renderAll();
}

function deleteTask(id) {
    state.tasks = state.tasks.filter(t => t.id !== id);
    saveTasks();
    renderAll();
}

function startEditingTask(id) {
    state.editingTaskId = id;
    renderTaskList();
}

function cancelEditingTask() {
    state.editingTaskId = null;
    renderTaskList();
}

function saveEditedTask(id, title, description) {
    const task = state.tasks.find(t => t.id === id);
    if (!task) return;
    task.title = title.trim();
    task.description = description.trim();
    state.editingTaskId = null;
    saveTasks();
    renderAll();
}

function changeView(view) {
    state.currentView = view;
    state.editingTaskId = null;
    renderAll();
}

function changeFilter(filter) {
    state.currentFilter = filter;
    renderActiveFilter();
    renderTaskList();
}

function updateSearchTerm(term) {
    state.searchTerm = term;
    renderTaskList();
}

function addNewList() {
    const name = prompt("Nome da nova lista:");
    if (!name || !name.trim()) return;

    const id = "list-" + Date.now();
    state.customLists.push({ id, name: name.trim() });
    saveCustomLists();
    changeView(id);
}

/* =========================================================
   6. TEMA CLARO / ESCURO
   ========================================================= */

function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    el.toggleModeIcon.className = theme === "dark" ? "bi bi-brightness-high-fill" : "bi bi-moon-stars-fill";
    localStorage.setItem(STORAGE_KEYS.theme, theme);
}

function toggleTheme() {
    const current = localStorage.getItem(STORAGE_KEYS.theme) || "light";
    applyTheme(current === "light" ? "dark" : "light");
}

/* =========================================================
   7. EVENT LISTENERS
   ========================================================= */

// Envio do formulário de nova tarefa
el.taskForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const title = el.taskTitleInput.value;
    if (!title.trim()) return;

    addTask(title, el.taskDescInput.value);

    el.taskForm.reset();
    el.taskTitleInput.focus();
});

// Cliques dentro da lista de tarefas (concluir / editar / excluir / salvar edição / cancelar)
el.taskList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;

    const card = event.target.closest(".task-card");
    const id = Number(card.dataset.id);

    switch (button.dataset.action) {
        case "toggle":
            toggleTaskCompleted(id);
            break;
        case "edit":
            startEditingTask(id);
            break;
        case "delete":
            deleteTask(id);
            break;
        case "cancel-edit":
            cancelEditingTask();
            break;
    }
});

// Envio do formulário de edição inline (aparece dentro do próprio card)
el.taskList.addEventListener("submit", (event) => {
    const form = event.target.closest("[data-action='save-edit']");
    if (!form) return;

    event.preventDefault();

    const card = event.target.closest(".task-card");
    const id = Number(card.dataset.id);
    const title = form.querySelector("[data-field='title']").value;
    const description = form.querySelector("[data-field='description']").value;

    saveEditedTask(id, title, description);
});

// Clique nos itens da sidebar (TASKS e LISTS, incluindo listas customizadas)
function handleNavClick(event) {
    const item = event.target.closest(".nav-item");
    if (!item) return;
    changeView(item.dataset.view);
}
el.taskNavList.addEventListener("click", handleNavClick);
el.listNavList.addEventListener("click", handleNavClick);

// Botão de criar nova lista
el.addListBtn.addEventListener("click", addNewList);

// Filtros All / Completed / Pending
el.filters.addEventListener("click", (event) => {
    const button = event.target.closest(".filter-pill");
    if (!button) return;
    changeFilter(button.dataset.filter);
});

// Busca na sidebar
el.searchInput.addEventListener("input", (event) => {
    updateSearchTerm(event.target.value);
});

// Botão de tema claro/escuro
el.toggleMode.addEventListener("click", toggleTheme);

/* =========================================================
   8. INICIALIZAÇÃO
   ========================================================= */
applyTheme(localStorage.getItem(STORAGE_KEYS.theme) || "light");
renderAll();
