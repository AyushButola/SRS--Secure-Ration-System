const { pool } = require('../config/db');

const inspectUsersTable = async () => {
    try {
        console.log('Inspecting users table columns...');
        const result = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'users';
        `);
        console.table(result.rows);
    } catch (error) {
        console.error('Error inspecting table:', error);
    } finally {
        await pool.end();
    }
};

inspectUsersTable();
