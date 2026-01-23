const db = require('./src/config/db');

async function checkOTP() {
    try {
        const res = await db.query('SELECT * FROM otp_codes');
        console.log('--- OTP TABLE CONTENT ---');
        console.table(res.rows);

        const nowRes = await db.query('SELECT NOW() as db_time');
        console.log('DB TIME:', nowRes.rows[0].db_time);
    } catch (e) {
        console.error(e);
    }
}

checkOTP();  
