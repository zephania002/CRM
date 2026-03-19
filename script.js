const API_URL = 'http://localhost:5000/customers';
let myChart = null; 

// 1. Load and Display
async function loadCustomers() {
    try {
        const response = await fetch(API_URL);
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error("Server Error Details:", errorData);
            return; 
        }

        const customers = await response.json();
        
        if (!Array.isArray(customers)) {
            console.error("Expected an array, but received:", customers);
            return;
        }

        // Update stats counter
        const totalCountEl = document.getElementById('totalCount');
        if(totalCountEl) totalCountEl.innerText = customers.length;

        // Render Table
        const list = document.getElementById('customerList');
        list.innerHTML = customers.map(c => {
            const statusText = c.status || 'New';
            
            // Modern badge colors matching the analytics
            const badgeClass = 
                statusText === 'Closed' ? 'badge-success' : 
                statusText === 'Contacted' ? 'badge-info' : 
                statusText === 'Interested' ? 'badge-warning' : 'badge-new';
            
            const dateAdded = c.created_at 
                ? new Date(c.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) 
                : 'N/A';

            const cleanPhone = c.phone ? c.phone.replace(/\D/g, '') : '';

            return `
                <tr>
                    <td>
                        <strong>${c.name}</strong><br>
                        <small style="color: #64748b; font-size: 0.75rem;">Added: ${dateAdded}</small>
                    </td>
                    <td>${c.phone}</td>
                    <td><span class="badge ${badgeClass}">${statusText}</span></td>
                    <td>
                        <div class="action-buttons">
                            <a href="https://wa.me/${cleanPhone}" target="_blank" class="btn-whatsapp">WhatsApp</a>
                            <button class="btn-edit" onclick="editCustomer(${c.id}, '${c.name}', '${c.phone}', '${statusText}')">Edit</button>
                            <button class="btn-delete" onclick="deleteCustomer(${c.id})">Delete</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        updateChart(customers);

    } catch (error) {
        console.error("Load failed:", error);
    }
}

// 2. Analytics Chart Logic
function updateChart(customers) {
    const ctx = document.getElementById('statusChart');
    if (!ctx) return;

    const statusCounts = { 'New': 0, 'Contacted': 0, 'Interested': 0, 'Closed': 0 };

    customers.forEach(c => {
        const status = c.status || 'New';
        if (statusCounts.hasOwnProperty(status)) {
            statusCounts[status]++;
        }
    });

    if (myChart) { myChart.destroy(); }

    myChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(statusCounts),
            datasets: [{
                data: Object.values(statusCounts),
                backgroundColor: ['#e2e8f0', '#bae6fd', '#fef08a', '#bbf7d0'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 10 } } }
            }
        }
    });
}

// 3. Add Customer (Updated to use the Status Dropdown)
async function addCustomer() {
    const nameInput = document.getElementById('name');
    const phoneInput = document.getElementById('phone');
    const statusInput = document.getElementById('status'); // Dropdown from HTML

    if (!nameInput.value || !phoneInput.value) return alert("Please fill name and phone");

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                name: nameInput.value, 
                phone: phoneInput.value,
                status: statusInput.value // Captures selected status
            })
        });

        if (response.ok) {
            nameInput.value = '';
            phoneInput.value = '';
            statusInput.value = 'New'; // Reset to default
            loadCustomers();
        }
    } catch (error) {
        console.error("Add failed:", error);
    }
}

// 4. Search/Filter Logic
function filterCustomers() {
    const term = document.getElementById('searchInput').value.toLowerCase();
    const rows = document.querySelectorAll('#customerList tr');

    rows.forEach(row => {
        const name = row.querySelector('strong').innerText.toLowerCase();
        row.style.display = name.includes(term) ? '' : 'none';
    });
}

// 5. Delete Customer
async function deleteCustomer(id) {
    if (confirm("Delete this customer?")) {
        try {
            await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
            loadCustomers();
        } catch (error) {
            console.error("Delete failed:", error);
        }
    }
}

// 6. Edit Customer
async function editCustomer(id, oldName, oldPhone, oldStatus) {
    const newName = prompt("New Name:", oldName);
    const newPhone = prompt("New Phone:", oldPhone);
    const newStatus = prompt("Status (New, Contacted, Interested, Closed):", oldStatus);

    if (newName && newPhone && newStatus) {
        try {
            await fetch(`${API_URL}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName, phone: newPhone, status: newStatus })
            });
            loadCustomers();
        } catch (error) {
            console.error("Update failed:", error);
        }
    }
}

// Initial Load
loadCustomers();