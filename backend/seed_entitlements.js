require('dotenv').config({ path: './backend/.env' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const seedEntitlements = async () => {
    try {
        console.log('--- Seeding Entitlements for BEN_001 ---');

        // Clear existing for this period to avoid duplicates (optional, but good for idempotency)
        await pool.query(`DELETE FROM entitlements WHERE beneficiary_id = 'BEN_001' AND ration_period = '2026-01'`);

        const commodities = [
            { name: 'Rice', amount: 35 },
            { name: 'Wheat', amount: 15 },
            { name: 'Sugar', amount: 5 },
            { name: 'Kerosene', amount: 3 }
        ];

        for (const item of commodities) {
            const id = 'ENT_' + Math.floor(Math.random() * 100000);
            await pool.query(`
                INSERT INTO entitlements (entitlement_id, beneficiary_id, ration_period, commodity, max_quantity, consumed_quantity)
                VALUES ($1, $2, $3, $4, $5, 0)
            `, [id, 'BEN_001', '2026-01', item.name, item.amount]);
            console.log(`Added ${item.name}: ${item.amount}kg`);
        }

        console.log('--- Seeding Complete ---');

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
};

seedEntitlements();
