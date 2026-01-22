const { pool } = require('../config/db');

/**
 * Retrieves the last known hash for a specific shop.
 * Returns '0000000000000000000000000000000000000000000000000000000000000000' (Genesis) if no record exists.
 */
const getLastHash = async (shopId) => {
    try {
        const result = await pool.query('SELECT last_hash FROM ledger_state WHERE shop_id = $1', [shopId]);

        if (result.rows.length === 0) {
            // Genesis Hash (Default for new shops)
            return '0'.repeat(64);
        }
        return result.rows[0].last_hash;
    } catch (error) {
        console.error(`Error getting last hash for shop ${shopId}:`, error);
        throw error;
    }
};

/**
 * Updates or Inserts the latest hash for a shop.
 * This should be called inside a transaction ideally.
 */
const updateLedgerState = async (client, shopId, newHash) => {
    // Using ON CONFLICT (shop_id) 
    // This requires shop_id to be a PRIMARY KEY or UNIQUE constraint
    const query = `
        INSERT INTO ledger_state (shop_id, last_hash, updated_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (shop_id) 
        DO UPDATE SET last_hash = EXCLUDED.last_hash, updated_at = NOW();
    `;
    await client.query(query, [shopId, newHash]);
};

module.exports = { getLastHash, updateLedgerState };
