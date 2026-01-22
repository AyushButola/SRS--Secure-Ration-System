const { pool } = require('../config/db');

const updateSchema = async () => {
    try {
        console.log('Running schema updates...');

        // 1. Update ration_shops: Add status column if not exists
        await pool.query(`
            ALTER TABLE ration_shops 
            ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'PENDING';
        `);
        console.log('Updated ration_shops.');

        // 2. Update users: Add role column if not exists
        // Note: The previous table might have been 'users' with 'id' not 'user_id' if created by db.js.
        // We will check and adapt.

        // Check if users table exists
        const userTableCheck = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'role';
        `);

        if (userTableCheck.rows.length === 0) {
            await pool.query(`
                ALTER TABLE users 
                ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'SHOP_OWNER';
            `);
            console.log('Updated users table with role.');
        } else {
            console.log('Users table already has role column.');
        }

        console.log('Schema update complete.');
    } catch (error) {
        console.error('Error updating schema:', error);
    } finally {
        await pool.end();
    }
};

if (require.main === module) {
    updateSchema();
}
