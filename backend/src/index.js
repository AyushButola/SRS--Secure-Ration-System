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

app.get('/', (req, res) => {
    res.send('SRS Backend is running');
});

const initializeSchema = require('./config/initSchema');

// Initialize DB and Start Server
const startServer = async () => {
    await initializeSchema();
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
};

startServer();
