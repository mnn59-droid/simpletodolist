const studyForm = document.getElementById('study-form');
const taskList = document.getElementById('task-list');
const message = document.getElementById('message');
const clearButton = document.getElementById('clear-button');
const refreshButton = document.getElementById('refresh-button');
const clearLogButton = document.getElementById('clear-log-button');
const apiLog = document.getElementById('api-log');
const totalTasks = document.getElementById('total-tasks');
const completedTasks = document.getElementById('completed-tasks');
const pendingTasks = document.getElementById('pending-tasks');
const totalMinutes = document.getElementById('total-minutes');
const serverStatus = document.getElementById('server-status');
const serverDetails = document.getElementById('server-details');    
const statusDot = document.getElementById('status-dot');
studyForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    const newTask = {
        subject: document.getElementById("subject").value.trim(),
        topic: document.getElementById("topic").value.trim(),
        studyDate: document.getElementById("studyDate").value,  
        duration: Number(document.getElementById("duration").value),
        priority : document.getElementById("priority").value
    };
    const result = await apiRequest(
        "/api/tasks",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(newTask)
        }
    );
    if(!result.ok){
        showMessage(result.data.message || "unable to create task.", "error");
        return;
    }
    studyForm.reset();
            showMessage(result.data.message, "success");

            await refreshDashboard();
        });
    clearButton.addEventListener("click", async function () {
        const result = await apiRequest("/api/tasks", {
            method: "DELETE"
        }); 
    if (!result.ok) {
        showMessage(result.data.message || "Unable to delete tasks.", "error");
        return;
    }
    showMessage(result.data.message, "success");
    await refreshDashboard();
    });

    refreshButton.addEventListener("click", refreshDashboard);
    clearLogButton.addEventListener("click", function () {
        apiLog.innerHTML = "";
    });
async function apiRequest(url, options= {}){
    const method = options.method || "GET";
    const startedAt =  performance.now();
    try{
            const response = await fetch(url, options);
            const data = await response.json();
            const duration = Math.round(performance.now() - startedAt);
            addLogEntry(method, url, response.status, duration);

            return {
                ok: response.ok,
                status: response.status,
                data 
            };
    }catch (error){
        const duration = Math.round(performance.now() - startedAt);
        addLogEntry(method, url, "OFFLINE", duration, false);// provides the information who has logged/ accessed your system
        return {
            ok: false,
            status: 0,
            data:{
                    message: "The Express backend is not reachable!"
            }
        };
    }
}

async function checkServerStatus(){
    const result = await apiRequest("/api/status");

    if(result.ok){
        serverStatus.textContent = "Server Offline";
        serverDetails.textContent = "Start the Express server with npm start.";
        statusDot.className = "status-dot offline";
        return false;
    }

    serverStatus.textContent = "Express Server Online";
    serverDetails.textContent = 
        `${result.data.server} on port ${result.data.port} .` + 
        new Date(result.data.timeStamp).toLocalTimeStamp();

    statusDot.className = "status-dot online";
    return true;

}

async function loadStatistics(){//number of requests and responses that goes between the client and server
    const result = await apiRequest("/api/statistics");

    if(!result.ok){
        return;
    }
    totalTasks.textContent = result.data.totalTasks;
    completedTasks.textContent = result.data.completedTasks;   
    pendingTasks.textContent = result.data.pendingTasks;
    totalMinutes.textContent = result.data.totalMinutes;
}
async function loadTasks(){
    const result = await apiRequest("/api/tasks");
    
    if(!result.ok){
        taskList.innerHTML = `<div class = "empty-state">
            Backend unavailable. Start the Server and Refresh!
            </div>
        `;
        return;
    }

    displayTasks(result.data);
}
function displayTasks(tasks){
    taskList.innerHTML = "";

    if(tasks.length === 0){
        taskList.innerHTML = 
        `<div class = "empty-state">    
        No tasks are currently stored on the server
        </div>
        `;
        return;
    }
    tasks.forEach(function (task){
        const article = document.createElement("article");
        article.className = task.completedTasks
                ? "task completed"
                :"task-card";
        article.innerHTML = `
            <h4>$escapeHtml(task.subject)</h4>
            <p><strong>Topic:</strong> ${escapeHtml(task.topic)}</p>
            <p><strong>Date:</strong> ${escapeHtml(task.studyDate)}</p>
            <p><strong>Duration:</strong> ${escapeHtml(task.duration)} minutes</p>
            <p><strong>Priority:</strong> ${escapeHtml(task.priority)}</p>
            <p><strong>Status:</strong> ${task.completed ? "Completed" : "Pending"}</p>
            <div class="task-actions">
                <button 
                    class = "task-button complete-button"
                    onclick = "toggleTaskCompletion('${task.id}')"
                >
                    ${task.completed ? "Mark as Pending" : "Mark as Completed"}
                </button>

                <button 
                    class = "task-button delete-button"
                    onclick = "deleteTask('${task.id}')"
                >
                    Delete
                </button>
            </div>
        `;

        taskList.appendChild(article);
    });
}
async function toggleTask(taskId){
    const result = await apiRequest(`/api/tasks/${taskId}`,
        {
            method: "PATCH"
        }
    );
    if (!result.ok){
        showMessage(result.data.message || "Unable to update task.", "error");
        return;
    }

    showMessage(result.data.message, "success");
    await refreshDashboard();
}
//asynchronous function enables to run requests and post processes at the same time and also it communicates with the 
//backend without disturbing the frontend 
async function deleteTask(taskId){
    const result = await apiRequest(
        `/api/tasks/${taskId}`,
        {
            method: "DELETE"
        }
    );
    if(!result.ok){
        showMessage(result.data.message || "Unable to delete task.", "error");
        return;
    }
    showMessage(result.data.message, "success");
    await refreshDashboard();

}
async function refreshDashboard(){
    const isOnline = await checkServerStatus();

    if(!isOnline){
        return;
    }

    await Promise.all([loadStatistics(), loadTasks()]);
}
function addLogEntry(method, url, status, duration, success){
    const entry = document.createElement("div");
    entry.className = 'log-entry';

    const time = new Date().toLocaleTimeString();

//provides information on how much time a user spent on a particular page and also the status of the request made to the server
    entry.innerHTML = `
        <span class = "log-time">${time}</span>
        <strong>${method}</strong>
        <span>${url}</span>
        <span class = "log-status ${success ? "success" : "error"}">
        ${status}. ${duration}ms
        </span>
        `;

        apiLog.prepend(entry);// this is the api that is handling the logs or the log entries-time spent on the web/page.
}
function showMessage(text, type){
    message.textContent =text;
    message.className = `message ${type}`;

    setTimeout(function (){
        message.textContent = "";
        message.className = "message";
    }, 3000);
}
function formatDate(dateText){
    const date = new Date(`${dateText}T00:00:00`);
    return date.toLocaleDateString();
}
function escapeHtml(text){ //escape values are &,>,<, and etc the escape HTML function replaces the 
// special characters with their corresponding HTML entities to prevent XSS attacks and
//  ensure that the text is displayed correctly in the browser.
    return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('""' , "&quot;")
    .replaceAll(" ' ", "&#039;");
}
refreshDashboard();

