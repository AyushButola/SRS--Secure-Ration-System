const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');

// POST /api/shops/register
router.post('/register', async (req, res) => {
    const { shop_id, shop_name, location, device_id, email, password } = req.body;

    if (!shop_id || !shop_name || !location || !email || !password) {
        return res.status(400).json({ message: 'Please provide all fields including email and password' });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Check if Shop ID or Email exists
        const checkShop = await client.query('SELECT * FROM ration_shops WHERE shop_id = $1', [shop_id]);
        if (checkShop.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Shop ID already registered' });
        }

        const checkUser = await client.query('SELECT * FROM users WHERE email = $1', [email]);
        if (checkUser.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Email already registered' });
        }

        // 2. Create User
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUserRes = await client.query(`
            INSERT INTO users (username, email, password, role)
            VALUES ($1, $2, $3, 'SHOP_OWNER')
            RETURNING user_id
        `, [`shop_${shop_id}`, email, hashedPassword]);

        const userId = newUserRes.rows[0].user_id;

        // 3. Create Shop (Linked to User)
        // Ensure user_id column exists. We ran migration script previously.
        const newShopRes = await client.query(`
            INSERT INTO ration_shops (shop_id, shop_name, location, device_id, status, user_id)
            VALUES ($1, $2, $3, $4, 'PENDING', $5)
            RETURNING *
        `, [shop_id, shop_name, location, device_id, userId]);

        await client.query('COMMIT');

        res.status(201).json({
            message: 'Shop registration submitted. Please wait for Admin approval.',
            shop: newShopRes.rows[0]
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error);
        res.status(500).json({ message: 'Server error registering shop' });
    } finally {
        client.release();
    }
});

module.exports = router;
