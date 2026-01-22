const Transaction = require('./src/models/Transaction');
const db = require('./src/config/db');
const { verifyHash } = require('./src/utils/hash');

const runTest = async () => {
    console.log('--- Starting Ledger Verification ---');

    try {
        // 1. Create Test Transactions
        console.log('\n1. Creating Transactions...');

        const txn1 = await Transaction.create({
            beneficiary_id: 'BEN_001',
            shop_id: 'SHOP_001',
            ration_period: '2026-01',
            commodity: 'RICE',
            quantity: 5.0
        });
        console.log(`- Txn 1 Created: ${txn1.txn_id.substring(0, 8)}... | Hash: ${txn1.hash.substring(0, 10)}...`);

        const txn2 = await Transaction.create({
            beneficiary_id: 'BEN_002',
            shop_id: 'SHOP_001',
            ration_period: '2026-01',
            commodity: 'WHEAT',
            quantity: 10.0
        });
        console.log(`- Txn 2 Created: ${txn2.txn_id.substring(0, 8)}... | Hash: ${txn2.hash.substring(0, 10)}... (Prev: ${txn2.prev_hash.substring(0, 10)}...)`);

        // 2. Verify Link
        console.log('\n2. Verifying Hash Chain Link...');
        if (txn2.prev_hash === txn1.hash) {
            console.log('✅ PASS: Txn 2 correctly points to Txn 1.');
        } else {
            console.error('❌ FAIL: Broken Chain! Txn 2 prev_hash does not match Txn 1 hash.');
        }

        // 3. Verify Integrity (Recalculate Hash)
        console.log('\n3. Verifying Cryptographic Integrity...');

        // Re-construct data object for Txn 2
        const dataToVerify = {
            txn_id: txn2.txn_id,
            beneficiary_id: txn2.beneficiary_id,
            shop_id: txn2.shop_id,
            ration_period: txn2.ration_period,
            commodity: txn2.commodity,
            quantity: txn2.quantity,
            timestamp: txn2.timestamp.toISOString() // PG returns Date object, need ISO string
        };

        const isValid = verifyHash(txn2.hash, dataToVerify, txn2.prev_hash);

        if (isValid) {
            console.log('✅ PASS: Txn 2 Hash is valid.');
        } else {
            console.error('❌ FAIL: Txn 2 Hash is INVALID (Tampered?)');
            console.log('Expected:', txn2.hash);
        }

        // 4. Check Ledger State
        console.log('\n4. Checking Ledger State...');
        const ledger = await db.query("SELECT * FROM ledger_state WHERE scope_id = 'GLOBAL'");
        if (ledger.rows[0].last_hash === txn2.hash) {
            console.log('✅ PASS: Ledger State points to the latest transaction.');
        } else {
            console.error('❌ FAIL: Ledger State out of sync.');
        }

    } catch (e) {
        console.error('Test Failed:', e);
    } finally {
        process.exit();
    }
};

runTest();
