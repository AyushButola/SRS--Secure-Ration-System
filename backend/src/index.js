const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { createUserTable } = require('./config/db');
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/shops', require('./routes/shopRoutes'));
app.use('/api/beneficiaries', require('./routes/beneficiaryRoutes'));
app.use('/api/transactions', require('./routes/transactionRoutes'));

app.get('/', (req, res) => {
    res.send('SRS Backend is running');
});

const initializeSchema = require('./config/initSchema');

// DEBUG ENDPOINT
app.get('/api/test-code/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const { pool } = require('./config/db');
        const result = await pool.query('SELECT secret_code FROM beneficiary_secrets WHERE beneficiary_id = $1', [id]);
        if (result.rows.length === 0) return res.json({ msg: 'Not Found' });
        res.json(result.rows[0]);
    } catch (e) { res.json({ error: e.message }); }
});

// Initialize DB and Start Server
const startServer = async () => {
    await initializeSchema();
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
};

startServer();
