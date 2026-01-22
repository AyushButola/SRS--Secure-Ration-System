const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');

// POST /api/shops/register
router.post('/register', async (req, res) => {
    const { shop_id, shop_name, location, device_id } = req.body;

    if (!shop_id || !shop_name || !location) {
        return res.status(400).json({ message: 'Please provide shop_id, shop_name, and location' });
    }

    try {
        // Check if exists
        const check = await pool.query('SELECT * FROM ration_shops WHERE shop_id = $1', [shop_id]);
        if (check.rows.length > 0) {
            return res.status(400).json({ message: 'Shop ID already registered' });
        }

        const result = await pool.query(`
            INSERT INTO ration_shops (shop_id, shop_name, location, device_id, status)
            VALUES ($1, $2, $3, $4, 'PENDING')
            RETURNING *
        `, [shop_id, shop_name, location, device_id]);

        res.status(201).json({
            message: 'Shop registration submitted. Waiting for Admin approval.',
            shop: result.rows[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error registering shop' });
    }
});

module.exports = router;
