const { pool } = require('../config/db');

const createLedgerTable = async () => {
    try {
        console.log('Creating ledger_state table...');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS ledger_state (
                shop_id TEXT PRIMARY KEY REFERENCES ration_shops(shop_id),
                last_hash TEXT NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log('ledger_state table created.');
    } catch (error) {
        console.error('Error creating table:', error);
    } finally {
        await pool.end();
    }
};

createLedgerTable();
