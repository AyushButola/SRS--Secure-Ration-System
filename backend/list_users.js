const { pool } = require('./src/config/db');

async function listBeneficiaries() {
    try {
        const res = await pool.query('SELECT beneficiary_id, name, mobile_number FROM beneficiaries');
        console.log('--- Existing Beneficiaries ---');
        console.table(res.rows);
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

listBeneficiaries();
