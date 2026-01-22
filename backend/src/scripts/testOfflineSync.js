const axios = require('axios');
const crypto = require('crypto');
const { generateHash } = require('../utils/cryptoUtils');

const SHOP_ID = 'SHOP_SYNC_01';
const BEN_ID = 'BEN_TEST_01'; // Ensure this beneficiary exists
const API_URL = 'http://localhost:3000/api';

// mimic the device fetching the last known hash from server before going offline
// In real life, this happens when the device syncs *down*.
const getInitialHash = async () => {
    // We don't have a direct "get hash" endpoint public, so we'll simulate it by
    // running a dummy txn or just querying the DB via a debug endpoint/script.
    // For this test, we assume the user has run at least one transaction to set the state, 
    // OR we fetch the shop status if we implemented it.
    // Let's use a debug DB query for the test script to get the TRUE server state.
    const { pool } = require('../config/db');
    const res = await pool.query('SELECT last_hash FROM ledger_state WHERE scope_id = $1', [SHOP_ID]);
    await pool.end();

    if (res.rows.length === 0) return 'GENESIS_HASH'; // Default if fresh
    return res.rows[0].last_hash;
};

const runSimulation = async () => {
    try {
        console.log('1. Fetching Server Last Hash (Simulating Device Sync-Down)...');
        let currentPrevHash = await getInitialHash();
        console.log('   Device Start Hash:', currentPrevHash);

        // 2. Create Offline Transactions (Stored Locally)
        const offlineTxns = [];

        // Txn 1: Sugar
        const txn1 = {
            txn_id: crypto.randomUUID(),
            beneficiary_id: BEN_ID,
            commodity: 'Sugar',
            quantity: 1,
            timestamp: new Date().toISOString()
        };
        // Calculate Hash 1
        const hash1 = generateHash(currentPrevHash, { ...txn1, shop_id: SHOP_ID });

        offlineTxns.push({
            ...txn1,
            hash: hash1,
            prev_hash: currentPrevHash
        });

        // Update local state for next txn
        currentPrevHash = hash1;

        // Txn 2: Wheat (Chained to Txn 1)
        const txn2 = {
            txn_id: crypto.randomUUID(),
            beneficiary_id: BEN_ID,
            commodity: 'Wheat',
            quantity: 2,
            timestamp: new Date().toISOString()
        };
        // Calculate Hash 2
        const hash2 = generateHash(currentPrevHash, { ...txn2, shop_id: SHOP_ID });

        offlineTxns.push({
            ...txn2,
            hash: hash2,
            prev_hash: currentPrevHash
        });

        console.log(`2. Generated ${offlineTxns.length} Offline Transactions locally.`);
        console.log('   Chain:', offlineTxns.map(t => t.hash.substring(0, 10) + '...'));

        // 3. Sync to Server (Back Online)
        // We need a tokenizer token usually, but simulating a token or using a helper if auth disabled for sync
        // Assuming we need a token, we might need to login. 
        // For now, let's assume the sync endpoint requires a token.
        // We'll skip token for this script if we didn't implement 'login' in script, 
        // OR we can just use the 'verifyToken' if we have a valid one.
        // Let's try to hit it. If 401, we need to login as shop owner first.

        // Login as admin/shop to get token? Or just mock it if we can.
        // Let's try login as admin first to get a token.
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@test.com',
            password: 'password123'
        });
        const token = loginRes.data.token;

        console.log('3. Pushing to Server...');
        const syncRes = await axios.post(`${API_URL}/transactions/sync`, {
            shop_id: SHOP_ID,
            transactions: offlineTxns
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('SUCCESS! Server Response:', syncRes.data);

    } catch (error) {
        console.error('FAILED:', error.response ? error.response.data : error.message);
    }
};

runSimulation();
