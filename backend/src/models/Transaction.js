const db = require('../config/db');
const { generateHash } = require('../utils/hash');
const { v4: uuidv4 } = require('uuid');

class Transaction {

    /**
     * Creates a new transaction with hash chaining.
     * Uses a database transaction to ensure atomicity and chain integrity.
     */
    static async create({ beneficiary_id, shop_id, ration_period, commodity, quantity }) {
        const client = await db.pool.connect();

        try {
            await client.query('BEGIN'); // Start Transaction

            // 1. Lock and Get Last Ledger State (Global Scope for simplicity, or per shop)
            // FOR UPDATE clause locks the row to prevent race conditions
            const ledgerRes = await client.query(
                `SELECT last_hash FROM ledger_state WHERE scope_id = $1 FOR UPDATE`,
                ['GLOBAL']
            );

            let prevHash = 'GENESIS_HASH';
            if (ledgerRes.rows.length > 0) {
                prevHash = ledgerRes.rows[0].last_hash;
            } else {
                // Initialize if not exists (Should be seeded, but safety fallback)
                await client.query(
                    `INSERT INTO ledger_state (scope_id, last_hash, last_txn_id) VALUES ($1, $2, $3)`,
                    ['GLOBAL', 'GENESIS_HASH', '0']
                );
            }

            // 2. Prepare Data Payload
            const txn_id = uuidv4();
            const timestamp = new Date().toISOString();

            const dataToHash = {
                txn_id,
                beneficiary_id,
                shop_id,
                ration_period,
                commodity,
                quantity,
                timestamp
            };

            // 3. Generate New Hash
            const newHash = generateHash(dataToHash, prevHash);

            // 4. Insert Transaction
            const insertQuery = `
                INSERT INTO transactions 
                (txn_id, beneficiary_id, shop_id, ration_period, commodity, quantity, timestamp, prev_hash, hash, status, synced)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                RETURNING *
            `;

            const values = [
                txn_id,
                beneficiary_id,
                shop_id,
                ration_period,
                commodity,
                quantity,
                timestamp,
                prevHash,
                newHash,
                'VALID',
                true // Online transaction is synced by default
            ];

            const res = await client.query(insertQuery, values);
            const savedTxn = res.rows[0];

            // 5. Update Ledger State
            await client.query(
                `UPDATE ledger_state SET last_hash = $1, last_txn_id = $2, updated_at = NOW() WHERE scope_id = $3`,
                [newHash, txn_id, 'GLOBAL']
            );

            // 6. Deduct Stock
            const { deductStock } = require('../utils/stock');
            await deductStock(client, shop_id, commodity, quantity);

            await client.query('COMMIT'); // Commit Transaction
            return savedTxn;

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Verifies the integrity of a specific transaction against its predecessor.
     */
    static async verifyIntegrity(txn_id) {
        // Todo: Implement verify logic
        return true;
    }
}

module.exports = Transaction;
