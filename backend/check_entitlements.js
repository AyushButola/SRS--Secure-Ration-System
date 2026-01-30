require('dotenv').config({ path: './backend/.env' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const checkEntitlements = async () => {
    try {
        console.log('--- Entitlements for BEN_001 ---');
        const res = await pool.query("SELECT * FROM entitlements WHERE beneficiary_id = 'BEN_001'");
        console.table(res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
};

checkEntitlements();
