const { generateHash, verifyHash } = require('../utils/cryptoUtils');
const { getLastHash, updateLedgerState } = require('../services/ledgerService');
const { pool } = require('../config/db');

const testCoreLogic = async () => {
    try {
        console.log('--- Testing Crypto Utils ---');

        const genesisHash = '0'.repeat(64);
        const txnData = {
            shop_id: 'TEST_SHOP',
            beneficiary_id: 'BEN123',
            commodity: 'Rice',
            quantity: 5,
            created_at: new Date().toISOString()
        };

        // 1. Generate Hash
        console.log('Generating Hash...');
        const newHash = generateHash(genesisHash, txnData);
        console.log('Generated Hash:', newHash);

        // 2. Verify Hash
        console.log('Verifying Hash...');
        const isValid = verifyHash(genesisHash, newHash, txnData);
        console.log('Is Valid?', isValid);

        const isInvalid = verifyHash(genesisHash, 'wronghash123', txnData);
        console.log('Is Invalid Hash detected?', !isInvalid);

        console.log('\n--- Testing Ledger Service ---');

        // 3. Get Last Hash (Should be Genesis if new)
        const shopId = 'TEST_SHOP_99';

        // Setup: Create the test shop locally to avoid FK error
        await pool.query('INSERT INTO ration_shops (shop_id, shop_name, location) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING', [shopId, 'Test Shop', 'Test Loc']);

        console.log(`Getting Last Hash for ${shopId} (New Shop)...`);
        const initialHash = await getLastHash(shopId);
        console.log('Initial Hash:', initialHash);

        if (initialHash !== genesisHash) {
            console.error('FAIL: Expected Genesis Hash for new shop');
        }

        // 4. Update Ledger
        console.log(`Updating Ledger for ${shopId}...`);
        await updateLedgerState({ query: pool.query.bind(pool) }, shopId, newHash); // Mock client

        console.log('Fetching Updated Hash...');
        const updatedHash = await getLastHash(shopId);
        console.log('Updated Hash:', updatedHash);

        if (updatedHash === newHash) {
            console.log('SUCCESS: Ledger State Updated Correctly');
        } else {
            console.error('FAIL: Ledger State mismatch');
        }

        // Clean up
        await pool.query('DELETE FROM ledger_state WHERE shop_id = $1', [shopId]);
        await pool.query('DELETE FROM ration_shops WHERE shop_id = $1', [shopId]);

    } catch (error) {
        console.error('Test Failed:', error);
    } finally {
        await pool.end();
    }
};

testCoreLogic();
