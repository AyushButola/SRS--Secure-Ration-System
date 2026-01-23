const db = require('../config/db');
const Transaction = require('../models/Transaction');

// POST /api/sync
const syncTransactions = async (req, res) => {
    const { device_id, transactions } = req.body; // transactions is an Array

    if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
        return res.status(400).json({ error: 'Invalid payload: No transactions provided' });
    }

    const results = {
        total: transactions.length,
        synced: 0,
        failed: 0,
        errors: []
    };

    const client = await db.pool.connect();

    try {
        await client.query('BEGIN'); // Start Batch

        for (const offlineTxn of transactions) {
            // 1. Conflict Check: Duplicate?
            // We assume the offlineTxn has a temporary ID or we use the UUID generated offline.
            // If the offline app generates UUIDs, we should check if they exist.
            const dupCheck = await client.query(
                'SELECT 1 FROM transactions WHERE txn_id = $1',
                [offlineTxn.txn_id]
            );

            if (dupCheck.rows.length > 0) {
                results.failed++;
                results.errors.push({ id: offlineTxn.txn_id, error: 'Duplicate Transaction' });
                continue;
            }

            // 2. Conflict Check: Double Spending / Entitlement Limit
            // Check if beneficiary has enough quota REMAINING
            const entCheck = await client.query(
                `SELECT * FROM entitlements 
                 WHERE beneficiary_id = $1 AND ration_period = $2 AND commodity = $3`,
                [offlineTxn.beneficiary_id, offlineTxn.ration_period, offlineTxn.commodity]
            );

            if (entCheck.rows.length === 0) {
                results.failed++;
                results.errors.push({ id: offlineTxn.txn_id, error: 'No Entitlement Found' });
                continue;
            }

            const entitlement = entCheck.rows[0];
            const newConsumed = entitlement.consumed_quantity + offlineTxn.quantity;

            if (newConsumed > entitlement.max_quantity) {
                // Fraud Attempt or Error
                results.failed++;
                results.errors.push({ id: offlineTxn.txn_id, error: 'Quota Exceeded (Double Spend Attempt)' });

                // 2a. Fetch Last Hash for Audit Trail (Optional, but good for ordering)
                const ledgerRes = await client.query(`SELECT last_hash FROM ledger_state WHERE scope_id = 'GLOBAL'`);
                const prevHash = ledgerRes.rows[0]?.last_hash || 'GENESIS_HASH';

                // 2b. Insert FLAGGED Transaction (So Conflict FK works)
                await client.query(
                    `INSERT INTO transactions 
                    (txn_id, beneficiary_id, shop_id, ration_period, commodity, quantity, timestamp, prev_hash, hash, status, synced, offline_otp, offline_otp_verified)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, TRUE, $11, $12)`,
                    [
                        offlineTxn.txn_id,
                        offlineTxn.beneficiary_id,
                        offlineTxn.shop_id,
                        offlineTxn.ration_period,
                        offlineTxn.commodity,
                        offlineTxn.quantity,
                        offlineTxn.timestamp,
                        prevHash,
                        'INVALID_HASH_FLAGGED', // Placeholder for flagged txn
                        'FLAGGED',
                        offlineTxn.otp || null,
                        offlineTxn.otp_verified ? true : false
                    ]
                );

                // 2c. Log Conflict
                await client.query(
                    `INSERT INTO conflicts (conflict_id, txn_id, beneficiary_id, conflict_type, resolved)
                     VALUES ($1, $2, $3, $4, FALSE)`,
                    [`CONF_${offlineTxn.txn_id}`, offlineTxn.txn_id, offlineTxn.beneficiary_id, 'QUOTA_EXCEEDED']
                );
                continue;
            }

            // 3. Process & Re-Chain (Use Transaction Model logic but within this transaction)
            // We use the Transaction.create logic manually here to keep it in the SAME DB transaction block
            // OR we assume Transaction.create can accept a client.
            // Let's manually do the Insert to be safe with the Batch transaction.

            // 3a. Get Global Ledger State (Locked)
            const ledgerRes = await client.query(
                `SELECT last_hash FROM ledger_state WHERE scope_id = 'GLOBAL' FOR UPDATE`
            );
            const prevHash = ledgerRes.rows[0].last_hash;

            // 3b. Generate Server-Side Hash
            // We use the SAME data, but the `prev_hash` is now the SERVER's prev_hash, which integrates it into the valid chain.
            // Note: This changes the hash from what was calculated offline. This is acceptable for "Eventual Consistency"
            // where the Server is the Authority.
            const { generateHash } = require('../utils/hash'); // Lazy load

            // Re-construct data for hashing
            // IMPORTANT: The timestamp might be different if we use 'now', best to use the OFFLINE timestamp to respect when it happened.

            const dataToHash = {
                txn_id: offlineTxn.txn_id,
                beneficiary_id: offlineTxn.beneficiary_id,
                shop_id: offlineTxn.shop_id,
                ration_period: offlineTxn.ration_period,
                commodity: offlineTxn.commodity,
                quantity: offlineTxn.quantity,
                timestamp: offlineTxn.timestamp // Trusting offline timestamp? Or use server time? usually server or trusted time.
            };

            const newHash = generateHash(dataToHash, prevHash);

            // 3c. Insert
            await client.query(
                `INSERT INTO transactions 
                (txn_id, beneficiary_id, shop_id, ration_period, commodity, quantity, timestamp, prev_hash, hash, status, synced, offline_otp, offline_otp_verified)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, TRUE, $11, $12)`,
                [
                    offlineTxn.txn_id,
                    offlineTxn.beneficiary_id,
                    offlineTxn.shop_id,
                    offlineTxn.ration_period,
                    offlineTxn.commodity,
                    offlineTxn.quantity,
                    offlineTxn.timestamp,
                    prevHash,
                    newHash, // Server Hash
                    'VALID',
                    offlineTxn.otp || null,
                    offlineTxn.otp_verified ? true : false
                ]
            );

            // 3d. Update Entitlement
            await client.query(
                `UPDATE entitlements SET consumed_quantity = consumed_quantity + $1, offline_txn_used = offline_txn_used + 1, last_updated = NOW()
                 WHERE entitlement_id = $2`,
                [offlineTxn.quantity, entitlement.entitlement_id]
            );

            // 3e. Update Ledger State
            await client.query(
                `UPDATE ledger_state SET last_hash = $1, last_txn_id = $2, updated_at = NOW() WHERE scope_id = 'GLOBAL'`,
                [newHash, offlineTxn.txn_id]
            );

            // 3f. Deduct Stock (Late Deduction)
            const { deductStock } = require('../utils/stock');
            await deductStock(client, offlineTxn.shop_id, offlineTxn.commodity, offlineTxn.quantity);

            results.synced++;
        }

        // 4. Log Sync Event
        await client.query(
            `INSERT INTO sync_logs (sync_id, device_id, synced_count, failed_count) VALUES ($1, $2, $3, $4)`,
            [`SYNC_${Date.now()}`, device_id, results.synced, results.failed]
        );

        await client.query('COMMIT');
        res.json({ message: 'Sync complete', results });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Sync Error:', error);
        res.status(500).json({ error: 'Sync failed', details: error.message });
    } finally {
        client.release();
    }
};

module.exports = { syncTransactions };
