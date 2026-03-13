const API_URL = 'http://localhost:5000/customers';

// 1. Load and Display
async function loadCustomers() {
    try {
        const response = await fetch(API_URL);
        const customers = await response.json();
        
        // Update the stats counter
        const totalCountEl = document.getElementById('totalCount');
        if(totalCountEl) totalCountEl.innerText = customers.length;

        const list = document.getElementById('customerList');
        
        list.innerHTML = customers.map(c => {
            // Determine badge color based on status
            const statusText = c.status || 'New';
            const badgeClass = statusText.toLowerCase() === 'closed' ? 'badge-success' : 
                               statusText.toLowerCase() === 'contacted' ? 'badge-info' : 'badge-new';
            
            // Clean phone number for WhatsApp (removes spaces/dashes)
            const cleanPhone = c.phone.replace(/\D/g, '');

            return `
                <tr>
                    <td><strong>${c.name}</strong></td>
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
    } catch (error) {
        console.error("Load failed:", error);
    }
}

// 2. Add Customer
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

// 3. Delete Customer
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

// 4. Edit Customer (Updated to include Status)
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