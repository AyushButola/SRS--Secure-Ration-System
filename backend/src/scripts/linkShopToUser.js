const { pool } = require('../config/db');

const linkShopToUser = async () => {
    try {
        console.log('Updating schema: Linking ration_shops to users...');

        // Add user_id column to ration_shops
        await pool.query(`
            ALTER TABLE ration_shops 
            ADD COLUMN IF NOT EXISTS user_id INT REFERENCES users(user_id) ON DELETE SET NULL;
        `);

        console.log('Added user_id column to ration_shops.');
    } catch (error) {
        console.error('Error updating schema:', error);
    } finally {
        await pool.end();
    }
};

if (require.main === module) {
    linkShopToUser();
}
