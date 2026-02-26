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

-- Sprawdź jakie eventy masz
SELECT 
  event,
  COUNT(*) as count
FROM `polwell-data-warehouse.consentmanager.logs`
WHERE DATE(created_at) >= CURRENT_DATE() - 90
GROUP BY event
ORDER BY count DESC;
 
-- Sprawdź najnowsze rekordy
SELECT 
  created_at,
  event,
  hostname,
  accepted_categories
FROM `polwell-data-warehouse.consentmanager.logs`
WHERE DATE(created_at) >= CURRENT_DATE() - 90
ORDER BY created_at DESC
LIMIT 20;
 
-- Sprawdź czy masz jakiekolwiek dane
SELECT 
  COUNT(*) as total_rows,
  MIN(created_at) as oldest,
  MAX(created_at) as newest
FROM `polwell-data-warehouse.consentmanager.logs`
WHERE DATE(created_at) >= '2020-01-01';





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
