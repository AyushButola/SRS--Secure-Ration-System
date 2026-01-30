const db = require('../config/db');

// GET /api/admin/stats
const getStats = async (req, res) => {
    try {
        const beneficiaryCount = await db.query('SELECT COUNT(*) FROM beneficiaries');
        const shopCount = await db.query('SELECT COUNT(*) FROM ration_shops');
        const txnCount = await db.query('SELECT COUNT(*) FROM transactions');
        const conflictCount = await db.query('SELECT COUNT(*) FROM conflicts WHERE resolved = FALSE');

        res.json({
            beneficiaries: parseInt(beneficiaryCount.rows[0].count),
            shops: parseInt(shopCount.rows[0].count),
            transactions: parseInt(txnCount.rows[0].count),
            pending_conflicts: parseInt(conflictCount.rows[0].count)
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
};

// GET /api/admin/ledger
const getLedger = async (req, res) => {
    try {
        // Fetch latest 50 transactions ordered by time
        const result = await db.query(`
            SELECT t.*, b.name as beneficiary_name, s.shop_name 
            FROM transactions t
            LEFT JOIN beneficiaries b ON t.beneficiary_id = b.beneficiary_id
            LEFT JOIN ration_shops s ON t.shop_id = s.shop_id
            ORDER BY t.timestamp DESC 
            LIMIT 50
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch ledger' });
    }
};

// GET /api/admin/conflicts
const getConflicts = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT c.*, t.hash as txn_hash, b.name as beneficiary_name
            FROM conflicts c
            LEFT JOIN transactions t ON c.txn_id = t.txn_id
            LEFT JOIN beneficiaries b ON c.beneficiary_id = b.beneficiary_id
            ORDER BY c.detected_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch conflicts' });
    }
};

// GET /api/admin/beneficiaries
const getBeneficiaries = async (req, res) => {
    try {
        const result = await db.query('SELECT beneficiary_id, name, mobile_number, active FROM beneficiaries ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch beneficiaries' });
    }
};

// GET /api/admin/search-beneficiary/:id
const searchBeneficiary = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('SELECT beneficiary_id, name, mobile_number, active FROM beneficiaries WHERE beneficiary_id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Beneficiary not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to search beneficiary' });
    }
};

module.exports = {
    getStats,
    getLedger,
    getConflicts,
    getBeneficiaries,
    searchBeneficiary
};
