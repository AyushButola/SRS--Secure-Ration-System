const Transaction = require('../models/Transaction');

// POST /api/transactions
const db = require('../config/db');

// POST /api/transactions
const createTransaction = async (req, res) => {
    const { beneficiary_id, shop_id, ration_period, commodity, quantity } = req.body;

    // Basic Validation
    if (!beneficiary_id || !shop_id || !ration_period || !commodity || !quantity) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const client = await db.pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Create Transaction
        // Assuming Transaction.create uses db.query internally, but since we need a transaction, 
        // we might need to write raw SQL or pass the client. 
        // For simplicity/consistency with this codebase which seems to use raw SQL often:

        const txnId = require('crypto').randomUUID();
        await client.query(
            `INSERT INTO transactions (txn_id, beneficiary_id, shop_id, ration_period, commodity, quantity, synced, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [txnId, beneficiary_id, shop_id, ration_period, commodity, quantity, true, 'VALID']
        );

        // 2. Update Entitlements (Deduct Quantity)
        // Check if enough balance exists could be added here, but for now we enforce deduction.
        const updateRes = await client.query(
            `UPDATE entitlements 
             SET consumed_quantity = consumed_quantity + $1, 
                 last_updated = CURRENT_TIMESTAMP
             WHERE beneficiary_id = $2 AND ration_period = $3 AND commodity = $4
             RETURNING consumed_quantity, max_quantity`,
            [quantity, beneficiary_id, ration_period, commodity]
        );

        if (updateRes.rows.length === 0) {
            throw new Error(`Entitlement not found for ${commodity}`);
        }

        const { consumed_quantity, max_quantity } = updateRes.rows[0];
        if (consumed_quantity > max_quantity) {
            console.warn(`[Txn] Over-consumption detected for ${beneficiary_id} - ${commodity}`);

            // PENALTY: Deduct 5 points for invalid claim
            await client.query(
                `UPDATE beneficiaries SET trust_score = GREATEST(0, trust_score - 5) WHERE beneficiary_id = $1`,
                [beneficiary_id]
            );
        } else {
            // REWARD: Add 1 point for valid transaction (Max 100)
            await client.query(
                `UPDATE beneficiaries SET trust_score = LEAST(100, trust_score + 1) WHERE beneficiary_id = $1`,
                [beneficiary_id]
            );
            // REWARD SHOP: Add 1 point
            await client.query(
                `UPDATE ration_shops SET trust_score = LEAST(100, trust_score + 1) WHERE shop_id = $1`,
                [shop_id]
            );
        }

        await client.query('COMMIT');

        // Return the created transaction and new balance
        res.status(201).json({
            message: 'Transaction successful',
            txn_id: txnId,
            new_balance: max_quantity - consumed_quantity
        });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Transaction Error:', err);
        res.status(500).json({ error: 'Failed to process transaction', details: err.message });
    } finally {
        client.release();
    }
};

// GET /api/transactions/:txnId/receipt
const getReceipt = async (req, res) => {
    const { txnId } = req.params;

    try {
        const query = `
            SELECT 
                t.txn_id, t.commodity, t.quantity, t.timestamp, t.hash,
                b.name as beneficiary_name, b.beneficiary_id,
                s.shop_name, s.shop_id, s.location
            FROM transactions t
            JOIN beneficiaries b ON t.beneficiary_id = b.beneficiary_id
            JOIN ration_shops s ON t.shop_id = s.shop_id
            WHERE t.txn_id = $1
        `;

        const result = await db.query(query, [txnId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Receipt not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Receipt Error:', err);
        res.status(500).json({ error: 'Failed to fetch receipt' });
    }
};

// GET /api/transactions/shop/history
const getShopTransactions = async (req, res) => {
    // Assuming shop_id comes from the authenticated user token (req.user.id)
    // or passed as a query param if admin functionality. 
    // Here we use req.user.id from authenticateToken middleware for security.
    const shopId = req.user.id;

    try {
        const query = `
            SELECT 
                t.txn_id, t.beneficiary_id, t.commodity, t.quantity, t.timestamp, t.status,
                b.name as beneficiary_name
            FROM transactions t
            LEFT JOIN beneficiaries b ON t.beneficiary_id = b.beneficiary_id
            WHERE t.shop_id = $1
            ORDER BY t.timestamp DESC
            LIMIT 50
        `;

        const result = await db.query(query, [shopId]);
        res.json(result.rows);
    } catch (err) {
        console.error('History Error:', err);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
};

module.exports = {
    createTransaction,
    getReceipt,
    getShopTransactions
};
