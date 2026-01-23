const db = require('./src/config/db');

async function checkData() {
    try {
        console.log('--- BENEFICIARIES ---');
        const bens = await db.query('SELECT beneficiary_id, name FROM beneficiaries');
        console.table(bens.rows);

        console.log('--- OTP CODES ---');
        const otps = await db.query('SELECT * FROM otp_codes');
        console.table(otps.rows);

        const now = await db.query('SELECT NOW()');
        console.log('DB Now:', now.rows[0]);
    } catch (e) {
        console.error(e);
    }
}
checkData();
