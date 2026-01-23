const db = require('../config/db');

// GET /api/beneficiaries/:id
const getBeneficiary = async (req, res) => {
    const { id } = req.params;
    try {
        // 1. Fetch Basic Info
        const beneficiaryRes = await db.query(
            'SELECT * FROM beneficiaries WHERE beneficiary_id = $1',
            [id]
        );

        if (beneficiaryRes.rows.length === 0) {
            return res.status(404).json({ error: 'Beneficiary not found' });
        }

        // 2. Fetch Entitlements for Current Period (Mocking '2026-01' for now)
        // In real app, calculate current month-year dynamically
        const currentPeriod = '2026-01';

        const entitlementRes = await db.query(
            'SELECT * FROM entitlements WHERE beneficiary_id = $1 AND ration_period = $2',
            [id, currentPeriod]
        );

        res.json({
            beneficiary: beneficiaryRes.rows[0],
            entitlements: entitlementRes.rows
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

// GET /api/beneficiaries/:id/entitlements
const getBeneficiaryEntitlements = async (req, res) => {
    const { id } = req.params;
    try {
        // Fetch Entitlements for Current Period (Mocking '2026-01' for now)
        const currentPeriod = '2026-01';

        const entitlementRes = await db.query(
            'SELECT * FROM entitlements WHERE beneficiary_id = $1 AND ration_period = $2',
            [id, currentPeriod]
        );

        res.json(entitlementRes.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

// GET /api/beneficiaries/:id/transactions
const getBeneficiaryTransactions = async (req, res) => {
    const { id } = req.params;
    try {
        const transactionRes = await db.query(
            'SELECT * FROM transactions WHERE beneficiary_id = $1 ORDER BY timestamp DESC LIMIT 50',
            [id]
        );

        res.json(transactionRes.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = {
    getBeneficiary,
    getBeneficiaryEntitlements,
    getBeneficiaryTransactions
};
