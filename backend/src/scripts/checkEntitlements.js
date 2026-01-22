const { pool } = require('../config/db');

const check = async () => {
    try {
        const res = await pool.query("SELECT * FROM entitlements WHERE beneficiary_id = 'BEN_TEST_01'");
        console.log('Entitlements for BEN_TEST_01:', res.rows);
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
};

check();
