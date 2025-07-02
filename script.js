const API_URL = 'http://localhost:5000/api';

let emergencies = [];
let currentFilter = 'all';

const form = document.getElementById('emergencyForm');
const emergenciesDiv = document.getElementById('emergencies');
const resolvedEmergenciesDiv = document.getElementById('resolvedEmergencies');
const themeToggle = document.getElementById('themeToggle');
const clockDiv = document.getElementById('clock');
const activeCountEl = document.getElementById('activeCount');
const resolvedCountEl = document.getElementById('resolvedCount');
const pendingCountEl = document.getElementById('pendingCount');

// Notification Function
function showNotification(message, type) {
    alert(message); // Simple alert, can be replaced with a more sophisticated toast/notification library
}

// Theme Toggle
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    const moonIcon = document.querySelector('.moon-icon');
    const sunIcon = document.querySelector('.sun-icon');
    moonIcon.classList.toggle('d-none');
    sunIcon.classList.toggle('d-none');
});

// Clock Update
function updateClock() {
    const now = new Date();
    const options = {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    };
    clockDiv.textContent = now.toLocaleTimeString(undefined, options);
}
setInterval(updateClock, 1000);
updateClock();

// Emergency Icon and Priority Badge Helpers
function getEmergencyIcon(type) {
    const icons = {
        'Medical': '<i class="fas fa-ambulance text-info"></i>',
        'Fire': '<i class="fas fa-fire text-danger"></i>',
        'Crime': '<i class="fas fa-user-shield text-primary"></i>',
        'Natural Disaster': '<i class="fas fa-tornado text-warning"></i>',
        'Other': '<i class="fas fa-exclamation-triangle text-secondary"></i>'
    };
    return icons[type] || '<i class="fas fa-question-circle"></i>';
}

function getPriorityBadge(priority) {
    const badges = {
        'High': 'danger',
        'Medium': 'warning',
        'Low': 'info'
    };
    return badges[priority] || 'secondary';
}

// Render Active Emergencies
function renderActiveEmergencies(emergenciesToRender) {
    emergenciesDiv.innerHTML = '';
    if (emergenciesToRender.length === 0) {
        emergenciesDiv.innerHTML = `<p class="col-12 text-center">No active emergencies matching the filter.</p>`;
        return;
    }

    emergenciesToRender.forEach(emergency => {
        const emergencyItem = document.createElement('div');
        emergencyItem.classList.add('col');
        emergencyItem.innerHTML = `
            <div class="card emergency-item h-100">
                <div class="card-body d-flex flex-column">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <h5 class="card-title mb-0">${getEmergencyIcon(emergency.type)} ${emergency.type}</h5>
                        <span class="badge bg-${getPriorityBadge(emergency.priority)}">${emergency.priority}</span>
                    </div>
                    <p class="card-text flex-grow-1">${emergency.description}</p>
                    <p class="card-text mb-1"><small><strong>Location:</strong> ${emergency.location}</small></p>
                    <p class="card-text mb-2"><small><strong>Reported by:</strong> ${emergency.reporter}</small></p>
                    <div class="d-flex justify-content-between align-items-center mt-auto">
                        <small class="text-muted">Reported: ${new Date(emergency.createdAt).toLocaleString()}</small>
                        <button class="btn btn-success btn-sm" onclick="resolveEmergency('${emergency._id}')">
                            <i class="fas fa-check"></i> Resolve
                        </button>
                    </div>
                </div>
            </div>
        `;
        emergenciesDiv.appendChild(emergencyItem);
    });
}

