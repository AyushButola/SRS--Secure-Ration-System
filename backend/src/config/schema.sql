-- 1. beneficiaries
CREATE TABLE IF NOT EXISTS beneficiaries (
    beneficiary_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT, -- BPL, AAY
    password_hash TEXT DEFAULT '$2b$10$9XHVTG1gs6w2DtJ5cjGs9uVRc7XaW9fP1Uh6Y9gG6OzFHnvi153tW', -- Default: password123
    mobile_number TEXT,
    aadhaar_last_4 VARCHAR(4),
    trust_score INT DEFAULT 100,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. ration_shops
CREATE TABLE IF NOT EXISTS ration_shops (
    shop_id TEXT PRIMARY KEY,
    shop_name TEXT NOT NULL,
    owner_name TEXT,
    license_number TEXT,
    location TEXT,
    device_id TEXT,
    mobile_number TEXT,
    trust_score INT DEFAULT 100,
    password_hash TEXT NOT NULL DEFAULT 'placeholder',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Admin Table (New)
CREATE TABLE IF NOT EXISTS admins (
    admin_id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
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
    status VARCHAR(20) DEFAULT 'VALID',
    synced BOOLEAN DEFAULT FALSE,
    offline_otp VARCHAR(10),
    offline_otp_verified BOOLEAN DEFAULT FALSE
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

-- 9. otp_codes
CREATE TABLE IF NOT EXISTS otp_codes (
    otp_id SERIAL PRIMARY KEY,
    beneficiary_id TEXT REFERENCES beneficiaries(beneficiary_id),
    otp_code TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '5 minutes'),
    used BOOLEAN DEFAULT FALSE
);
