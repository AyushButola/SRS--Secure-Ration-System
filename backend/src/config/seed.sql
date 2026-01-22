-- Seed Ration Shop
INSERT INTO ration_shops (shop_id, shop_name, location, device_id)
VALUES 
('SHOP_001', 'Fair Price Shop #1', 'Village A', 'DEV_12345')
ON CONFLICT (shop_id) DO NOTHING;

-- Seed Stock for Shop
INSERT INTO ration_items (shop_id, remaining_rice_amount, remaining_wheat_amount, remaining_sugar_amount)
VALUES
('SHOP_001', 500.0, 300.0, 50.0)
ON CONFLICT (shop_id) DO NOTHING;

-- Seed Beneficiaries
INSERT INTO beneficiaries (beneficiary_id, name, category, active)
VALUES
('BEN_001', 'Ramesh Kumar', 'BPL', TRUE),
('BEN_002', 'Sita Devi', 'AAY', TRUE)
ON CONFLICT (beneficiary_id) DO NOTHING;

-- Seed Entitlements (Jan 2026)
INSERT INTO entitlements (entitlement_id, beneficiary_id, ration_period, commodity, max_quantity)
VALUES
('ENT_001_RICE', 'BEN_001', '2026-01', 'RICE', 5.0),
('ENT_001_WHEAT', 'BEN_001', '2026-01', 'WHEAT', 3.0),
('ENT_002_RICE', 'BEN_002', '2026-01', 'RICE', 35.0)
ON CONFLICT (entitlement_id) DO NOTHING;

-- Initialize Ledger State
INSERT INTO ledger_state (scope_id, last_hash, last_txn_id)
VALUES
('GLOBAL', 'GENESIS_HASH', '0')
ON CONFLICT (scope_id) DO NOTHING;
