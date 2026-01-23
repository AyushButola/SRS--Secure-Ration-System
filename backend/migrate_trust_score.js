const db = require('./src/config/db');

async function migrateTrustScore() {
    console.log('Starting Migration: Adding Trust Score...');
    try {
        // Beneficiaries
        await db.query(`ALTER TABLE beneficiaries ADD COLUMN IF NOT EXISTS trust_score INT DEFAULT 100`);

        // Ration Shops
        await db.query(`ALTER TABLE ration_shops ADD COLUMN IF NOT EXISTS trust_score INT DEFAULT 100`);

        console.log('✅ Trust Score Columns Added');
    } catch (e) {
        console.error('Migration Failed', e);
    }
}

migrateTrustScore();
