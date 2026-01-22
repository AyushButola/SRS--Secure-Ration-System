const axios = require('axios');
const { pool } = require('../config/db');
const crypto = require('crypto');

// Minimal Crypto Utils Local Implementation for Simulation
const generateHash = (prevHash, txnData) => {
    const { shop_id, beneficiary_id, commodity, quantity, created_at } = txnData;
    const dataString = `${prevHash}|${shop_id}|${beneficiary_id}|${commodity}|${quantity}|${created_at}`;
    return crypto.createHash('sha256').update(dataString).digest('hex');
};

const testSync = async () => {
    try {
        console.log('--- Testing Offline Sync ---');

        const shopEmail = 'shop_test_sync@test.com';
        const shopPass = 'password123';
        const shopId = 'SHOP_SYNC_01';

        // 1. Setup Shop
        console.log('Setting up Sync Shop...');
        await pool.query('DELETE FROM transactions WHERE shop_id = $1', [shopId]);
        await pool.query('DELETE FROM ledger_state WHERE shop_id = $1', [shopId]);
        await pool.query('DELETE FROM ration_shops WHERE shop_id = $1', [shopId]);
        // Clean user?
        await pool.query('DELETE FROM users WHERE email = $1', [shopEmail]);

        // Register
        await axios.post('http://localhost:3000/api/shops/register', {
            email: shopEmail,
            password: shopPass,
            shop_id: shopId,
            shop_name: 'Sync Test Shop',
            location: 'Remote',
            device_id: 'OFFLINE_DEV'
        });
        await pool.query("UPDATE ration_shops SET status = 'APPROVED' WHERE shop_id = $1", [shopId]);

        // Login
        const loginRes = await axios.post('http://localhost:3000/api/auth/login', {
            email: shopEmail,
            password: shopPass
        });
        const token = loginRes.data.token;
        console.log('Login Successful');

        // 2. Simulate Offline Transactions
        let prevHash = '0'.repeat(64); // Initial Genesis
        const txns = [];
        const beneficiaryId = 'BEN123';

        // TXN 1
        const txn1Id = crypto.randomUUID();
        const ts1 = new Date().toISOString();
        const txn1Data = { shop_id: shopId, beneficiary_id: beneficiaryId, commodity: 'Wheat', quantity: 2, created_at: ts1 };
        const hash1 = generateHash(prevHash, txn1Data);

        txns.push({
            txn_id: txn1Id,
            beneficiary_id: beneficiaryId,
            commodity: 'Wheat',
            quantity: 2,
            timestamp: ts1,
            prev_hash: prevHash,
            hash: hash1
        });

        // TXN 2 (Linked to TXN 1)
        const txn2Id = crypto.randomUUID();
        const ts2 = new Date().toISOString();
        const txn2Data = { shop_id: shopId, beneficiary_id: beneficiaryId, commodity: 'Sugar', quantity: 1, created_at: ts2 };
        const hash2 = generateHash(hash1, txn2Data); // prevHash is hash1

        txns.push({
            txn_id: txn2Id,
            beneficiary_id: beneficiaryId,
            commodity: 'Sugar',
            quantity: 1,
            timestamp: ts2,
            prev_hash: hash1, // Link!
            hash: hash2
        });

        console.log(`Prepared ${txns.length} offline transactions. Syncing...`);

        // 3. Sync
        const syncRes = await axios.post('http://localhost:3000/api/transactions/sync', {
            shop_id: shopId,
            transactions: txns
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Sync Response:', syncRes.data);

        if (syncRes.data.processed_count === 2 && syncRes.data.failed_count === 0) {
            console.log('SUCCESS: Batch Synced');
        } else {
            console.error('FAIL: Sync incomplete');
        }

        // 4. Verify Ledger State
        const ledgerRes = await pool.query('SELECT last_hash FROM ledger_state WHERE shop_id = $1', [shopId]);
        const serverHash = ledgerRes.rows[0].last_hash;
        console.log('Server Final Hash:', serverHash);

        if (serverHash === hash2) {
            console.log('SUCCESS: Ledger State matches final transaction');
        } else {
            console.error('FAIL: Ledger mismatch');
        }

    } catch (error) {
        console.error('Test Failed:', error.response ? error.response.data : error.message);
    } finally {
        await pool.end();
    }
};

testSync();
