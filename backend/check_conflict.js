const { pool } = require('./src/config/db');

async function checkUser() {
    try {
        const id = 'TEST_RC_612017';
        const mobile = '7037198819';

        console.log(`Checking for ID: ${id} and Mobile: ${mobile}`);

        const resId = await pool.query('SELECT * FROM beneficiaries WHERE beneficiary_id = $1', [id]);
        if (resId.rows.length > 0) {
            console.log('❌ Found User by ID:', resId.rows[0]);
        } else {
            console.log('✅ ID is available (not found in DB).');
        }

        const resMobile = await pool.query('SELECT * FROM beneficiaries WHERE mobile_number = $1', [mobile]);
        if (resMobile.rows.length > 0) {
            console.log('❌ Found User by Mobile:', resMobile.rows[0]);
        } else {
            console.log('✅ Mobile is available (not found in DB).');
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

checkUser();
