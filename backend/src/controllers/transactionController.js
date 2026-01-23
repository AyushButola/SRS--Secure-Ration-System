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
            // Rollback if simple over-consumption check fails (optional strictness)
            // throw new Error('Exceeds entitlement limit');
            console.warn(`[Txn] Over-consumption detected for ${beneficiary_id} - ${commodity}`);
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

module.exports = {
    createTransaction
};
