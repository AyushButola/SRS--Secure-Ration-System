const testApi = async () => {
    const BASE_URL = 'http://localhost:3000/api';
    console.log('--- Starting API Verification ---');

    try {
        // 1. Test GET Beneficiary
        console.log('\n1. Testing GET /beneficiaries/BEN_001...');
        const res1 = await fetch(`${BASE_URL}/beneficiaries/BEN_001`);
        const data1 = await res1.json();

        if (res1.status === 200) {
            console.log('✅ PASS: Found Beneficiary:', data1.beneficiary.name);
            console.log(`   Entitlements: ${data1.entitlements.length} found.`);
        } else {
            console.error('❌ FAIL: Status', res1.status, data1);
        }

        // 2. Test POST Transaction
        console.log('\n2. Testing POST /transactions...');
        const txnPayload = {
            beneficiary_id: "BEN_001",
            shop_id: "SHOP_001",
            ration_period: "2026-01",
            commodity: "SUGAR",
            quantity: 2.0
        };

        const res2 = await fetch(`${BASE_URL}/transactions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(txnPayload)
        });
        const data2 = await res2.json();

        if (res2.status === 201) {
            console.log('✅ PASS: Transaction Created!');
            console.log('   Txn ID:', data2.txn_id);
            console.log('   Hash:', data2.hash);
            console.log('   Prev Hash:', data2.prev_hash);
        } else {
            console.error('❌ FAIL: Status', res2.status, data2);
        }

    } catch (e) {
        console.error('Test Error:', e);
    }
};

testApi();
