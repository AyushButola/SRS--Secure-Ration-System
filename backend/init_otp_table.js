require('dotenv').config({ path: './backend/.env' }); // Adjust path if needed
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const createTable = async () => {
    try {
        console.log('--- Creating OTP Table ---');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS otp_codes (
                otp_id SERIAL PRIMARY KEY,
                beneficiary_id TEXT REFERENCES beneficiaries(beneficiary_id),
                otp_code TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '1 hour'),
                used BOOLEAN DEFAULT FALSE
            );
        `);
        console.log('OTP Table Created (or existed).');

        console.log('--- checking BEN_001 ---');
        // Insert a dummy OTP for testing
        await pool.query("DELETE FROM otp_codes WHERE beneficiary_id = 'BEN_001'");
        await pool.query(`
            INSERT INTO otp_codes (beneficiary_id, otp_code, expires_at)
            VALUES ('BEN_001', '123456', NOW() + INTERVAL '1 hour')
        `);
        console.log('Inserted Test OTP: 123456 for BEN_001');

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
};

createTable();
