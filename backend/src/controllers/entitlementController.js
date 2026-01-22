const { pool } = require('../config/db');

// Get entitlements by beneficiary ID
const getEntitlements = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(`
            SELECT * FROM entitlements 
            WHERE beneficiary_id = $1
        `, [id]);

        // Even if empty, return [], not 404
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching entitlements' });
    }
};

module.exports = { getEntitlements };
