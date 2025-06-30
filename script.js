const API_URL = "http://localhost:5000/api"; // Change to your deployed backend URL if needed

// Submit Emergency Form
document.getElementById("emergencyForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const data = {
        reporter: document.getElementById("reporterName").value,
        type: document.getElementById("emergencyType").value,
        description: document.getElementById("description").value,
        priority: document.getElementById("priority").value,
        location: document.getElementById("location").value,
    };

    try {
        const res = await fetch(`${API_URL}/emergencies`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        if (!res.ok) throw new Error("Submission failed");

        alert("✅ Emergency reported successfully!");
        document.getElementById("emergencyForm").reset();
        loadEmergencies();
        loadStats();
    } catch (error) {
        console.error("Error:", error);
        alert("❌ Failed to report emergency.");
    }
});

// Fetch and display emergencies
async function loadEmergencies() {
    const response = await fetch(`${API_URL}/emergencies`);
    const emergencies = await response.json();

    const activeDiv = document.getElementById("emergencies");
    const resolvedDiv = document.getElementById("resolvedEmergencies");

    activeDiv.innerHTML = "";
    resolvedDiv.innerHTML = "";

    emergencies.forEach(em => {
        const card = document.createElement("div");
        card.className = "list-group-item";
        card.innerHTML = `
            <div class="d-flex justify-content-between align-items-start">
                <div>
                    <h5>${em.type} (${em.priority})</h5>
                    <p>${em.description}</p>
                    <small><b>Reported by:</b> ${em.reporter} | <b>Location:</b> ${em.location}</small>
                </div>
                ${em.status === "pending" ? `
                <button class="btn btn-sm btn-success" onclick="resolveEmergency('${em._id}')">Mark Resolved</button>` : ""}
            </div>
        `;

        if (em.status === "pending") {
            activeDiv.appendChild(card);
        } else {
            resolvedDiv.appendChild(card);
        }
    });
}

// Mark an emergency as resolved
async function resolveEmergency(id) {
    try {
        const res = await fetch(`${API_URL}/emergencies/${id}`, {
            method: "PATCH",
        });
        if (!res.ok) throw new Error("Update failed");

        loadEmergencies();
        loadStats();
    } catch (error) {
        console.error("Error:", error);
        alert("❌ Failed to mark as resolved.");
    }
}

// Load statistics
async function loadStats() {
    const response = await fetch(`${API_URL}/stats`);
    const stats = await response.json();

    document.getElementById("activeCount").textContent = stats.active || 0;
    document.getElementById("resolvedCount").textContent = stats.resolved || 0;
    document.getElementById("pendingCount").textContent = stats.pending || 0;
}

// Filter emergencies by priority
function filterEmergencies(priority) {
    const items = document.querySelectorAll("#emergencies .list-group-item");

    items.forEach(item => {
        const content = item.querySelector("h5").textContent;
        if (priority === "all" || content.includes(priority)) {
            item.style.display = "block";
        } else {
            item.style.display = "none";
        }
    });
}

// Live Clock
function updateClock() {
    const now = new Date();
    document.getElementById("clock").textContent = now.toLocaleTimeString();
}
setInterval(updateClock, 1000);
updateClock();

// Theme toggle
document.getElementById("themeToggle").addEventListener("click", () => {
    document.body.classList.toggle("bg-dark");
    document.body.classList.toggle("text-white");
    document.querySelector(".moon-icon").classList.toggle("d-none");
    document.querySelector(".sun-icon").classList.toggle("d-none");
});

// Initial load
loadEmergencies();
loadStats();
