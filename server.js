const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'crm_db',
  password: 'MasenoCbmrc4',
  port: 5432,
});

// --- ROUTES ---

// 1. GET all customers
app.get('/customers', async (req, res) => {
  try {
    const results = await pool.query('SELECT * FROM customers ORDER BY id DESC');
    res.json(results.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. ADD a new customer
app.post('/customers', async (req, res) => {
  try {
    const { name, phone } = req.body;
    const results = await pool.query(
      'INSERT INTO customers (name, phone) VALUES ($1, $2) RETURNING *', 
      [name, phone]
    );
    res.json(results.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. DELETE a customer
app.delete('/customers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM customers WHERE id = $1', [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.json({ message: 'Customer deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } 
});

// 4. UPDATE a customer
app.put('/customers/:id', async (req, res) => {
  try { 
    const { id } = req.params;
    const { name, phone } = req.body;
    const result = await pool.query(
      'UPDATE customers SET name = $1, phone = $2 WHERE id = $3 RETURNING *', 
      [name, phone, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.json({ message: 'Customer updated', customer: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } 
});

// --- START SERVER ---
// Keep this at the very bottom
app.listen(5000, () => console.log('✅ Server running on port 5000'));