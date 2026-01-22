const axios = require('axios');
const { pool } = require('../config/db');

const testTransactions = async () => {
    try {
        console.log('--- Testing Online Transaction ---');

        // 1. Setup: Ensure Entitlements Exist for BEN123
        // We assume seedData.js has been run. 
        // We need a valid Shop Token. 
        // We will mock the login flow or assume we have a way.
        // Let's create a temporary shop/user manually in DB and generate a token? 
        // Or better, just hit the API if the server is running.
        // Assume Server is running on localhost:3000

        const shopEmail = 'shop_test_txn@test.com';
        const shopPass = 'password123';
        const shopId = 'SHOP_TXN_01';

        // Register Shop (if not exists) via API? 
        // Actually, let's just insert into DB to be fast and deterministic
        console.log('Seeding Shop for Test...');

        // Ensure user/shop exists
        await pool.query('DELETE FROM transactions WHERE shop_id = $1', [shopId]);
        await pool.query('DELETE FROM ledger_state WHERE shop_id = $1', [shopId]);
        // We won't delete user/shop to keep it simple, just try to login. 
        // If fail, we register.

        let token;
        try {
            const loginRes = await axios.post('http://localhost:3000/api/auth/login', {
                email: shopEmail,
                password: shopPass
            });
            token = loginRes.data.token;
            console.log('Login Successful');
        } catch (e) {
            console.log('Login failed, registering new shop...');
            await axios.post('http://localhost:3000/api/shops/register', {
                email: shopEmail,
                password: shopPass,
                shop_id: shopId,
                shop_name: 'Test Transaction Shop',
                location: 'Test City',
                device_id: 'TEST_DEV'
            });
            // Approve it (manually via DB)
            await pool.query("UPDATE ration_shops SET status = 'APPROVED' WHERE shop_id = $1", [shopId]);
            // Now login
            const loginRes = await axios.post('http://localhost:3000/api/auth/login', {
                email: shopEmail,
                password: shopPass
            });
            token = loginRes.data.token;
            console.log('Login Successful (After Registration)');
        }

        // 2. Process Transaction
        console.log('Processing Transaction...');
        const txnData = {
            shop_id: shopId,
            beneficiary_id: 'BEN123',
            commodity: 'Rice',
            quantity: 2
        };

        const txnRes = await axios.post('http://localhost:3000/api/transactions/process', txnData, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Transaction Response:', txnRes.data);

        if (txnRes.status === 201 && txnRes.data.hash) {
            console.log('SUCCESS: Transaction Created with Hash', txnRes.data.hash);
        } else {
            console.error('FAIL: Transaction not created');
        }

        // 3. Verify Quota Deduction
        // We can fetch entitlements or check DB
        const entRes = await pool.query('SELECT consumed_quantity FROM entitlements WHERE beneficiary_id = $1 AND commodity = $2', ['BEN123', 'Rice']);
        console.log('New Consumed Quantity in DB:', entRes.rows[0].consumed_quantity);

    } catch (error) {
        console.error('Test Failed:', error.response ? error.response.data : error.message);
    } finally {
        await pool.end();
    }
};

testTransactions();
