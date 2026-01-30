const axios = require('axios');
const { pool } = require('./src/config/db');
require('dotenv').config();

const BASE_URL = 'http://localhost:3000/api';

const TEST_USER = {
    type: 'beneficiary',
    password: 'password123',
    fullName: 'Test Verification User',
    rationCardNumber: 'VERIFY_RC_999',
    aadhaarLast4: '8888',
    mobileNumber: '9123456780'
};

async function verifyRegistration() {
    try {
        console.log('--- Starting Registration Verification ---');

        // 1. Cleanup
        console.log('Step 1: Cleaning up any existing test data...');
        await pool.query('DELETE FROM beneficiaries WHERE beneficiary_id = $1', [TEST_USER.rationCardNumber]);

        // 2. Register
        console.log(`Step 2: Sending registration request to ${BASE_URL}/auth/register...`);
        try {
            const response = await axios.post(`${BASE_URL}/auth/register`, TEST_USER);

            if (response.status === 201) {
                console.log('✅ Registration successful. API returned 201 Created.');
            } else {
                console.error(`❌ Registration failed. API returned ${response.status}:`, response.data);
                process.exit(1);
            }
        } catch (apiError) {
            if (apiError.code === 'ECONNREFUSED') {
                console.error('❌ Connection refused! checks if the backend server is running on port 3000.');
                process.exit(1);
            }
            throw apiError;
        }

        // 3. Verify Database
        console.log('Step 3: Verifying data persistence in database...');
        const res = await pool.query('SELECT * FROM beneficiaries WHERE beneficiary_id = $1', [TEST_USER.rationCardNumber]);

        if (res.rows.length > 0) {
            const user = res.rows[0];
            console.log('✅ User found in database.');

            if (user.mobile_number === TEST_USER.mobileNumber) {
                console.log(`✅ SUCCESS: Mobile Number verified in DB: ${user.mobile_number}`);
            } else {
                console.error(`❌ FAILURE: Mobile Number Mismatch! Expected: ${TEST_USER.mobileNumber}, Found: ${user.mobile_number}`);
            }
        } else {
            console.error('❌ FAILURE: User not found in database after successful registration response!');
        }

    } catch (error) {
        console.error('❌ Verification Error:', error.message);
        if (error.response) {
            console.error('Response Data:', error.response.data);
        }
    } finally {
        await pool.end();
    }
}

verifyRegistration();
