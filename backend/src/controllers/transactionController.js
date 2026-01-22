const { pool } = require('../config/db');
const { generateHash } = require('../utils/cryptoUtils');
const { getLastHash, updateLedgerState } = require('../services/ledgerService');
const crypto = require('crypto');

// POST /api/transactions/process
const processTransaction = async (req, res) => {
    const { shop_id, beneficiary_id, commodity, quantity } = req.body;

    if (!shop_id || !beneficiary_id || !commodity || !quantity) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Quota Validation
        const period = new Date().toISOString().slice(0, 7); // '2026-01'
        const entitlementRes = await client.query(`
            SELECT * FROM entitlements 
            WHERE beneficiary_id = $1 AND commodity = $2 AND ration_period = $3
        `, [beneficiary_id, commodity, period]);

        if (entitlementRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'No entitlement found for this commodity in current period' });
        }

        const ent = entitlementRes.rows[0];
        if (ent.consumed_quantity + quantity > ent.max_quantity) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                message: 'Quota exceeded',
                remaining: ent.max_quantity - ent.consumed_quantity
            });
        }

        // 2. Ledger & Hashing
        const prevHash = await getLastHash(shop_id);
        const txnId = crypto.randomUUID();
        const timestamp = new Date().toISOString();

        const txnData = {
            shop_id,
            beneficiary_id,
            commodity,
            quantity,
            created_at: timestamp
        };

        const newHash = generateHash(prevHash, txnData);

        // 3. Insert Transaction
        await client.query(`
            INSERT INTO transactions 
            (txn_id, beneficiary_id, shop_id, ration_period, commodity, quantity, timestamp, prev_hash, hash, status, synced)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'VALID', TRUE)
        `, [txnId, beneficiary_id, shop_id, period, commodity, quantity, timestamp, prevHash, newHash]);

        // 4. Update Entitlement
        await client.query(`
            UPDATE entitlements 
            SET consumed_quantity = consumed_quantity + $1, last_updated = NOW()
            WHERE entitlement_id = $2
        `, [quantity, ent.entitlement_id]);

        // 5. Update Ledger State
        await updateLedgerState(client, shop_id, newHash);

        await client.query('COMMIT');

        res.status(201).json({
            message: 'Transaction processed successfully',
            txn_id: txnId,
            hash: newHash,
            remaining: ent.max_quantity - (ent.consumed_quantity + quantity)
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Transaction Error:', error);
        res.status(500).json({ message: 'Server error processing transaction' });
    } finally {
        client.release();
    }
};

const { verifyHash } = require('../utils/cryptoUtils');

// POST /api/transactions/sync
const syncTransactions = async (req, res) => {
    const { shop_id, transactions } = req.body; // transactions is Array

    if (!shop_id || !Array.isArray(transactions) || transactions.length === 0) {
        return res.status(400).json({ message: 'Invalid sync payload' });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Get Server's Last Hash
        let serverLastHash = await getLastHash(shop_id);
        const processed = [];
        const failed = [];

        for (const txn of transactions) {
            // txn: { txn_id, beneficiary_id, commodity, quantity, timestamp, hash, prev_hash }

            // 1. Check Duplicate
            const dupCheck = await client.query('SELECT txn_id FROM transactions WHERE txn_id = $1', [txn.txn_id]);
            if (dupCheck.rows.length > 0) {
                // Already synced, skip or mark as success
                continue;
            }

            // 2. Validate Chain Integrity
            // The txn.prev_hash MUST match our serverLastHash
            if (txn.prev_hash !== serverLastHash) {
                console.warn(`Hash Mismatch for Shop ${shop_id}. Server: ${serverLastHash}, Txn Prev: ${txn.prev_hash}`);
                failed.push({ txn_id: txn.txn_id, reason: 'HASH_MISMATCH' });

                // Stop processing further transactions in this chain as they will all be invalid
                break;
            }

            // 3. Validate Hash Calculation
            const txnData = {
                shop_id,
                beneficiary_id: txn.beneficiary_id,
                commodity: txn.commodity,
                quantity: txn.quantity,
                created_at: txn.timestamp
            };

            const isValid = verifyHash(txn.prev_hash, txn.hash, txnData);
            if (!isValid) {
                failed.push({ txn_id: txn.txn_id, reason: 'INVALID_SIGNATURE' });
                break;
            }

            // 4. Insert Packet
            await client.query(`
                INSERT INTO transactions 
                (txn_id, beneficiary_id, shop_id, ration_period, commodity, quantity, timestamp, prev_hash, hash, status, synced)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'VALID', TRUE)
            `, [txn.txn_id, txn.beneficiary_id, shop_id, '2026-01', txn.commodity, txn.quantity, txn.timestamp, txn.prev_hash, txn.hash]);

            // 5. Update State
            serverLastHash = txn.hash;
            await updateLedgerState(client, shop_id, serverLastHash);

            // 6. Update Entitlements (Naive implementation: Assume we deduct even if late? Yes)
            // Ideally we check quota too, but for sync we might accept it and flag over-draw later.
            await client.query(`
                UPDATE entitlements 
                SET consumed_quantity = consumed_quantity + $1
                WHERE beneficiary_id = $2 AND commodity = $3
            `, [txn.quantity, txn.beneficiary_id, txn.commodity]);

            processed.push(txn.txn_id);
        }

        await client.query('COMMIT');

        res.json({
            message: 'Sync completed',
            processed_count: processed.length,
            failed_count: failed.length,
            failed_txns: failed
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Sync Error:', error);
        res.status(500).json({ message: 'Server error syncing transactions' });
    } finally {
        client.release();
    }
};

module.exports = { processTransaction, syncTransactions };
