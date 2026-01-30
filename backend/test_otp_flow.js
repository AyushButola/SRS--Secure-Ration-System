const axios = require('axios');
const { pool } = require('./src/config/db');
const jwt = require('jsonwebtoken');

const BASE_URL = 'http://localhost:3000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_123'; // Matched middleware default

// Mock Data
const BEN_ID = 'TEST_OTP_USER';
const BEN_MOBILE = '9999999999';

async function testOtpFlow() {
    try {
        console.log('--- Setting up Test User ---');
        // 1. Ensure User Exists
        await pool.query(
            `INSERT INTO beneficiaries (beneficiary_id, name, mobile_number, password_hash)
             VALUES ($1, 'OTP Tester', $2, 'hash')
             ON CONFLICT (beneficiary_id) DO NOTHING`,
            [BEN_ID, BEN_MOBILE]
        );

        // 2. Generate Admin Token (Mock)
        const adminToken = jwt.sign({ id: 'admin', type: 'admin' }, JWT_SECRET, { expiresIn: '1h' });

        // 3. Generate Beneficiary Token
        const userToken = jwt.sign({ id: BEN_ID, type: 'beneficiary' }, JWT_SECRET, { expiresIn: '1h' });

        console.log('\n--- 1. Admin Triggers OTP ---');
        const triggerRes = await axios.post(
            `${BASE_URL}/otp/admin-trigger`,
            { beneficiaryId: BEN_ID },
            { headers: { Authorization: `Bearer ${adminToken}` } }
        );
        console.log('Admin Trigger Response:', triggerRes.data);

        console.log('\n--- 2. Beneficiary Fetches OTP ---');
        const fetchRes = await axios.get(
            `${BASE_URL}/otp/current`,
            { headers: { Authorization: `Bearer ${userToken}` } }
        );
        console.log('Beneficiary Fetch Response:', fetchRes.data);

        if (fetchRes.data.valid && fetchRes.data.otp) {
            console.log('\n✅ SUCCESS: OTP verified matching flow!');
        } else {
            console.error('\n❌ FAILURE: OTP not found or invalid.');
        }

    } catch (error) {
        console.error('❌ Error Details:', JSON.stringify(error.response ? error.response.data : error.message, null, 2));
        if (error.code) console.error('Error Code:', error.code);
    } finally {
        await pool.end();
    }
}

testOtpFlow();
