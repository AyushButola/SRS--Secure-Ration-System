-- Seed Ration Shop (Password: password123)
INSERT INTO ration_shops (shop_id, shop_name, location, device_id, password_hash)
VALUES 
('SHOP_001', 'Fair Price Shop #1', 'Village A', 'DEV_12345', '$2b$10$9XHVTG1gs6w2DtJ5cjGs9uVRc7XaW9fP1Uh6Y9gG6OzFHnvi153tW')
ON CONFLICT (shop_id) DO NOTHING;

-- Seed Admins (Password: password123)
INSERT INTO admins (username, password_hash)
VALUES
('admin', '$2b$10$9XHVTG1gs6w2DtJ5cjGs9uVRc7XaW9fP1Uh6Y9gG6OzFHnvi153tW')
ON CONFLICT (username) DO NOTHING;

-- Seed Stock for Shop
INSERT INTO ration_items (shop_id, remaining_rice_amount, remaining_wheat_amount, remaining_sugar_amount)
VALUES
('SHOP_001', 500.0, 300.0, 50.0)
ON CONFLICT (shop_id) DO NOTHING;

-- Seed Beneficiaries
INSERT INTO beneficiaries (beneficiary_id, name, category, password_hash, active)
VALUES
('BEN_001', 'Ramesh Kumar', 'BPL', '$2b$10$9XHVTG1gs6w2DtJ5cjGs9uVRc7XaW9fP1Uh6Y9gG6OzFHnvi153tW', TRUE),
('BEN_002', 'Sita Devi', 'AAY', '$2b$10$9XHVTG1gs6w2DtJ5cjGs9uVRc7XaW9fP1Uh6Y9gG6OzFHnvi153tW', TRUE)
ON CONFLICT (beneficiary_id) DO UPDATE 
SET password_hash = EXCLUDED.password_hash, active = EXCLUDED.active;

-- Seed Entitlements (Jan 2026)
INSERT INTO entitlements (entitlement_id, beneficiary_id, ration_period, commodity, max_quantity, max_offline_txn)
VALUES
('ENT_001_RICE', 'BEN_001', '2026-01', 'RICE', 50.0, 1),
('ENT_001_WHEAT', 'BEN_001', '2026-01', 'WHEAT', 30.0, 1),
('ENT_002_RICE', 'BEN_002', '2026-01', 'RICE', 35.0, 1)
ON CONFLICT (entitlement_id) DO UPDATE 
SET max_quantity = EXCLUDED.max_quantity, max_offline_txn = EXCLUDED.max_offline_txn;

-- Initialize Ledger State
INSERT INTO ledger_state (scope_id, last_hash, last_txn_id)
VALUES
('GLOBAL', 'GENESIS_HASH', '0')
ON CONFLICT (scope_id) DO NOTHING;
