-- ============================================================
-- OIS Portal — Schema Fix + Seed Data
-- Database: postgres@localhost / schema: ife_app
-- Run in IntelliJ Database console
-- ============================================================


-- ============================================================
-- STEP 1: ADD report_type_id COLUMN TO report_order
-- ============================================================
ALTER TABLE ife_app.report_order
    ADD COLUMN IF NOT EXISTS report_type_id INT;

-- Add foreign key constraint
ALTER TABLE ife_app.report_order
    ADD CONSTRAINT fk_report_order_report_type
    FOREIGN KEY (report_type_id)
    REFERENCES ife_app.report_type(report_type_id);

-- Update existing rows (link existing orders to SHAREHOLDER_PUBLIC as default)
UPDATE ife_app.report_order
SET report_type_id = 2
WHERE report_type_id IS NULL;

-- Now make it NOT NULL for future inserts
ALTER TABLE ife_app.report_order
    ALTER COLUMN report_type_id SET NOT NULL;


-- ============================================================
-- STEP 2: ADD MISSING REPORT TYPES (5 exist, need 7)
-- ============================================================
INSERT INTO ife_app.report_type (report_type, report_grouping) VALUES
    ('SECTOR_DISTRIBUTION', 6),
    ('OWNERSHIP_DISTRIBUTION', 7)
ON CONFLICT (report_grouping) DO NOTHING;


-- ============================================================
-- STEP 3: INSERT REPORT ORDERS (9 new orders, 3 per type)
-- ============================================================

-- Liikkeeseenlaskijan osakasluettelo (report_type_id = 1)
INSERT INTO ife_app.report_order (report_type_id, organization_id, user_id, report_date, reference_code, created_at) VALUES
    (1, 1234567, 'demo_user', '2026-01-24 00:00:00', NULL, NOW()),
    (1, 1234567, 'demo_user', '2025-11-01 00:00:00', NULL, NOW()),
    (1, 1234567, 'demo_user', '2025-12-11 00:00:00', 'REF9876543210', NOW());

-- Julkinen osakasluettelo (report_type_id = 2)
INSERT INTO ife_app.report_order (report_type_id, organization_id, user_id, report_date, reference_code, created_at) VALUES
    (2, 1234567, 'demo_user', '2026-01-24 00:00:00', NULL, NOW()),
    (2, 1234567, 'demo_user', '2025-11-01 00:00:00', NULL, NOW()),
    (2, 1234567, 'demo_user', '2025-10-01 00:00:00', NULL, NOW());

-- Osakaspoiminta / SHAREHOLDER_CUSTOM (report_type_id = 3)
INSERT INTO ife_app.report_order (report_type_id, organization_id, user_id, report_date, reference_code, created_at) VALUES
    (3, 1234567, 'demo_user', '2026-01-24 00:00:00', NULL, NOW()),
    (3, 1234567, 'demo_user', '2025-11-01 00:00:00', NULL, NOW()),
    (3, 1234567, 'demo_user', '2025-10-01 00:00:00', NULL, NOW());


-- ============================================================
-- STEP 4: LINK NEW ORDERS TO INSTRUMENTS
-- ============================================================
INSERT INTO ife_app.report_order_instrument (report_order_id, security_id)
SELECT report_order_id, 1
FROM ife_app.report_order
WHERE user_id = 'demo_user'
  AND report_order_id NOT IN (SELECT report_order_id FROM ife_app.report_order_instrument);


-- ============================================================
-- VERIFICATION
-- ============================================================

-- Check report_order now has report_type_id
SELECT ro.report_order_id, rt.report_type, ro.report_type_id,
       ro.organization_id, ro.user_id, ro.report_date, ro.reference_code
FROM ife_app.report_order ro
JOIN ife_app.report_type rt ON ro.report_type_id = rt.report_type_id
ORDER BY rt.report_type, ro.report_date DESC;

-- Row counts
SELECT 'report_type' AS tbl, COUNT(*) AS cnt FROM ife_app.report_type
UNION ALL
SELECT 'report_order', COUNT(*) FROM ife_app.report_order
UNION ALL
SELECT 'report_order_instrument', COUNT(*) FROM ife_app.report_order_instrument;
