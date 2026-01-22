const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');
const { pool } = require('../config/db');
const { getPendingShops, approveShop, updateShopStatus, getAllShops } = require('../controllers/adminController');
const { addStock } = require('../controllers/adminStockController');

// GET /api/admin/shops/pending
router.get('/shops/pending', verifyToken, isAdmin, getPendingShops);

// PUT /api/admin/shops/:id/approve
router.put('/shops/:id/approve', verifyToken, isAdmin, approveShop);

// NEW ROUTES
// GET /api/admin/shops - List all
router.get('/shops', verifyToken, isAdmin, getAllShops);

// PUT /api/admin/shops/:id/status - Suspend/Activate
router.put('/shops/:id/status', verifyToken, isAdmin, updateShopStatus);

// POST /api/admin/shops/:id/stock - Add Stock
router.post('/shops/:id/stock', verifyToken, isAdmin, addStock);

module.exports = router;
