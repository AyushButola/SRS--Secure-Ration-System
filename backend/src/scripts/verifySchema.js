const { pool } = require('../config/db');

const verifySchema = async () => {
    try {
        console.log('Verifying table creation...\n');

        // Query to get all table names in the public schema
        const query = `
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        `;

        const res = await pool.query(query);

        if (res.rows.length === 0) {
            console.log('No tables found in public schema.');
        } else {
            console.log('Tables found:');
            res.rows.forEach(row => {
                console.log(` - ${row.table_name}`);
            });
        }

    } catch (error) {
        console.error('Error verifying schema:', error);
    } finally {
        await pool.end();
    }
};

verifySchema();
