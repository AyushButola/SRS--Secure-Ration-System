const db = require('./src/config/db');

async function migrate() {
    console.log('Starting Migration: Adding Registration Columns...');
    try {
        // Beneficiaries
        await db.query(`ALTER TABLE beneficiaries ADD COLUMN IF NOT EXISTS mobile_number TEXT`);
        await db.query(`ALTER TABLE beneficiaries ADD COLUMN IF NOT EXISTS aadhaar_last_4 VARCHAR(4)`);

        // Ration Shops
        await db.query(`ALTER TABLE ration_shops ADD COLUMN IF NOT EXISTS owner_name TEXT`);
        await db.query(`ALTER TABLE ration_shops ADD COLUMN IF NOT EXISTS license_number TEXT`);
        await db.query(`ALTER TABLE ration_shops ADD COLUMN IF NOT EXISTS mobile_number TEXT`);

        console.log('✅ Migration Complete');
    } catch (e) {
        console.error('Migration Failed', e);
    }
}

migrate();
