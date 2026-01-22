const { pool } = require('../config/db');

const addBeneficiary = async () => {
    const BEN_ID = 'BEN_TEST_01';
    const NAME = 'Rahul Kumar';
    const CATEGORY = 'BPL';
    const SECURE_CODE = '5678';

    try {
        console.log(`Adding Beneficiary ${BEN_ID}...`);

        // 1. Add Beneficiary
        await pool.query(`
            INSERT INTO beneficiaries (beneficiary_id, name, category, active)
            VALUES ($1, $2, $3, TRUE)
            ON CONFLICT (beneficiary_id) DO NOTHING
        `, [BEN_ID, NAME, CATEGORY]);

        // 2. Add Secret Code
        await pool.query(`
            INSERT INTO beneficiary_secrets (beneficiary_id, secret_code)
            VALUES ($1, $2)
            ON CONFLICT (beneficiary_id) DO UPDATE SET secret_code = $2
        `, [BEN_ID, SECURE_CODE]);

        // 3. Add Entitlements (So they can actually shop)
        const commodities = [
            { name: 'Rice', max: 5 },
            { name: 'Wheat', max: 5 },
            { name: 'Sugar', max: 2 },
            { name: 'Kerosene', max: 2 }
        ];

        const crypto = require('crypto');
        const period = new Date().toISOString().slice(0, 7); // '2026-01'

        for (const item of commodities) {
            const entId = crypto.randomUUID();
            await pool.query(`
                INSERT INTO entitlements (entitlement_id, beneficiary_id, commodity, max_quantity, consumed_quantity, ration_period)
                VALUES ($1, $2, $3, $4, 0, $5)
                ON CONFLICT DO NOTHING
            `, [entId, BEN_ID, item.name, item.max, period]);
        }

        console.log(`Success! Created ${BEN_ID} with Code: ${SECURE_CODE}`);
        console.log('You can now login with this ID and use this Code at the shop.');

    } catch (error) {
        console.error('Error adding beneficiary:', error);
    } finally {
        await pool.end();
    }
};

addBeneficiary();
