-- =============================================================================
-- IFE APP — Migration SQL (DBA Reviewed)
-- Schema:  ife_app
-- Tables:  report_order, report_order_instrument
-- Author:  IFE Development Team
-- Notes:   Safe to re-run — all statements use IF NOT EXISTS / IF EXISTS guards
--          Naming convention:
--            _id   = surrogate key identifier
--            _cd   = categorical code / enum value
--            _ind  = indicator / boolean flag (SMALLINT 0|1)
--            _dt   = calendar date (DATE)
--            _ts   = point in time (TIMESTAMP)
--            _nbr  = numeric count or ordinal
--            _nm   = descriptive name or label
-- =============================================================================


-- =============================================================================
-- SECTION 1 — report_order: ADD new columns
--
-- Existing columns (DO NOT ALTER):
--   report_order_id, report_type_id, issuer_code, user_id,
--   report_date, reference_code, created_at
-- =============================================================================

ALTER TABLE ife_app.report_order

    -- Order classification
    ADD COLUMN IF NOT EXISTS order_type_cd        VARCHAR(20)
        CHECK (order_type_cd IN ('ONE_TIME', 'RECURRING')),

    ADD COLUMN IF NOT EXISTS report_format_cd     VARCHAR(20)
        CHECK (report_format_cd IN ('FULL', 'SUMMARY')),

    -- Recurring: delivery schedule
    ADD COLUMN IF NOT EXISTS report_frequency_cd  VARCHAR(20)
        CHECK (report_frequency_cd IN ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY')),

    ADD COLUMN IF NOT EXISTS order_start_dt       DATE,

    -- WEEKLY schedule
    -- weekly_interval_nbr: deliver every N weeks (1 = every week, 2 = fortnightly)
    ADD COLUMN IF NOT EXISTS weekly_interval_nbr  SMALLINT
        CHECK (weekly_interval_nbr >= 1),

    -- weekly_day_of_week_nbr: ISO 8601 (1=Monday ... 7=Sunday)
    ADD COLUMN IF NOT EXISTS weekly_day_of_week_nbr SMALLINT
        CHECK (weekly_day_of_week_nbr BETWEEN 1 AND 7),

    -- weekly_day_cd: generated from weekly_day_of_week_nbr — do not set manually
    ADD COLUMN IF NOT EXISTS weekly_day_cd        TEXT GENERATED ALWAYS AS (
        CASE weekly_day_of_week_nbr
            WHEN 1 THEN 'MON'
            WHEN 2 THEN 'TUE'
            WHEN 3 THEN 'WED'
            WHEN 4 THEN 'THU'
            WHEN 5 THEN 'FRI'
            WHEN 6 THEN 'SAT'
            WHEN 7 THEN 'SUN'
        END
    ) STORED,

    -- MONTHLY schedule
    -- monthly_interval_nbr: deliver every N months (1=monthly, 3=quarterly, 6=biannual)
    ADD COLUMN IF NOT EXISTS monthly_interval_nbr SMALLINT
        CHECK (monthly_interval_nbr >= 1),

    -- monthly_day_of_month_nbr: day within the month (1-31)
    --   Ignored when monthly_last_day_ind = 1
    ADD COLUMN IF NOT EXISTS monthly_day_of_month_nbr SMALLINT
        CHECK (monthly_day_of_month_nbr BETWEEN 1 AND 31),

    -- monthly_last_day_ind: 1 = deliver on the last day of the month
    --   Corresponds to the "+ last" toggle in the subscription UI
    ADD COLUMN IF NOT EXISTS monthly_last_day_ind SMALLINT DEFAULT 0
        CHECK (monthly_last_day_ind IN (0, 1)),

    -- YEARLY schedule
    ADD COLUMN IF NOT EXISTS yearly_month_nbr     SMALLINT
        CHECK (yearly_month_nbr BETWEEN 1 AND 12),

    ADD COLUMN IF NOT EXISTS yearly_day_nbr       SMALLINT
        CHECK (yearly_day_nbr BETWEEN 1 AND 31),

    -- Order lifecycle status
    ADD COLUMN IF NOT EXISTS order_status_cd      VARCHAR(20)
        CHECK (order_status_cd IN ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED')),

    -- Timestamp of the most recent status transition
    ADD COLUMN IF NOT EXISTS status_updated_ts    TIMESTAMP;


-- =============================================================================
-- SECTION 2 — report_order_instrument: REPLACE old column, ADD book_entry_type_cd
--
-- Existing columns (DO NOT ALTER):
--   report_order_instrument_id, report_order_id, security_code
-- =============================================================================

-- Remove the old generic integer column added in a prior migration
ALTER TABLE ife_app.report_order_instrument
    DROP COLUMN IF EXISTS book_entry_type_id;

-- Remove any isDiscontinuedSelected column if it exists on report_order
ALTER TABLE ife_app.report_order
    DROP COLUMN IF EXISTS isDiscontinuedSelected;

-- Add typed, constrained column
-- One row per selected share class per order
-- book_entry_type_cd = REGULAR   → active / current share class
-- book_entry_type_cd = DISCONTINUED → expired / delisted share class
ALTER TABLE ife_app.report_order_instrument
    ADD COLUMN IF NOT EXISTS book_entry_type_cd VARCHAR(20) NOT NULL DEFAULT 'REGULAR'
        CHECK (book_entry_type_cd IN ('REGULAR', 'DISCONTINUED'));


-- =============================================================================
-- SECTION 3 — COLUMN COMMENTS (documentation for DBAs and developers)
-- =============================================================================

-- report_order
COMMENT ON COLUMN ife_app.report_order.order_type_cd
    IS 'Classification of order: ONE_TIME = single delivery, RECURRING = scheduled repeating delivery';

COMMENT ON COLUMN ife_app.report_order.report_format_cd
    IS 'Delivery content format: FULL = complete shareholder report, SUMMARY = aggregated data only';

COMMENT ON COLUMN ife_app.report_order.report_frequency_cd
    IS 'Recurring delivery cadence: DAILY | WEEKLY | MONTHLY | YEARLY';

COMMENT ON COLUMN ife_app.report_order.order_start_dt
    IS 'Calendar date from which recurring deliveries begin. Set by subscriber at order creation.';

COMMENT ON COLUMN ife_app.report_order.weekly_interval_nbr
    IS 'Delivery recurrence in weeks. 1 = every week, 2 = every 2 weeks. Applies when report_frequency_cd = WEEKLY.';

COMMENT ON COLUMN ife_app.report_order.weekly_day_of_week_nbr
    IS 'ISO 8601 weekday number: 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday, 7=Sunday.';

COMMENT ON COLUMN ife_app.report_order.weekly_day_cd
    IS 'Generated column derived from weekly_day_of_week_nbr. Values: MON | TUE | WED | THU | FRI | SAT | SUN.';

COMMENT ON COLUMN ife_app.report_order.monthly_interval_nbr
    IS 'Delivery recurrence in months. 1=monthly, 3=quarterly, 6=biannual, 12=annual. Applies when report_frequency_cd = MONTHLY.';

COMMENT ON COLUMN ife_app.report_order.monthly_day_of_month_nbr
    IS 'Day of month on which delivery occurs (1-31). Ignored when monthly_last_day_ind = 1.';

COMMENT ON COLUMN ife_app.report_order.monthly_last_day_ind
    IS 'Indicator: 0 = deliver on monthly_day_of_month_nbr, 1 = deliver on last calendar day of the month.';

COMMENT ON COLUMN ife_app.report_order.yearly_month_nbr
    IS 'Month of year for annual delivery (1=January ... 12=December). Applies when report_frequency_cd = YEARLY.';

COMMENT ON COLUMN ife_app.report_order.yearly_day_nbr
    IS 'Day within yearly_month_nbr for annual delivery (1-31).';

COMMENT ON COLUMN ife_app.report_order.order_status_cd
    IS 'Order lifecycle status: PENDING = awaiting user confirmation, RUNNING = active and scheduled, COMPLETED = all deliveries done, FAILED = processing error.';

COMMENT ON COLUMN ife_app.report_order.status_updated_ts
    IS 'Timestamp of the most recent transition of order_status_cd.';

-- report_order_instrument
COMMENT ON COLUMN ife_app.report_order_instrument.book_entry_type_cd
    IS 'Classification of the selected share class: REGULAR = active/current, DISCONTINUED = expired/delisted.';


-- =============================================================================
-- SECTION 4 — VERIFICATION
-- Run after migration. Compare output against expected structure below.
-- =============================================================================

SELECT
    ordinal_position      AS pos,
    column_name,
    data_type,
    character_maximum_length  AS char_len,
    numeric_precision,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'ife_app'
  AND table_name   IN ('report_order', 'report_order_instrument')
ORDER BY table_name, ordinal_position;


-- =============================================================================
-- EXPECTED FINAL STRUCTURE
-- =============================================================================

-- ife_app.report_order
-- ┌──────────────────────────┬─────────────┬──────────────────────────────────────────┐
-- │ column_name              │ data_type   │ description                              │
-- ├──────────────────────────┼─────────────┼──────────────────────────────────────────┤
-- │ report_order_id          │ bigint      │ PK — auto-increment              existing │
-- │ report_type_id           │ integer     │ FK → report type                 existing │
-- │ issuer_code              │ integer     │ issuer identifier                existing │
-- │ user_id                  │ varchar     │ ordering user                    existing │
-- │ report_date              │ timestamp   │ situation date (one-time)        existing │
-- │ reference_code           │ varchar     │ optional order reference         existing │
-- │ created_at               │ timestamp   │ record creation time             existing │
-- │ order_type_cd            │ varchar(20) │ ONE_TIME | RECURRING                 NEW │
-- │ report_format_cd         │ varchar(20) │ FULL | SUMMARY                       NEW │
-- │ report_frequency_cd      │ varchar(20) │ DAILY|WEEKLY|MONTHLY|YEARLY          NEW │
-- │ order_start_dt           │ date        │ subscription start date              NEW │
-- │ weekly_interval_nbr      │ smallint    │ every N weeks                        NEW │
-- │ weekly_day_of_week_nbr   │ smallint    │ 1=Mon .. 7=Sun (ISO 8601)            NEW │
-- │ weekly_day_cd            │ text        │ GENERATED: MON|TUE|..|SUN            NEW │
-- │ monthly_interval_nbr     │ smallint    │ every N months                       NEW │
-- │ monthly_day_of_month_nbr │ smallint    │ 1-31                                 NEW │
-- │ monthly_last_day_ind     │ smallint    │ 0|1 — last day of month flag         NEW │
-- │ yearly_month_nbr         │ smallint    │ 1-12                                 NEW │
-- │ yearly_day_nbr           │ smallint    │ 1-31                                 NEW │
-- │ order_status_cd          │ varchar(20) │ PENDING|RUNNING|COMPLETED|FAILED     NEW │
-- │ status_updated_ts        │ timestamp   │ last status change timestamp         NEW │
-- └──────────────────────────┴─────────────┴──────────────────────────────────────────┘

-- ife_app.report_order_instrument
-- ┌──────────────────────────────┬─────────────┬──────────────────────────────────────┐
-- │ column_name                  │ data_type   │ description                          │
-- ├──────────────────────────────┼─────────────┼──────────────────────────────────────┤
-- │ report_order_instrument_id   │ integer     │ PK — auto-increment          existing │
-- │ report_order_id              │ integer     │ FK → report_order            existing │
-- │ security_code                │ bigint      │ share class identifier       existing │
-- │ book_entry_type_cd           │ varchar(20) │ REGULAR | DISCONTINUED           NEW │
-- └──────────────────────────────┴─────────────┴──────────────────────────────────────┘

-- EXAMPLE DATA — report_order_instrument:
--
--  report_order_instrument_id │ report_order_id │ security_code │ book_entry_type_cd
-- ────────────────────────────┼─────────────────┼───────────────┼───────────────────
--                           1 │               1 │        900001 │ REGULAR
--                           2 │               1 │        900002 │ REGULAR
--                           3 │               1 │        900010 │ DISCONTINUED
