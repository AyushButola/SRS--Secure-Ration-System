const { pool } = require('../config/db');

// Create new beneficiary
const createBeneficiary = async (req, res) => {
    const { beneficiary_id, name, category } = req.body;

    if (!beneficiary_id || !name || !category) {
        return res.status(400).json({ message: 'Please provide beneficiary_id, name, and category' });
    }

    try {
        const check = await pool.query('SELECT * FROM beneficiaries WHERE beneficiary_id = $1', [beneficiary_id]);
        if (check.rows.length > 0) {
            return res.status(400).json({ message: 'Beneficiary ID already exists' });
        }

        const result = await pool.query(
            'INSERT INTO beneficiaries (beneficiary_id, name, category, active) VALUES ($1, $2, $3, TRUE) RETURNING *',
            [beneficiary_id, name, category]
        );

        res.status(201).json({ message: 'Beneficiary registered', beneficiary: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error creating beneficiary' });
    }
};

// Get beneficiary details
const getBeneficiary = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query('SELECT * FROM beneficiaries WHERE beneficiary_id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Beneficiary not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching beneficiary' });
    }
};

module.exports = { createBeneficiary, getBeneficiary };
