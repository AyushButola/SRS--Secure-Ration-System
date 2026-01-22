const express = require('express');
const router = express.Router();
const { createTransaction } = require('../controllers/transactionController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.post('/', authenticateToken, createTransaction);

module.exports = router;
