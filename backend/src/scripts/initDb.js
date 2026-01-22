const { pool } = require('../config/db');
const initializeSchema = require('../config/initSchema');

const initDb = async () => {
    try {
        console.log('Running database initialization...');
        await initializeSchema();
        console.log('Database initialization script completed.');
    } catch (error) {
        console.error('Initialization failed:', error);
    } finally {
        await pool.end();
    }
};

if (require.main === module) {
    initDb();
}

module.exports = initDb;
