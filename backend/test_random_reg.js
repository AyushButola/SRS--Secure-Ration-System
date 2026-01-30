const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

const randomId = Math.floor(Math.random() * 1000000);
const TEST_USER = {
    type: 'beneficiary',
    password: 'password123',
    fullName: `Test User ${randomId}`,
    rationCardNumber: `TEST_RC_${randomId}`,
    aadhaarLast4: '1234',
    mobileNumber: '9988776655'
};

async function verifyRegistration() {
    try {
        console.log(`--- Attempting Registration with ID: ${TEST_USER.rationCardNumber} ---`);
        const response = await axios.post(`${BASE_URL}/auth/register`, TEST_USER);

        if (response.status === 201) {
            console.log('✅ Registration successful.');
        }
    } catch (error) {
        if (error.response) {
            console.error(`❌ Failed with status ${error.response.status}:`, error.response.data);
        } else {
            console.error('❌ Error:', error.message);
        }
    }
}

verifyRegistration();
