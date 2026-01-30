const axios = require('axios');
const jwt = require('jsonwebtoken');

const SECRET_KEY = 'supersecretkey123'; // Value from .env
const API_URL = 'http://localhost:3000/api';

const runTest = async () => {
    // 1. Generate Admin Token
    const adminToken = jwt.sign({ username: 'admin', type: 'admin' }, SECRET_KEY, { expiresIn: '1h' });
    console.log('Generated Admin Token:', adminToken);

    try {
        // 2. Get Beneficiaries to find a valid ID
        console.log('Fetching beneficiaries...');
        const benRes = await axios.get(`${API_URL}/admin/beneficiaries`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });

        if (benRes.data.length === 0) {
            console.log('No beneficiaries found to test with.');
            return;
        }

        const beneficiaryId = benRes.data[0].beneficiary_id;
        console.log(`Testing with Beneficiary ID: ${beneficiaryId}`);

        // 3. Trigger OTP
        console.log('Triggering OTP...');
        const otpRes = await axios.post(`${API_URL}/otp/admin-trigger`,
            { beneficiaryId },
            { headers: { Authorization: `Bearer ${adminToken}` } }
        );

        console.log('OTP Connect Response:', otpRes.data);

        if (otpRes.data.success) {
            console.log('✅ verification PASSED: OTP triggered successfully.');
        } else {
            console.error('❌ verification FAILED: Success flag missing.');
        }

    } catch (err) {
        console.error('❌ verification FAILED:', err.response ? err.response.data : err.message);
    }
};

runTest();
