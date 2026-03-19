const API_URL = 'http://localhost:5000/customers';
let myChart = null; // Store chart instance to prevent duplicates

// 1. Load and Display
async function loadCustomers() {
    try {
        const response = await fetch(API_URL);
        
        // 1. Check if the server actually sent data
        if (!response.ok) {
            const errorData = await response.json();
            console.error("Server Error Details:", errorData);
            alert("Server Error: " + (errorData.error || "Unknown error"));
            return; // Stop here if there is a server error
        }

        const customers = await response.json();
        
        // 2. Extra safety: Check if 'customers' is an array
        if (!Array.isArray(customers)) {
            console.error("Expected an array, but received:", customers);
            return;
        }

        // Update stats
        const totalCountEl = document.getElementById('totalCount');
        if(totalCountEl) totalCountEl.innerText = customers.length;

        // Render Table
        const list = document.getElementById('customerList');
        list.innerHTML = customers.map(c => {
            const statusText = c.status || 'New';
            const badgeClass = statusText.toLowerCase() === 'closed' ? 'badge-success' : 
                               statusText.toLowerCase() === 'contacted' ? 'badge-info' : 'badge-new';
            
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
                        <a href="https://wa.me/${cleanPhone}" target="_blank" class="btn-whatsapp">WhatsApp</a>
                        <button class="btn-edit" onclick="editCustomer(${c.id}, '${c.name}', '${c.phone}', '${statusText}')">Edit</button>
                        <button class="btn-delete" onclick="deleteCustomer(${c.id})">Delete</button>
                    </td>
                </tr>
            `;
        }).join('');

        updateChart(customers);

    } catch (error) {
        console.error("Network or Syntax Error:", error);
    }
}

// 2. Analytics Chart Logic
function updateChart(customers) {
    const ctx = document.getElementById('statusChart');
    if (!ctx) return;

    // Count customers per status
    const statusCounts = {
        'New': 0,
        'Contacted': 0,
        'Interested': 0,
        'Closed': 0
    };

    customers.forEach(c => {
        const status = c.status || 'New';
        if (statusCounts.hasOwnProperty(status)) {
            statusCounts[status]++;
        } else {
            statusCounts['New']++;
        }
    });

    // If chart exists, destroy it before creating a new one
    if (myChart) {
        myChart.destroy();
    }

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
                legend: {
                    position: 'bottom',
                    labels: { boxWidth: 12, font: { size: 10 } }
                }
            }
        }
    });
}

// 3. Add Customer
async function addCustomer() {
    const nameInput = document.getElementById('name');
    const phoneInput = document.getElementById('phone');

    if (!nameInput.value || !phoneInput.value) return alert("Fill both fields");

    try {
        await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                name: nameInput.value, 
                phone: phoneInput.value 
            })
        });

        nameInput.value = '';
        phoneInput.value = '';
        loadCustomers();
    } catch (error) {
        console.error("Error adding customer:", error);
    }
}

// 4. Delete Customer
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

// 5. Edit Customer
async function editCustomer(id, oldName, oldPhone, oldStatus) {
    const newName = prompt("New Name:", oldName);
    const newPhone = prompt("New Phone:", oldPhone);
    const newStatus = prompt("Status (New, Contacted, Interested, Closed):", oldStatus);

    if (newName && newPhone && newStatus) {
        try {
            await fetch(`${API_URL}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    name: newName, 
                    phone: newPhone, 
                    status: newStatus 
                })
            });
            loadCustomers();
        } catch (error) {
            console.error("Update failed:", error);
        }
    }
}

// Initial Load
loadCustomers();