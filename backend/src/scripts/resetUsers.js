const { pool } = require('../config/db');
const initializeSchema = require('../config/initSchema');

const resetUsers = async () => {
    try {
        console.log('Dropping users table to enforce new schema...');
        await pool.query('DROP TABLE IF EXISTS users CASCADE;');
        console.log('Users table dropped.');

        console.log('Re-initializing schema...');
        await initializeSchema();
        console.log('Schema reset complete.');
    } catch (error) {
        console.error('Error resetting users:', error);
    } finally {
        await pool.end();
    }
};

resetUsers();
