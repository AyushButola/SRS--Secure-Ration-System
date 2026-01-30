require('dotenv').config({ path: './backend/.env' });
const { Pool } = require('pg');

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const checkOTPs = async () => {
    try {
        console.log('--- Tables ---');
        const tablesParams = await db.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        console.table(tablesParams.rows);

        console.log('--- Active OTPs ---');
        const res = await db.query('SELECT * FROM otp_codes');
        console.table(res.rows);

        console.log('--- Beneficiaries ---');
        const benRes = await db.query('SELECT beneficiary_id, name, mobile_number FROM beneficiaries');
        console.table(benRes.rows);
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
};

checkOTPs();
