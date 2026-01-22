const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

const createAdmin = async () => {
    const args = process.argv.slice(2);
    if (args.length < 3) {
        console.log('Usage: node src/scripts/createAdmin.js <username> <email> <password>');
        process.exit(1);
    }

    const [username, email, password] = args;

    try {
        console.log(`Creating admin user: ${username} (${email})...`);

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insert into DB
        const query = `
            INSERT INTO users (username, email, password, role)
            VALUES ($1, $2, $3, 'ADMIN')
            RETURNING user_id, username, email, role, created_at;
        `;

        const res = await pool.query(query, [username, email, hashedPassword]);

        console.log('Admin user created successfully:');
        console.log(res.rows[0]);

    } catch (error) {
        if (error.code === '23505') { // Unique violation
            console.error('Error: Username or Email already exists.');
        } else {
            console.error('Error creating admin:', error);
        }
    } finally {
        await pool.end();
    }
};

if (require.main === module) {
    createAdmin();
}
