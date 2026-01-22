const { pool } = require('../config/db');

const seedData = async () => {
    try {
        console.log('Seeding data...');

        // 1. Create Test Beneficiary
        const beneficiaryId = 'BEN123';
        const name = 'Ramesh Kumar';

        // Remove if exists to avoid conflicts during multiple runs
        await pool.query('DELETE FROM entitlements WHERE beneficiary_id = $1', [beneficiaryId]);
        await pool.query('DELETE FROM beneficiaries WHERE beneficiary_id = $1', [beneficiaryId]);

        await pool.query(`
            INSERT INTO beneficiaries (beneficiary_id, name, category, active)
            VALUES ($1, $2, 'BPL', TRUE)
        `, [beneficiaryId, name]);

        console.log(`Created Beneficiary: ${name} (${beneficiaryId})`);

        // 2. Create Entitlements
        const period = new Date().toISOString().slice(0, 7); // e.g., '2026-01'

        const entitlements = [
            { commodity: 'Rice', max_quantity: 5 },
            { commodity: 'Wheat', max_quantity: 10 },
            { commodity: 'Sugar', max_quantity: 2 },
            { commodity: 'Kerosene', max_quantity: 3 }
        ];

        for (const item of entitlements) {
            await pool.query(`
                INSERT INTO entitlements (entitlement_id, beneficiary_id, ration_period, commodity, max_quantity, consumed_quantity)
                VALUES ($1, $2, $3, $4, $5, 0)
            `, [`${beneficiaryId}_${item.commodity}`, beneficiaryId, period, item.commodity, item.max_quantity]);
        }

        console.log(`Created Entitlements for ${period}`);

    } catch (error) {
        console.error('Error seeding data:', error);
    } finally {
        await pool.end();
    }
};

if (require.main === module) {
    seedData();
}
