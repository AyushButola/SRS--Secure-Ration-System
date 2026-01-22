const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

async function testAuth() {
    try {
        console.log('--- 1. Testing Login (Admin) ---');
        const adminLogin = await axios.post(`${API_URL}/auth/login`, {
            username: 'admin',
            password: 'password123',
            type: 'admin'
        });
        console.log('Admin Login Success, Token:', adminLogin.data.token ? 'Present' : 'Missing');
        const adminToken = adminLogin.data.token;

        console.log('\n--- 2. Testing Login (Shop) ---');
        const shopLogin = await axios.post(`${API_URL}/auth/login`, {
            username: 'SHOP_001',
            password: 'password123', // From seed
            type: 'shop'
        });
        console.log('Shop Login Success, Token:', shopLogin.data.token ? 'Present' : 'Missing');
        const shopToken = shopLogin.data.token;

        console.log('\n--- 3. Testing Protected Admin Route (Without Token) ---');
        try {
            await axios.get(`${API_URL}/admin/stats`);
        } catch (e) {
            console.log('Expected Error:', e.response ? e.response.status : e.message);
        }

        console.log('\n--- 4. Testing Protected Admin Route (With Token) ---');
        const adminStats = await axios.get(`${API_URL}/admin/stats`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log('Admin Stats Access:', adminStats.status === 200 ? 'Success' : 'Failed');

        console.log('\n--- 5. Testing Protected Shop Route (Beneficiary Lookup) ---');
        const benCheck = await axios.get(`${API_URL}/beneficiaries/BEN_001`, {
            headers: { Authorization: `Bearer ${shopToken}` }
        });
        console.log('Beneficiary Lookup Access:', benCheck.status === 200 ? 'Success' : 'Failed');

    } catch (err) {
        console.error('Test Failed:', err.response ? err.response.data : err.message);
    }
}

testAuth();
