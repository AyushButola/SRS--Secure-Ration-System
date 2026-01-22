const express = require('express');
const router = express.Router();
const { getShopStock } = require('../controllers/shopController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.get('/:id/stock', authenticateToken, getShopStock);

module.exports = router;
