const express = require('express');
const router = express.Router();
const { createTransaction, getReceipt } = require('../controllers/transactionController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.post('/', authenticateToken, createTransaction);
router.get('/:txnId/receipt', authenticateToken, getReceipt);

module.exports = router;
