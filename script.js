const STORAGE_KEY = "cloud_tasks_v1";
const THEME_KEY = "cloud_theme";

// DOM elements
const titleEl = document.getElementById("title");
const descEl = document.getElementById("description");
const dueEl = document.getElementById("dueDate");
const priorityEl = document.getElementById("priority");
const saveBtn = document.getElementById("saveBtn");
const cancelBtn = document.getElementById("cancelEditBtn");
const taskListEl = document.getElementById("taskList");
const searchEl = document.getElementById("search");
const filterEl = document.getElementById("filterPriority");
const clearAllBtn = document.getElementById("clearAllBtn");
const themeSwitch = document.getElementById("themeSwitch");
const githubLink = document.getElementById("githubLink");

let tasks = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
let editIndex = null;

/* ---------- THEME ----------- */
function applyTheme(theme) {
  if (theme === "light") {
    document.body.setAttribute("data-theme", "light");
    themeSwitch.checked = false;
  } else {
    document.body.removeAttribute("data-theme");
    themeSwitch.checked = true;
  }
}
function loadTheme() {
  const t = localStorage.getItem(THEME_KEY) || "dark";
  applyTheme(t);
}
themeSwitch.addEventListener("change", () => {
  const newTheme = themeSwitch.checked ? "dark" : "light";
  localStorage.setItem(THEME_KEY, newTheme);
  applyTheme(newTheme);
});
loadTheme();

/* ---------- UTIL ---------- */
function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2,8);
}

/* ---------- CRUD ---------- */
function saveTask() {
  const title = titleEl.value.trim();
  const description = descEl.value.trim();
  const dueDate = dueEl.value;
  const priority = priorityEl.value;

  if (!title || !dueDate) {
    alert("Please enter at least a Title and Due Date.");
    return;
  }

  const data = {
    id: uid(),
    title,
    description,
    dueDate,
    priority,
    status: "To Do",
    createdAt: new Date().toISOString()
  };

  if (editIndex !== null) {
    // keep id & createdAt when editing
    const original = tasks[editIndex];
    data.id = original.id;
    data.createdAt = original.createdAt;
    data.status = original.status;
    tasks[editIndex] = data;
    editIndex = null;
  } else {
    tasks.push(data);
  }

  saveToStorage();
  clearForm();
  renderTasks();
}

function editTask(index) {
  const t = tasks[index];
  titleEl.value = t.title;
  descEl.value = t.description;
  dueEl.value = t.dueDate;
  priorityEl.value = t.priority;
  editIndex = index;
  window.scrollTo({top:0, behavior:"smooth"});
}

function deleteTask(index) {
  if (!confirm("Delete this task permanently?")) return;
  tasks.splice(index, 1);
  saveToStorage();
  renderTasks();
}

function toggleStatus(index) {
  const seq = ["To Do", "In Progress", "Completed"];
  const cur = tasks[index].status;
  const nxt = seq[(seq.indexOf(cur) + 1) % seq.length];
  tasks[index].status = nxt;
  saveToStorage();
  renderTasks();
}

function clearForm() {
  titleEl.value = "";
  descEl.value = "";
  dueEl.value = "";
  priorityEl.value = "Medium";
  editIndex = null;
}

/* ---------- RENDER ---------- */
function formatDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString();
  } catch {
    return iso;
  }
}

function renderTasks() {
  const q = searchEl.value.trim().toLowerCase();
  const filterP = filterEl.value;

  // sort by due date then createdAt
  const data = tasks.slice().sort((a,b)=>{
    if (a.dueDate === b.dueDate) return new Date(a.createdAt) - new Date(b.createdAt);
    return new Date(a.dueDate) - new Date(b.dueDate);
  });

  taskListEl.innerHTML = "";

  if (data.length === 0) {
    const empty = document.createElement("div");
    empty.className = "glass";
    empty.style.padding = "24px";
    empty.innerHTML = "<strong>No tasks yet</strong><p class='meta'>Add a task using the form above.</p>";
    taskListEl.appendChild(empty);
    return;
  }

  data.filter(t => t.title.toLowerCase().includes(q))
      .filter(t => (filterP === "All") ? true : t.priority === filterP)
      .forEach((task, idx) => {
        const card = document.createElement("article");
        card.className = "task-card";

        // priority class
        let prClass = "priority-med";
        if (task.priority === "Low") prClass = "priority-low";
        if (task.priority === "High") prClass = "priority-high";

        card.innerHTML = `
          <div class="card-head">
            <div>
              <div class="title ${task.status === 'Completed' ? 'status-done' : ''}">${escapeHtml(task.title)}</div>
              <div class="meta">${escapeHtml(task.description || "")}</div>
            </div>

            <div class="badges">
              <div class="badge ${prClass}">${escapeHtml(task.priority)}</div>
              <div class="badge">${formatDate(task.dueDate)}</div>
            </div>
          </div>

          <div class="task-actions">
            <button class="neon-outline" onclick="toggleStatus(${tasks.indexOf(task)})">${escapeHtml(task.status)}</button>
            <button onclick="editTask(${tasks.indexOf(task)})">Edit</button>
            <button onclick="deleteTask(${tasks.indexOf(task)})">Delete</button>
          </div>
        `;

        taskListEl.appendChild(card);
      });
}

/* ---------- SAFETY: simple escaping ---------- */
function escapeHtml(s){
  if (!s) return "";
  return s.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
}

/* ---------- Events ---------- */
saveBtn.addEventListener("click", saveTask);
cancelBtn.addEventListener("click", (e)=>{
  e.preventDefault();
  clearForm();
});

searchEl.addEventListener("input", renderTasks);
filterEl.addEventListener("change", renderTasks);

clearAllBtn.addEventListener("click", ()=>{
  if (!confirm("Clear ALL tasks? This cannot be undone.")) return;
  tasks = [];
  saveToStorage();
  renderTasks();
});

/* expose actions to window for inline handlers */
window.editTask = editTask;
window.deleteTask = deleteTask;
window.toggleStatus = toggleStatus;

/* optional: fill github link (replace with your repo) */
githubLink.href = "https://github.com/YOUR-USERNAME/YOUR-REPO";

/* initialize */
renderTasks();
