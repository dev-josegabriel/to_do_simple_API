const API_URL = "http://localhost:8080";

const loading = document.getElementById("loading");
const content = document.getElementById("content");
const tasksBody = document.getElementById("tasks");
const userIdInput = document.getElementById("userId");
const descriptionInput = document.getElementById("description");
const errorAlert = document.getElementById("errorAlert");

function showLoading() {
    loading.classList.remove("d-none");
    content.classList.add("d-none");
}

function hideLoading() {
    loading.classList.add("d-none");
    content.classList.remove("d-none");
}

function showError(message) {
    errorAlert.textContent = message;
    errorAlert.classList.remove("d-none");
}

function hideError() {
    errorAlert.classList.add("d-none");
}

function renderTasks(tasks) {
    tasksBody.innerHTML = "";

    for (const task of tasks) {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${task.id}</td>
            <td>
                <input type="text" class="form-control form-control-sm task-description" value="${task.description}" maxlength="255">
            </td>
            <td class="text-end">
                <button class="btn btn-sm btn-primary save-task" data-id="${task.id}">Salvar</button>
                <button class="btn btn-sm btn-danger delete-task" data-id="${task.id}">Excluir</button>
            </td>
        `;
        tasksBody.appendChild(row);
    }
}

async function loadTasks() {
    hideError();
    showLoading();

    const userId = userIdInput.value;

    try {
        const response = await fetch(`${API_URL}/task/user/${userId}`);

        if (!response.ok) {
            throw new Error("Não foi possível carregar as tarefas do usuário.");
        }

        const tasks = await response.json();
        renderTasks(tasks);
    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
}

async function addTask() {
    hideError();

    const description = descriptionInput.value.trim();
    const userId = userIdInput.value;

    if (!description) {
        showError("Informe a descrição da tarefa.");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/task`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ description, user: { id: userId } })
        });

        if (!response.ok) {
            throw new Error("Não foi possível criar a tarefa.");
        }

        descriptionInput.value = "";
        await loadTasks();
    } catch (error) {
        showError(error.message);
    }
}

async function updateTask(id, description) {
    hideError();

    try {
        const response = await fetch(`${API_URL}/task/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ description, user: { id: userIdInput.value } })
        });

        if (!response.ok) {
            throw new Error("Não foi possível atualizar a tarefa.");
        }
    } catch (error) {
        showError(error.message);
    }
}

async function deleteTask(id) {
    hideError();

    try {
        const response = await fetch(`${API_URL}/task/${id}`, { method: "DELETE" });

        if (!response.ok) {
            throw new Error("Não foi possível excluir a tarefa.");
        }

        await loadTasks();
    } catch (error) {
        showError(error.message);
    }
}

document.getElementById("loadUser").addEventListener("click", loadTasks);
document.getElementById("addTask").addEventListener("click", addTask);

tasksBody.addEventListener("click", (event) => {
    const id = event.target.dataset.id;
    if (!id) return;

    if (event.target.classList.contains("save-task")) {
        const row = event.target.closest("tr");
        const description = row.querySelector(".task-description").value.trim();
        updateTask(id, description);
    }

    if (event.target.classList.contains("delete-task")) {
        deleteTask(id);
    }
});

loadTasks();
