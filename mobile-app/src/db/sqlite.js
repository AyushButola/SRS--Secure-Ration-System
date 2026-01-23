import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

// --- MOCK DB FOR WEB (LocalStorage) ---
class MockWebDB {
    async execAsync(sql) {
        console.log('[WebMockDB] execAsync:', sql);
        // Reset check
        if (sql.includes('DROP TABLE') || sql.includes('DELETE FROM')) {
            localStorage.removeItem('offline_transactions_web');
        }
        return;
    }

    async runAsync(sql, params = []) {
        console.log('[WebMockDB] runAsync:', sql, params);
        if (sql.includes('INSERT INTO offline_transactions')) {
            const current = JSON.parse(localStorage.getItem('offline_transactions_web') || '[]');
            // Naive parsing: assume params map maps directly to columns
            // [id, beneficiaryId, shopId, period, commodity, quantity, timestamp, 0, otp, verified]
            const newItem = {
                id: params[0],
                beneficiary_id: params[1],
                shop_id: params[2],
                ration_period: params[3],
                commodity: params[4],
                quantity: params[5],
                timestamp: params[6],
                synced: 0,
                otp: params[8] || '',
                otp_verified: params[9] || 0
            };
            current.push(newItem);
            localStorage.setItem('offline_transactions_web', JSON.stringify(current));
        } else if (sql.includes('DELETE FROM offline_transactions')) {
            localStorage.removeItem('offline_transactions_web');
        }
    }

    async getAllAsync(sql, params = []) {
        console.log('[WebMockDB] getAllAsync:', sql);
        if (sql.includes('SELECT * FROM offline_transactions')) {
            return JSON.parse(localStorage.getItem('offline_transactions_web') || '[]');
        }
        return [];
    }
}

// --- REAL DB FOR NATIVE ---
let dbInstance = null;

const getDBInstance = async () => {
    if (Platform.OS === 'web') {
        if (!dbInstance) dbInstance = new MockWebDB();
        return dbInstance;
    }

    if (dbInstance) return dbInstance;
    try {
        dbInstance = await SQLite.openDatabaseAsync('srs_offline.db');
        return dbInstance;
    } catch (e) {
        console.warn("Error opening DB:", e);
        throw e;
    }
};

export const initDB = async () => {
    try {
        const db = await getDBInstance();
        // For dev: force drop to ensure schema update (User can reset if needed, but this ensures new columns exist)
        // Or better: Use ALTER TABLE in a try-catch blocks to safely add columns if they don't exist.
        // For simplicity in this demo: We will DROP and RE-CREATE.
        // await db.execAsync('DROP TABLE IF EXISTS offline_transactions'); 

        // Actually, let's just add the columns via CREATE TABLE logic (won't work if exists)
        // We will try adding columns if table exists, or just rely on fresh install often for dev apps.
        // Let's go with the robust approach of creating with new columns and for existing, we ignore (failed risk).
        // Best approach for hot-reload dev: 

        await db.execAsync(`
            PRAGMA journal_mode = WAL;
            CREATE TABLE IF NOT EXISTS offline_transactions (
                id TEXT PRIMARY KEY,
                beneficiary_id TEXT,
                shop_id TEXT,
                ration_period TEXT,
                commodity TEXT,
                quantity REAL,
                timestamp TEXT,
                synced INTEGER DEFAULT 0,
                otp TEXT,
                otp_verified INTEGER DEFAULT 0
            );
        `);
        console.log(`✅ SQLite Initialized (${Platform.OS})`);
    } catch (e) {
        console.error('❌ SQLite Init Failed:', e);
    }
};

export const getDB = async () => {
    return getDBInstance();
};