// Render Resolved Emergencies
function renderResolvedEmergencies(emergenciesToRender) {
    resolvedEmergenciesDiv.innerHTML = '';
    if (emergenciesToRender.length === 0) {
        resolvedEmergenciesDiv.innerHTML = '<p class="col-12 text-center">No recently resolved emergencies.</p>';
        return;
    }

    emergenciesToRender.forEach(emergency => {
        const emergencyItem = document.createElement('div');
        emergencyItem.classList.add('col');
        emergencyItem.innerHTML = `
            <div class="card emergency-item h-100 bg-light">
                <div class="card-body">
                     <h5 class="card-title mb-2">${getEmergencyIcon(emergency.type)} ${emergency.type}</h5>
                     <p class="card-text">${emergency.description}</p>
                     <p class="card-text mb-1"><small><strong>Location:</strong> ${emergency.location}</small></p>
                     <small class="text-muted">Resolved: ${new Date(emergency.updatedAt).toLocaleString()}</small>
                </div>
            </div>
        `;
        resolvedEmergenciesDiv.appendChild(emergencyItem);
    });
}

// Render Emergencies (applies filters and calls specific render functions)
function renderEmergencies(emergenciesList) {
    const resolvedEmergencies = emergenciesList.filter(e => e.status === 'resolved');
    let activeEmergencies = emergenciesList.filter(e => e.status === 'pending');

    if (currentFilter !== 'all') {
        activeEmergencies = activeEmergencies.filter(e => e.priority === currentFilter);
    }

    renderActiveEmergencies(activeEmergencies);
    renderResolvedEmergencies(resolvedEmergencies);
}

// Resolve an Emergency
async function resolveEmergency(id) {
    if (confirm('Are you sure you want to mark this emergency as resolved?')) {
        try {
            const response = await fetch(`${API_URL}/emergencies/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'resolved' })
            });

            if (!response.ok) {
                throw new Error(await response.text());
            }

            showNotification('Emergency marked as resolved!', 'success');
            await fetchEmergencies(); // Re-fetch all data to get the updated list
            await fetchStats();
        } catch (error) {
            showNotification(`Error: ${error.message}`, 'danger');
        }
    }
}

// Fetch all emergencies from the API
async function fetchEmergencies() {
    try {
        const response = await fetch(`${API_URL}/emergencies`);
        if (!response.ok) {
            throw new Error("Failed to fetch emergencies");
        }
        emergencies = await response.json();
        renderEmergencies(emergencies);
    } catch (error) {
        showNotification(error.message, 'danger');
    }
}

// Form Submission Handler
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const emergency = {
        reporter: document.getElementById('reporterName').value.trim(),
        type: document.getElementById('emergencyType').value,
        description: document.getElementById('description').value.trim(),
        priority: document.getElementById('priority').value,
        location: document.getElementById('location').value.trim()
    };

    if (!emergency.reporter || !emergency.type || !emergency.priority || !emergency.description || !emergency.location) {
        showNotification('Please fill in all required fields.', 'warning');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/emergencies`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(emergency)
        });

        if (!response.ok) {
            throw new Error(await response.text());
        }

        form.reset();
        showNotification('Emergency reported successfully!', 'success');
        await fetchEmergencies();
        await fetchStats();
    } catch (error) {
        showNotification(`Error reporting emergency: ${error.message}`, 'danger');
    }
});

// Client-side filtering function
function filterEmergencies(priority) {
    currentFilter = priority;
    renderEmergencies(emergencies); // Re-render with the existing data and new filter
}

// Fetch statistics from the API
async function fetchStats() {
    try {
        const response = await fetch(`${API_URL}/stats`);
        if (!response.ok) {
            throw new Error("Failed to fetch statistics");
        }
        const stats = await response.json();
        activeCountEl.textContent = stats.active || 0;
        resolvedCountEl.textContent = stats.resolved || 0;
        pendingCountEl.textContent = stats.pending || 0;
    } catch (error) {
        showNotification(error.message, 'danger');
    }
}

// Initial Data Fetch and Setup
async function initialize() {
    await fetchEmergencies();
    await fetchStats();
    setInterval(fetchStats, 5 * 60 * 1000); // Update stats every 5 minutes
}

initialize();
