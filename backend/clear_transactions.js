const db = require('./src/config/db');

const clearData = async () => {
    try {
        console.log('Clearing transactional data...');

        // Clearing tables that contain activity data.
        // Using CASCADE to ensure dependent rows (if any remaining) are removed.
        // We preserve 'beneficiaries', 'ration_shops', 'ration_items', 'entitlements', 'admins' 
        // as those are considered setup/master data.

        // Note: 'ration_items' (Stock) and 'entitlements' might be considered transactional in some contexts,
        // but usually we want to keep the stock levels and entitlement definitions for testing. 
        // If we wanted to reset stock, we'd UPDATE it, not TRUNCATE. 
        // For now, removing only the "history" of what happened.

        const tables = [
            'transactions',
            'conflicts',
            'otp_codes',
            'sync_logs',
            'ledger_state'
        ];

        // Construct TRUNCATE command
        // TRUNCATE is faster than DELETE and resets identity columns (like serial IDs)
        await db.query(`TRUNCATE TABLE ${tables.join(', ')} CASCADE`);

        console.log('✅ All transactional records cleared successfully.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error clearing data:', err);
        process.exit(1);
    }
};

clearData();
