import * as SQLite from 'expo-sqlite';

const dbPromise = SQLite.openDatabaseAsync('srs_offline.db');

export const initDB = async () => {
    const db = await dbPromise;
    try {
        await db.execAsync(`
            PRAGMA journal_mode = WAL;
            
            -- Offline Transaction Queue
            CREATE TABLE IF NOT EXISTS offline_transactions (
                id TEXT PRIMARY KEY, -- UUID
                beneficiary_id TEXT,
                shop_id TEXT,
                ration_period TEXT,
                commodity TEXT,
                quantity REAL,
                timestamp TEXT,
                synced INTEGER DEFAULT 0
            );

            -- Cached Beneficiaries (Optional)
            CREATE TABLE IF NOT EXISTS cached_beneficiaries (
                id TEXT PRIMARY KEY,
                name TEXT,
                data TEXT -- JSON string of entitlements
            );
        `);
        console.log('✅ SQLite Initialized');
    } catch (e) {
        console.error('❌ SQLite Init Failed:', e);
    }
};

export const getDB = () => dbPromise;
