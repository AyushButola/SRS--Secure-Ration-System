const { pool } = require('../config/db');

const seedSecrets = async () => {
    try {
        console.log('Seeding secrets for beneficiaries...');

        // Default code '1234' for BEN123
        await pool.query(`
            INSERT INTO beneficiary_secrets (beneficiary_id, secret_code)
            VALUES ('BEN123', '1234')
            ON CONFLICT (beneficiary_id) DO UPDATE SET secret_code = '1234';
        `);

        console.log('Seeded BEN123 with code 1234');
    } catch (error) {
        console.error('Error seeding secrets:', error);
    } finally {
        await pool.end();
    }
};

seedSecrets();
