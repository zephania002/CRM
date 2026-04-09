const API_URL = 'http://localhost:5000/customers';
let myChart = null;

// --- TAB & VIEW TOGGLE LOGIC ---

function switchTab(tab) {
    const dash = document.getElementById('dashboard-view');
    const sett = document.getElementById('settings-view');
    const search = document.getElementById('search-wrapper');
    const title = document.getElementById('view-title');
    const links = document.querySelectorAll('.sidebar nav a');

    links.forEach(l => l.classList.remove('active'));

    if (tab === 'settings') {
        dash.style.display = 'none';
        sett.style.display = 'block';
        search.style.opacity = '0';
        title.innerText = 'Settings';
        document.getElementById('link-settings').classList.add('active');
    } else {
        dash.style.display = 'block';
        sett.style.display = 'none';
        search.style.opacity = '1';
        title.innerText = 'Customer Dashboard';
        document.getElementById('link-dashboard').classList.add('active');
        loadCustomers();
    }
}

// Switches between Kanban and Table within the Dashboard
function toggleDashboardView(view) {
    const kanban = document.getElementById('kanban-wrapper');
    const table = document.getElementById('table-wrapper');
    if (view === 'kanban') {
        kanban.style.display = 'flex';
        table.style.display = 'none';
    } else {
        kanban.style.display = 'none';
        table.style.display = 'block';
    }
}

// --- DRAG AND DROP LOGIC ---

function allowDrop(ev) {
    ev.preventDefault();
}

function drag(ev) {
    ev.dataTransfer.setData("customerId", ev.target.id);
}

async function drop(ev) {
    ev.preventDefault();
    const cardId = ev.dataTransfer.getData("customerId");
    const targetColId = ev.currentTarget.id; // e.g., "col-new"
    const newStatus = targetColId.split('-')[1]; // "new"
    
    // Capitalize for DB consistency
    const formattedStatus = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
    const dbId = cardId.replace('card-', '');

    // Move card visually for instant feedback
    const card = document.getElementById(cardId);
    ev.currentTarget.querySelector('.kanban-cards').appendChild(card);

    // Update Database
    try {
        await fetch(`${API_URL}/${dbId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                status: formattedStatus,
                last_contacted: new Date().toISOString()
            })
        });
        loadCustomers(); // Refresh charts and totals
    } catch (e) {
        console.error("Failed to move card", e);
    }
}

// --- DATA HANDLING & AUTOMATION ---

async function loadCustomers() {
    try {
        const res = await fetch(API_URL);
        const data = await res.json();
        
        // Update Totals
        document.getElementById('totalCount').innerText = data.length;
        updatePipelineValue(data);
        
        // Render Views
        renderTable(data);
        renderKanban(data);
        updateChart(data);
    } catch (e) { console.error(e); }
}

function updatePipelineValue(data) {
    const total = data.reduce((sum, c) => sum + parseFloat(c.lead_value || 0), 0);
    document.getElementById('pipelineValue').innerText = `KES ${total.toLocaleString()}`;
}

function renderTable(data) {
    const list = document.getElementById('customerList');
    list.innerHTML = data.map(c => `
        <tr>
            <td><strong>${c.name}</strong><br><small style="color:var(--text-muted)">${new Date(c.created_at).toLocaleDateString()}</small></td>
            <td>${c.phone}</td>
            <td>KES ${parseFloat(c.lead_value || 0).toLocaleString()}</td>
            <td><span class="badge badge-${c.status.toLowerCase()}">${c.status}</span></td>
            <td>
                <button class="btn-primary" style="padding: 5px 10px; font-size: 0.7rem; width: auto;" onclick="deleteCustomer(${c.id})">Delete</button>
            </td>
        </tr>
    `).join('');
}

function renderKanban(data) {
    const columns = { New: '', Contacted: '', Interested: '', Closed: '' };
    const counts = { New: 0, Contacted: 0, Interested: 0, Closed: 0 };
    const now = new Date();

    data.forEach(c => {
        if (counts[c.status] !== undefined) counts[c.status]++;

        // Automation Check: Stagnant if 'New' for > 48 hours
        const createdDate = new Date(c.created_at);
        const hoursDiff = (now - createdDate) / (1000 * 60 * 60);
        const isStagnant = c.status === 'New' && hoursDiff > 48;

        columns[c.status] += `
            <div class="kanban-card ${isStagnant ? 'stagnant-lead' : ''}" id="card-${c.id}" draggable="true" ondragstart="drag(event)">
                <strong>${c.name}</strong>
                <small>${c.phone}</small>
                <span class="card-value">KES ${parseFloat(c.lead_value || 0).toLocaleString()}</span>
                ${isStagnant ? '<span class="warning-tag">⚠️ NEEDS FOLLOW-UP</span>' : ''}
            </div>
        `;
    });

    // Push HTML to columns and update counts
    for (let status in columns) {
        document.getElementById(`list-${status.toLowerCase()}`).innerHTML = columns[status];
        document.getElementById(`count-${status.toLowerCase()}`).innerText = counts[status];
    }
}

// --- ANALYTICS & ADDING ---

function updateChart(data) {
    const ctx = document.getElementById('statusChart').getContext('2d');
    const counts = { New: 0, Contacted: 0, Interested: 0, Closed: 0 };
    data.forEach(c => { if(counts[c.status] !== undefined) counts[c.status]++; });

    if (myChart) myChart.destroy();
    myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(counts),
            datasets: [{
                data: Object.values(counts),
                backgroundColor: ['#e2e8f0', '#bae6fd', '#fef08a', '#bbf7d0'],
                borderWidth: 0
            }]
        },
        options: { cutout: '75%', plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, usePointStyle: true } } } }
    });
}

async function addCustomer() {
    const name = document.getElementById('name').value;
    const phone = document.getElementById('phone').value;
    const lead_value = document.getElementById('leadValue').value;
    const status = document.getElementById('status').value;

    if(!name || !phone) return alert("Fill all fields");

    await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, lead_value, status })
    });

    document.getElementById('name').value = '';
    document.getElementById('phone').value = '';
    document.getElementById('leadValue').value = '';
    loadCustomers();
}

async function deleteCustomer(id) {
    if(!confirm("Are you sure?")) return;
    await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    loadCustomers();
}

loadCustomers();