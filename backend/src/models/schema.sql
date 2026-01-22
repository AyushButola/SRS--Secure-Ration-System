-- 0. users (Moved from db.js & Updated)
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role TEXT DEFAULT 'SHOP_OWNER', -- ADMIN / SHOP_OWNER
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 1. beneficiaries
CREATE TABLE IF NOT EXISTS beneficiaries (
    beneficiary_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL, -- BPL / AAY / PHH etc.
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. ration_shops
CREATE TABLE IF NOT EXISTS ration_shops (
    shop_id TEXT PRIMARY KEY,
    shop_name TEXT NOT NULL,
    location TEXT NOT NULL,
    device_id TEXT,
    status TEXT DEFAULT 'PENDING', -- PENDING / APPROVED / REJECTED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. ration_items (One shop has many items, typically fixed commodity types, but here modeled as columns per shop based on request or one-to-one stock record)
-- Based on user request: "One shop has exactly one stock record" with columns for specific items.
CREATE TABLE IF NOT EXISTS ration_items (
    shop_id TEXT PRIMARY KEY REFERENCES ration_shops(shop_id),
    remaining_rice_amount FLOAT DEFAULT 0,
    remaining_wheat_amount FLOAT DEFAULT 0,
    remaining_sugar_amount FLOAT DEFAULT 0,
    remaining_kerosene_amount FLOAT DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. entitlements
CREATE TABLE IF NOT EXISTS entitlements (
    entitlement_id TEXT PRIMARY KEY,
    beneficiary_id TEXT REFERENCES beneficiaries(beneficiary_id),
    ration_period TEXT NOT NULL, -- e.g., '2026-01'
    commodity TEXT NOT NULL, -- Rice / Wheat / Sugar / Kerosene
    max_quantity FLOAT NOT NULL,
    consumed_quantity FLOAT DEFAULT 0,
    max_offline_txn INT DEFAULT 1, -- Default limit for offline txns
    offline_txn_used INT DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. transactions
CREATE TABLE IF NOT EXISTS transactions (
    txn_id TEXT PRIMARY KEY, -- UUID
    beneficiary_id TEXT REFERENCES beneficiaries(beneficiary_id),
    shop_id TEXT REFERENCES ration_shops(shop_id),
    ration_period TEXT NOT NULL,
    commodity TEXT NOT NULL,
    quantity FLOAT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    prev_hash TEXT NOT NULL,
    hash TEXT NOT NULL,
    synced BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'VALID' -- VALID / DUPLICATE / FLAGGED
);

-- 6. ledger_state
CREATE TABLE IF NOT EXISTS ledger_state (
    scope_id TEXT PRIMARY KEY, -- Shop ID or 'SYSTEM' for global
    last_hash TEXT NOT NULL,
    last_txn_id TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. conflicts
CREATE TABLE IF NOT EXISTS conflicts (
    conflict_id TEXT PRIMARY KEY,
    txn_id TEXT, -- Can be null if conflict is about a non-existent txn
    beneficiary_id TEXT,
    conflict_type TEXT NOT NULL, -- DUPLICATE / HASH_MISMATCH
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved BOOLEAN DEFAULT FALSE
);

-- 8. sync_logs
CREATE TABLE IF NOT EXISTS sync_logs (
    sync_id TEXT PRIMARY KEY,
    device_id TEXT,
    synced_count INT DEFAULT 0,
    failed_count INT DEFAULT 0,
    synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
