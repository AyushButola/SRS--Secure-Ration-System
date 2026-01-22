const { pool } = require('../config/db');

const createSecretsTable = async () => {
    try {
        console.log('Creating beneficiary_secrets table...');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS beneficiary_secrets (
                beneficiary_id TEXT PRIMARY KEY REFERENCES beneficiaries(beneficiary_id),
                secret_code VARCHAR(10) NOT NULL,
                generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log('beneficiary_secrets table created.');
    } catch (error) {
        console.error('Error creating table:', error);
    } finally {
        await pool.end();
    }
};

createSecretsTable();
