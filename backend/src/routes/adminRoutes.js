const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');
const { pool } = require('../config/db');

// GET /api/admin/shops/pending
router.get('/shops/pending', verifyToken, isAdmin, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT shop_id, shop_name, location, device_id, status, created_at 
            FROM ration_shops 
            WHERE status = 'PENDING'
        `);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error retrieving pending shops' });
    }
});

// PUT /api/admin/shops/:id/approve
router.put('/shops/:id/approve', verifyToken, isAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(`
            UPDATE ration_shops 
            SET status = 'APPROVED' 
            WHERE shop_id = $1 
            RETURNING *
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Shop not found' });
        }

        res.json({ message: 'Shop approved successfully', shop: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error approving shop' });
    }
});

module.exports = router;
