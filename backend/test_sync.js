const { v4: uuidv4 } = require('uuid');

const testSync = async () => {
    const BASE_URL = 'http://localhost:3000/api';
    console.log('--- Starting Sync Verification ---');

    try {
        const txnIdValid = uuidv4();
        const txnIdFraud = uuidv4(); // Large quantity

        // Payload with Mixed Scenarios
        const payload = {
            device_id: "DEV_TEST_01",
            transactions: [
                {
                    // 1. Valid Transaction
                    txn_id: txnIdValid,
                    beneficiary_id: "BEN_001",
                    shop_id: "SHOP_001",
                    ration_period: "2026-01",
                    commodity: "WHEAT",
                    quantity: 1.0,
                    timestamp: new Date().toISOString()
                },
                {
                    // 2. Duplicate Transaction (Same ID as valid one)
                    // Note: In real life, duplicates might be exact copies. 
                    // The server checks ID. So sending the exact same ID again should trigger duplicate.
                    txn_id: txnIdValid,
                    beneficiary_id: "BEN_001",
                    shop_id: "SHOP_001",
                    ration_period: "2026-01",
                    commodity: "WHEAT",
                    quantity: 1.0,
                    timestamp: new Date().toISOString()
                },
                {
                    // 3. Quota Exceeded (Fraud)
                    // Ramesh has max 3kg Wheat (entitlement). We ask for 100kg.
                    txn_id: txnIdFraud,
                    beneficiary_id: "BEN_001",
                    shop_id: "SHOP_001",
                    ration_period: "2026-01",
                    commodity: "WHEAT",
                    quantity: 100.0,
                    timestamp: new Date().toISOString()
                }
            ]
        };

        console.log(`\nSending Batch of ${payload.transactions.length} transactions...`);
        console.log(`- Valid ID: ${txnIdValid}`);
        console.log(`- Fraud ID: ${txnIdFraud}`);

        const res = await fetch(`${BASE_URL}/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();

        console.log('\nResponse Status:', res.status);
        console.log('Response Body:', JSON.stringify(data, null, 2));

        // Assertions
        if (res.status === 200) {
            if (data.results.synced === 1 && data.results.failed === 2) {
                console.log('\n✅ PASS: Logic verified.');
                console.log('   - 1 Sync Success (Valid)');
                console.log('   - 1 Fail (Duplicate ID)');
                console.log('   - 1 Fail (Quota Exceeded)');
            } else {
                console.log('\n❌ FAIL: Unexpected counts.');
            }
        } else {
            console.log('\n❌ FAIL: Request failed.');
        }

    } catch (e) {
        console.error('Test Error:', e);
    }
};

testSync();
