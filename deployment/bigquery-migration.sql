-- ============================================================================
-- BigQuery Migration Script: Cookie Consent Logs
-- ============================================================================
-- Purpose: Migrate from unpartitioned table to partitioned table with clustering
-- Version: 2.4
-- Date: 2026-02-02
-- ============================================================================

-- STEP 1: Create new partitioned table
-- ============================================================================
CREATE TABLE `polwell-data-warehouse.consentmanager.logs_v2`
(
  -- Event information
  event STRING OPTIONS(description="Event type: consent_modal_view, accept, update"),
  consent_id STRING OPTIONS(description="Unique consent ID (UUID)"),
  accept_type STRING OPTIONS(description="Accept type: all, necessary, custom"),
  
  -- Categories
  accepted_categories STRING OPTIONS(description="Comma-separated accepted categories"),
  rejected_categories STRING OPTIONS(description="Comma-separated rejected categories"),
  
  -- GA4 Integration
  ga4_client_id STRING OPTIONS(description="Google Analytics 4 Client ID"),
  ga4_session_id STRING OPTIONS(description="Google Analytics 4 Session ID"),
  
  -- User context
  user_agent STRING OPTIONS(description="Browser user agent string"),
  hostname STRING OPTIONS(description="Website hostname"),
  page_url STRING OPTIONS(description="Full page URL where consent was given"),
  
  -- Timestamp
  created_at TIMESTAMP OPTIONS(description="Timestamp when consent was logged")
)
PARTITION BY DATE(created_at)
CLUSTER BY hostname, event
OPTIONS(
  description="Cookie consent logs with daily partitioning and 3-year retention",
  partition_expiration_days=1095,  -- 3 years (365 * 3)
  require_partition_filter=true    -- Force partition filter in queries for cost optimization
);

-- STEP 2: Copy data from old table to new table
-- ============================================================================
-- This will copy all existing data, excluding the 'id' field
INSERT INTO `polwell-data-warehouse.consentmanager.logs_v2`
(
  event,
  consent_id,
  accept_type,
  accepted_categories,
  rejected_categories,
  ga4_client_id,
  ga4_session_id,
  user_agent,
  hostname,
  page_url,
  created_at
)
SELECT
  event,
  consent_id,
  accept_type,
  accepted_categories,
  rejected_categories,
  ga4_client_id,
  ga4_session_id,
  user_agent,
  hostname,
  page_url,
  created_at
FROM `polwell-data-warehouse.consentmanager.logs`
WHERE created_at IS NOT NULL;  -- Ensure we only copy valid records

-- STEP 3: Verify data migration
-- ============================================================================
-- Check row counts match
SELECT 
  'Old table' as source,
  COUNT(*) as row_count
FROM `polwell-data-warehouse.consentmanager.logs`
UNION ALL
SELECT 
  'New table' as source,
  COUNT(*) as row_count
FROM `polwell-data-warehouse.consentmanager.logs_v2`;

-- Check sample data
SELECT *
FROM `polwell-data-warehouse.consentmanager.logs_v2`
ORDER BY created_at DESC
LIMIT 10;

-- STEP 4: Backup old table (OPTIONAL - recommended)
-- ============================================================================
-- Create backup table before dropping
CREATE TABLE `polwell-data-warehouse.consentmanager.logs_backup`
CLONE `polwell-data-warehouse.consentmanager.logs`;

-- STEP 5: Drop old table
-- ============================================================================
-- WARNING: This will permanently delete the old table
-- Make sure STEP 3 verification passed before running this!
DROP TABLE `polwell-data-warehouse.consentmanager.logs`;

-- STEP 6: Rename new table to original name
-- ============================================================================
ALTER TABLE `polwell-data-warehouse.consentmanager.logs_v2`
RENAME TO logs;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- 1. Check partition information
SELECT
  partition_id,
  total_rows,
  total_logical_bytes / 1024 / 1024 as size_mb
FROM `polwell-data-warehouse.consentmanager.INFORMATION_SCHEMA.PARTITIONS`
WHERE table_name = 'logs'
ORDER BY partition_id DESC
LIMIT 10;

-- 2. Check clustering effectiveness
SELECT
  hostname,
  event,
  COUNT(*) as count
FROM `polwell-data-warehouse.consentmanager.logs`
WHERE DATE(created_at) >= CURRENT_DATE() - 7
GROUP BY hostname, event
ORDER BY count DESC
LIMIT 20;

-- 3. Test query with partition filter (REQUIRED)
SELECT
  event,
  COUNT(*) as count,
  COUNT(DISTINCT consent_id) as unique_consents
FROM `polwell-data-warehouse.consentmanager.logs`
WHERE DATE(created_at) >= CURRENT_DATE() - 30  -- Last 30 days
GROUP BY event
ORDER BY count DESC;

-- ============================================================================
-- EXAMPLE QUERIES FOR ANALYTICS
-- ============================================================================

-- Daily consent statistics
SELECT
  DATE(created_at) as date,
  hostname,
  event,
  COUNT(*) as total_events,
  COUNT(DISTINCT consent_id) as unique_users,
  COUNTIF(ga4_client_id IS NOT NULL) as with_ga4_id
FROM `polwell-data-warehouse.consentmanager.logs`
WHERE DATE(created_at) >= CURRENT_DATE() - 90
GROUP BY date, hostname, event
ORDER BY date DESC, total_events DESC;

-- Acceptance rate by category
SELECT
  hostname,
  accepted_categories,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (PARTITION BY hostname), 2) as percentage
FROM `polwell-data-warehouse.consentmanager.logs`
WHERE DATE(created_at) >= CURRENT_DATE() - 30
  AND event = 'accept'
  AND accepted_categories IS NOT NULL
GROUP BY hostname, accepted_categories
ORDER BY hostname, count DESC;

-- GA4 integration success rate
SELECT
  DATE(created_at) as date,
  COUNT(*) as total_consents,
  COUNTIF(ga4_client_id IS NOT NULL) as with_client_id,
  COUNTIF(ga4_session_id IS NOT NULL) as with_session_id,
  ROUND(COUNTIF(ga4_client_id IS NOT NULL) * 100.0 / COUNT(*), 2) as client_id_capture_rate,
  ROUND(COUNTIF(ga4_session_id IS NOT NULL) * 100.0 / COUNT(*), 2) as session_id_capture_rate
FROM `polwell-data-warehouse.consentmanager.logs`
WHERE DATE(created_at) >= CURRENT_DATE() - 30
  AND event IN ('accept', 'update')
GROUP BY date
ORDER BY date DESC;

-- ============================================================================
-- COST OPTIMIZATION NOTES
-- ============================================================================
-- 
-- 1. ALWAYS use partition filter in WHERE clause:
--    WHERE DATE(created_at) >= '2026-01-01'
--
-- 2. Use clustering columns (hostname, event) in WHERE/GROUP BY for better performance
--
-- 3. Avoid SELECT * - specify only needed columns
--
-- 4. Use LIMIT for exploratory queries
--
-- 5. Expected cost savings:
--    - Without partition: ~$5 per TB scanned
--    - With partition (7 days): ~99% cost reduction
--    - With partition (1 day): ~99.86% cost reduction
--
-- ============================================================================
