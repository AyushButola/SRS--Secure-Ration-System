const db = require('./src/config/db');

const init = async () => {
    console.log('--- Starting System Initialization ---');
    try {
        await db.initSchema();
        await db.seedData();
        console.log('--- Initialization Complete ---');
    } catch (e) {
        console.error('Initialization Failed:', e);
    } finally {
        process.exit();
    }
};

init();
