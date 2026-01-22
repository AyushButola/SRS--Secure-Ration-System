const fs = require('fs');
const path = require('path');
const { pool } = require('./db');

const initializeSchema = async () => {
    try {
        const schemaPath = path.join(__dirname, '../models/schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        await pool.query(schemaSql);
        console.log('Database schema ensured.');
    } catch (error) {
        console.error('Error initializing database schema:', error);
        throw error; // Re-throw to handle in caller
    }
};

module.exports = initializeSchema;
