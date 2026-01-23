const axios = require('axios');
const db = require('./src/config/db');

const API_URL = 'http://localhost:3000/api';
const BEN_ID = 'BEN_SCORE_TEST';
const SHOP_ID = 'SHOP_SCORE_TEST';

async function setup() {
    // reset/create test users
    // Clean dependencies first
    await db.query(`DELETE FROM conflicts WHERE beneficiary_id = '${BEN_ID}'`);
    await db.query(`DELETE FROM transactions WHERE beneficiary_id = '${BEN_ID}'`);
    await db.query(`DELETE FROM otp_codes WHERE beneficiary_id = '${BEN_ID}'`);
    await db.query(`DELETE FROM entitlements WHERE beneficiary_id = '${BEN_ID}'`);

    // Then main tables
    await db.query(`DELETE FROM beneficiaries WHERE beneficiary_id = '${BEN_ID}'`);
    await db.query(`DELETE FROM ration_shops WHERE shop_id = '${SHOP_ID}'`);

    await db.query(`INSERT INTO beneficiaries (beneficiary_id, name, trust_score) VALUES ('${BEN_ID}', 'Trust Test', 50)`);
    await db.query(`INSERT INTO ration_shops (shop_id, shop_name, trust_score) VALUES ('${SHOP_ID}', 'Trust Shop', 50)`);
    await db.query(`INSERT INTO entitlements (entitlement_id, beneficiary_id, ration_period, commodity, max_quantity, consumed_quantity) VALUES ('ENT_TEST', '${BEN_ID}', '2026-01', 'RICE', 10, 0)`);
}

async function getScores() {
    const b = await db.query(`SELECT trust_score FROM beneficiaries WHERE beneficiary_id = '${BEN_ID}'`);
    const s = await db.query(`SELECT trust_score FROM ration_shops WHERE shop_id = '${SHOP_ID}'`);
    return { ben: b.rows[0].trust_score, shop: s.rows[0].trust_score };
}

async function test() {
    await setup();
    console.log('--- Initial Scores ---', await getScores());

    // 1. Valid Transaction (+1)
    console.log('\n--- 1. Valid Transaction ---');
    try {
        await axios.post(`${API_URL}/transactions`, {
            beneficiary_id: BEN_ID,
            shop_id: SHOP_ID,
            ration_period: '2026-01',
            commodity: 'RICE',
            quantity: 1
        });
        console.log('Txn Success');
    } catch (e) { console.error('Txn Failed', e.response?.data); }

    let scores = await getScores();
    console.log('Scores after Valid (+1):', scores);
    // Should be 50 + 1 = 51
    if (scores.ben !== 51 || scores.shop !== 51) console.error('FAIL: Scores did not increase correctly (Expected 51)');


    // 2. Invalid Transaction (Over limit) (-5)
    console.log('\n--- 2. Invalid Transaction (Over Limit) ---');
    try {
        await axios.post(`${API_URL}/transactions`, {
            beneficiary_id: BEN_ID,
            shop_id: SHOP_ID,
            ration_period: '2026-01',
            commodity: 'RICE',
            quantity: 20 // exceeds 10
        });
        console.log('Txn Success (Unexpected)');
    } catch (e) { console.error('Txn Failed (Expected)'); }

    scores = await getScores();
    console.log('Scores after Invalid (-5):', scores);
    // Ben was 51, should be 46
    if (scores.ben !== 46) console.error('FAIL: Beneficiary score did not decrease correctly (Expected 46)');


    // 3. Hash Tampering (Sync) (-20)
    console.log('\n--- 3. Hash Tampering ---');
    try {
        await axios.post(`${API_URL}/sync`, {
            device_id: 'TEST_DEV',
            transactions: [{
                txn_id: 'TAMPER_TXN_' + Date.now(),
                beneficiary_id: BEN_ID,
                shop_id: SHOP_ID,
                ration_period: '2026-01',
                commodity: 'RICE',
                quantity: 1,
                timestamp: new Date().toISOString(),
                prev_hash: 'GENESIS_HASH',
                hash: 'BAD_HASH_12345' // INVALID HASH
            }]
        });
        console.log('Sync Response (Expected Success but with errors)');
    } catch (e) { console.error('Sync Failed', e.response?.data); }

    scores = await getScores();
    console.log('Scores after Tampering (-20):', scores);
    // Shop was 51, should be 31
    if (scores.shop !== 31) console.error('FAIL: Shop score did not decrease correctly (Expected 31)');
}

test();
