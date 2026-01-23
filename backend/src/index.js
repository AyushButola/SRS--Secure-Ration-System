const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { initSchema, seedData } = require('./config/db');
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());

// Debug Middleware
app.use((req, res, next) => {
    console.log(`\n--- Incoming Request: ${req.method} ${req.url} ---`);
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/beneficiaries', require('./routes/beneficiaryRoutes'));
app.use('/api/transactions', require('./routes/transactionRoutes'));
app.use('/api/sync', require('./routes/syncRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/shops', require('./routes/shopRoutes'));
app.use('/api/otp', require('./routes/otpRoutes'));

app.get('/', (req, res) => {
    res.send('SRS Backend is running');
});

// Initialize DB and Start Server
const startServer = async () => {
    try {
        await initSchema();
        await seedData(); // Add this to seed the database
    } catch (err) {
        console.error("Schema Init Warning:", err.message);
    }
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
};

startServer();
