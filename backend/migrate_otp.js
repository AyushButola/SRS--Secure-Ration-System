const db = require('./src/config/db');

const migrate = async () => {
    try {
        const client = await db.pool.connect();
        console.log('Connected to DB. Adding columns...');

        try {
            await client.query(`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS offline_otp VARCHAR(10);`);
            await client.query(`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS offline_otp_verified BOOLEAN DEFAULT FALSE;`);
            console.log('Columns added successfully.');
        } catch (err) {
            console.error('Error adding columns:', err.message);
        } finally {
            client.release();
        }
    } catch (err) {
        console.error('Connection failed:', err);
    } finally {
        process.exit();
    }
};

migrate();
