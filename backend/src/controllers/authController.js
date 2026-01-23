const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const pool = require('../config/db').pool;

const SECRET_KEY = process.env.JWT_SECRET || 'super_secret_key_123'; // In prod, use .env

exports.login = async (req, res) => {
    const { username, password, type } = req.body; // type: 'shop' or 'admin'

    if (!username || !password || !type) {
        return res.status(400).json({ error: 'Username, password, and type are required' });
    }

    try {
        let user = null;
        let id_field = '';

        if (type === 'shop') {
            const result = await pool.query('SELECT * FROM ration_shops WHERE shop_id = $1', [username]);
            user = result.rows[0];
            id_field = 'shop_id';
        } else if (type === 'admin') {
            const result = await pool.query('SELECT * FROM admins WHERE username = $1', [username]);
            user = result.rows[0];
            id_field = 'admin_id';
        } else if (type === 'beneficiary') {
            const result = await pool.query('SELECT * FROM beneficiaries WHERE beneficiary_id = $1', [username]);
            user = result.rows[0];
            id_field = 'beneficiary_id';
        } else {
            return res.status(400).json({ error: 'Invalid user type' });
        }

        if (!user) {
            return res.status(401).json({ error: 'Invalid Username or Password' });
        }

        // Verify password
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid Username or Password' });
        }

        // Generate Token
        const token = jwt.sign(
            { id: user[id_field], type: type },
            SECRET_KEY,
            { expiresIn: '24h' }
        );

        res.json({ token, type, id: user[id_field] });

    } catch (err) {
        console.error('Login Error:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.register = async (req, res) => {
    const { type, password, ...data } = req.body;

    if (!type || !password) {
        return res.status(400).json({ error: 'Type and password are required' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        if (type === 'beneficiary') {
            const { fullName, rationCardNumber, aadhaarLast4, mobileNumber } = data;

            if (!fullName || !rationCardNumber) {
                return res.status(400).json({ error: 'Name and Ration Card Number required' });
            }

            await pool.query(
                `INSERT INTO beneficiaries (beneficiary_id, name, aadhaar_last_4, mobile_number, password_hash)
                 VALUES ($1, $2, $3, $4, $5)`,
                [rationCardNumber, fullName, aadhaarLast4, mobileNumber, hashedPassword]
            );

            res.status(201).json({ message: 'Beneficiary registered successfully', id: rationCardNumber });

        } else if (type === 'shop') {
            const { shopName, shopId, ownerName, licenseNumber, mobileNumber } = data;

            if (!shopName || !shopId) {
                return res.status(400).json({ error: 'Shop Name and ID required' });
            }

            await pool.query(
                `INSERT INTO ration_shops (shop_id, shop_name, owner_name, license_number, mobile_number, password_hash, device_id)
                 VALUES ($1, $2, $3, $4, $5, $6, 'DEV_PENDING')`,
                [shopId, shopName, ownerName, licenseNumber, mobileNumber, hashedPassword]
            );

            res.status(201).json({ message: 'Shop registered successfully', id: shopId });

        } else {
            res.status(400).json({ error: 'Invalid user type' });
        }
    } catch (err) {
        console.error('Registration Error:', err);
        if (err.code === '23505') { // Unique violation
            return res.status(409).json({ error: 'ID already exists' });
        }
        res.status(500).json({ error: 'Registration failed' });
    }
};
