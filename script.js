const API_URL = 'http://localhost:5000/customers';

// 1. Function to Load Customers from the Server
async function loadCustomers() {
    try {
        const response = await fetch(API_URL);
        const customers = await response.json();
        const list = document.getElementById('customerList');
        
        // Ensure this matches your <tbody> ID in index.html
        list.innerHTML = customers.map(c => `
            <tr>
                <td><strong>${c.name}</strong></td>
                <td>${c.phone}</td>
                <td>
                    <button class="btn-edit" onclick="editCustomer(${c.id}, '${c.name}', '${c.phone}')">Edit</button>
                    <button class="btn-delete" onclick="deleteCustomer(${c.id})">Delete</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error("Failed to load customers:", error);
    }
} // <--- Added missing closing brace for try/catch

// 2. Function to Delete a Customer
async function deleteCustomer(id) {
    if (confirm("Are you sure you want to delete this customer?")) {
        try {
            await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
            loadCustomers(); // Refresh the table
        } catch (error) {
            console.error("Error deleting:", error);
        }
    }
}

// 3. Function to Edit a Customer
async function editCustomer(id, oldName, oldPhone) {
    const newName = prompt("Enter new name:", oldName);
    const newPhone = prompt("Enter new phone:", oldPhone);

    if (newName && newPhone) {
        try {
            await fetch(`${API_URL}/${id}`, {
                method: 'PUT',  
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName, phone: newPhone })
            });
            loadCustomers(); // Refresh the table
        } catch (error) {
            console.error("Error updating:", error);
        }
    }
}

// 4. Function to Send a New Customer to the Server
async function addCustomer() {
    const nameInput = document.getElementById('name');
    const phoneInput = document.getElementById('phone');

    const name = nameInput.value;
    const phone = phoneInput.value;

    if (!name || !phone) {
        return alert("Please fill both fields");
    }

    try {
        await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, phone })
        });

        // Clear inputs and refresh list
        nameInput.value = '';
        phoneInput.value = '';
        loadCustomers();
    } catch (error) {
        console.error("Error adding customer:", error);
        alert("Server is down or not responding.");
    }
}

// Load list automatically when page opens
loadCustomers();