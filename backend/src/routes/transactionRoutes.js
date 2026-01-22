const express = require('express');
const router = express.Router();
const { processTransaction } = require('../controllers/transactionController');
const { verifyToken } = require('../middleware/authMiddleware');

// Protected: Only Shop Owners (or Admin) can process transactions
router.post('/process', verifyToken, processTransaction);

const { syncTransactions } = require('../controllers/transactionController');
router.post('/sync', verifyToken, syncTransactions);

module.exports = router;
