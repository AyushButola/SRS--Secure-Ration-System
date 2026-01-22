const express = require('express');
const router = express.Router();
const { syncTransactions } = require('../controllers/syncController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.post('/', authenticateToken, syncTransactions);

module.exports = router;
