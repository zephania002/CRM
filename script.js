const API_URL = 'http://localhost:5000/customers';
let myChart = null;

// Tab Switcher Logic
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

// Live Search
function filterCustomers() {
    const term = document.getElementById('searchInput').value.toLowerCase();
    const rows = document.querySelectorAll('#customerList tr');
    rows.forEach(row => {
        const name = row.querySelector('strong').innerText.toLowerCase();
        row.style.display = name.includes(term) ? '' : 'none';
    });
}

// Data Handling
async function loadCustomers() {
    try {
        const res = await fetch(API_URL);
        const data = await res.json();
        
        document.getElementById('totalCount').innerText = data.length;
        const list = document.getElementById('customerList');
        
        list.innerHTML = data.map(c => `
            <tr>
                <td><strong>${c.name}</strong><br><small style="color:var(--text-muted)">${new Date(c.created_at).toLocaleDateString()}</small></td>
                <td>${c.phone}</td>
                <td><span class="badge badge-${c.status.toLowerCase()}">${c.status}</span></td>
                <td>
                    <button class="btn-primary" style="padding: 5px 10px; font-size: 0.7rem;" onclick="deleteCustomer(${c.id})">Delete</button>
                </td>
            </tr>
        `).join('');
        
        updateChart(data);
    } catch (e) { console.error(e); }
}

// Analytics Chart
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

// Add Customer
async function addCustomer() {
    const name = document.getElementById('name').value;
    const phone = document.getElementById('phone').value;
    const status = document.getElementById('status').value;

    if(!name || !phone) return alert("Fill all fields");

    await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, status })
    });

    document.getElementById('name').value = '';
    document.getElementById('phone').value = '';
    loadCustomers();
}

loadCustomers();