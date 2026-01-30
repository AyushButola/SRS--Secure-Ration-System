const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const executeSqlFile = async (filename) => {
  try {
    const filePath = path.join(__dirname, filename);
    const sql = fs.readFileSync(filePath, 'utf8');
    console.log(`Executing ${filename}...`);
    await pool.query(sql);
    console.log(`✅ ${filename} executed successfully.`);
  } catch (error) {
    console.error(`❌ Error executing ${filename}:`, error);
    throw error;
  }
};

const initSchema = () => executeSqlFile('schema.sql');
const seedData = () => executeSqlFile('seed.sql');

module.exports = {
  query: (text, params) => pool.query(text, params),
  initSchema,
  seedData,
  pool
};
