-- 1. beneficiaries
CREATE TABLE IF NOT EXISTS beneficiaries (
    beneficiary_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT, -- BPL, AAY
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. ration_shops
CREATE TABLE IF NOT EXISTS ration_shops (
    shop_id TEXT PRIMARY KEY,
    shop_name TEXT NOT NULL,
    location TEXT,
    device_id TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. ration_items (Stock)
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
    commodity TEXT NOT NULL,
    max_quantity FLOAT NOT NULL,
    consumed_quantity FLOAT DEFAULT 0,
    max_offline_txn INT DEFAULT 1,
    offline_txn_used INT DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. transactions
CREATE TABLE IF NOT EXISTS transactions (
    txn_id TEXT PRIMARY KEY,
    beneficiary_id TEXT REFERENCES beneficiaries(beneficiary_id),
    shop_id TEXT REFERENCES ration_shops(shop_id),
    ration_period TEXT,
    commodity TEXT,
    quantity FLOAT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    prev_hash TEXT,
    hash TEXT,
    synced BOOLEAN DEFAULT FALSE,
    status TEXT -- VALID, DUPLICATE, FLAGGED
);

-- 6. ledger_state
CREATE TABLE IF NOT EXISTS ledger_state (
    scope_id TEXT PRIMARY KEY, -- 'GLOBAL' or shop_id
    last_hash TEXT,
    last_txn_id TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. conflicts
CREATE TABLE IF NOT EXISTS conflicts (
    conflict_id TEXT PRIMARY KEY,
    txn_id TEXT REFERENCES transactions(txn_id),
    beneficiary_id TEXT REFERENCES beneficiaries(beneficiary_id),
    conflict_type TEXT, -- DUPLICATE / HASH_MISMATCH
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved BOOLEAN DEFAULT FALSE
);

-- 8. sync_logs
CREATE TABLE IF NOT EXISTS sync_logs (
    sync_id TEXT PRIMARY KEY,
    device_id TEXT,
    synced_count INT,
    failed_count INT,
    synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
