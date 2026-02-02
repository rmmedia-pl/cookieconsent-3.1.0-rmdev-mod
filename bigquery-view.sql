-- ============================================================================
-- BigQuery View for Looker Studio Analytics
-- ============================================================================
-- Purpose: Single comprehensive view with all consent analytics metrics
-- Version: 2.4
-- Date: 2026-02-02
-- ============================================================================

-- ============================================================================
-- VIEW: Consent Analytics (All-in-One)
-- ============================================================================
-- Comprehensive view combining funnel, accept types, categories, and GA4
-- Grouped by date and hostname
-- Single data source for all Looker Studio dashboards
-- ============================================================================

CREATE OR REPLACE VIEW `polwell-data-warehouse.consentmanager.cc_logs_stats` AS
WITH category_parsing AS (
  SELECT
    DATE(created_at) as date,
    hostname,
    event,
    accept_type,
    accepted_categories,
    consent_id,
    ga4_client_id,
    ga4_session_id,
    -- Parse individual categories
    REGEXP_CONTAINS(accepted_categories, r'\banalytics\b') as has_analytics,
    REGEXP_CONTAINS(accepted_categories, r'\bmarketing\b') as has_marketing,
    REGEXP_CONTAINS(accepted_categories, r'\bpersonalization\b') as has_personalization,
    REGEXP_CONTAINS(accepted_categories, r'\bnecessary\b') as has_necessary,
    REGEXP_CONTAINS(accepted_categories, r'\bfunctionality\b') as has_functionality
  FROM `polwell-data-warehouse.consentmanager.logs`
  WHERE DATE(created_at) >= DATE_SUB(CURRENT_DATE(), INTERVAL 90 DAY)
)
SELECT
  date,
  hostname,
  
  -- =========================================================================
  -- CONVERSION FUNNEL METRICS
  -- =========================================================================
  -- Use these to analyze user journey from modal view to consent
  
  COUNTIF(event = 'consent_modal_view') as modal_views,
    -- Total number of times consent modal was shown
    -- Looker Studio: Use as funnel top (impressions)
  
  COUNTIF(event = 'first_consent') as first_consents,
    -- Total number of first-time consents given
    -- Looker Studio: Use as funnel conversion step
    -- Calculate: conversion_rate = first_consents / modal_views
  
  COUNTIF(event = 'consent_update') as consent_updates,
    -- Total number of consent updates (returning users)
    -- Looker Studio: Use as funnel retention step
    -- Calculate: update_rate = consent_updates / first_consents
  
  COUNTIF(event IN ('first_consent', 'consent_update')) as total_interactions,
    -- Total consent interactions (first consent + update)
    -- Looker Studio: Use for engagement metrics
  
  -- =========================================================================
  -- ACCEPT TYPE ANALYSIS
  -- =========================================================================
  -- Use these to understand how users accept cookies (all/necessary/custom)
  -- Only counts first consents, excludes unknown types
  
  COUNTIF(event = 'first_consent' AND accept_type = 'all') as accept_all_count,
    -- Users who accepted all cookies
    -- Looker Studio: Calculate % = accept_all_count / total_first_consents_with_type
  
  COUNTIF(event = 'first_consent' AND accept_type = 'necessary') as accept_necessary_count,
    -- Users who accepted only necessary cookies
    -- Looker Studio: Calculate % = accept_necessary_count / total_first_consents_with_type
  
  COUNTIF(event = 'first_consent' AND accept_type = 'custom') as accept_custom_count,
    -- Users who made custom selection
    -- Looker Studio: Calculate % = accept_custom_count / total_first_consents_with_type
  
  COUNTIF(event = 'first_consent' AND accept_type IS NOT NULL AND accept_type != '') as total_first_consents_with_type,
    -- Total first consents with known type (denominator for percentages)
    -- Looker Studio: Use as base for accept type % calculations
  
  -- =========================================================================
  -- CATEGORY PREFERENCES
  -- =========================================================================
  -- Use these to analyze which cookie categories users accept
  -- Counts both first consents and updates
  
  COUNTIF(event IN ('first_consent', 'consent_update') AND has_necessary) as necessary_accepts,
    -- How many times necessary category was accepted
    -- Looker Studio: Calculate % = necessary_accepts / total_interactions
  
  COUNTIF(event IN ('first_consent', 'consent_update') AND has_analytics) as analytics_accepts,
    -- How many times analytics category was accepted
    -- Looker Studio: Calculate % = analytics_accepts / total_interactions
  
  COUNTIF(event IN ('first_consent', 'consent_update') AND has_marketing) as marketing_accepts,
    -- How many times marketing category was accepted
    -- Looker Studio: Calculate % = marketing_accepts / total_interactions
  
  COUNTIF(event IN ('first_consent', 'consent_update') AND has_personalization) as personalization_accepts,
    -- How many times personalization category was accepted
    -- Looker Studio: Calculate % = personalization_accepts / total_interactions
  
  COUNTIF(event IN ('first_consent', 'consent_update') AND has_functionality) as functionality_accepts,
    -- How many times functionality category was accepted
    -- Looker Studio: Calculate % = functionality_accepts / total_interactions
  
  COUNTIF(event IN ('first_consent', 'consent_update') AND accepted_categories IS NOT NULL) as total_consents_with_categories
    -- Total consents with category data (denominator for category percentages)

FROM category_parsing
GROUP BY date, hostname
ORDER BY date DESC, hostname;

-- ============================================================================
-- USAGE INSTRUCTIONS FOR LOOKER STUDIO
-- ============================================================================

/*
SINGLE DATA SOURCE APPROACH
============================

1. Connect Looker Studio to BigQuery:
   - Add Data Source → BigQuery
   - Project: polwell-data-warehouse
   - Dataset: consentmanager
   - View: cc_logs_stats

2. All Metrics Available in One View:
   
   CONVERSION FUNNEL:
   - modal_views, first_consents, consent_updates
   - unique_modal_views, unique_first_consents, unique_updates
   - Calculate: conversion_rate = first_consents / modal_views
   - Calculate: unique_conversion_rate = unique_first_consents / unique_modal_views
   
   ACCEPT TYPE ANALYSIS:
   - accept_all_count, accept_necessary_count, accept_custom_count
   - total_first_consents_with_type (denominator)
   - Calculate: accept_all_% = accept_all_count / total_first_consents_with_type
   
   CATEGORY PREFERENCES:
   - necessary_accepts, analytics_accepts, marketing_accepts, etc.
   - total_consents_with_categories (denominator)
   - top_category_combinations (most popular combinations)
   - Calculate: analytics_% = analytics_accepts / total_consents_with_categories
   
   GA4 INTEGRATION:
   - with_ga4_client_id, with_ga4_session_id
   - total_consent_events_for_ga4 (denominator)
   - Calculate: ga4_capture_rate = with_ga4_client_id / total_consent_events_for_ga4

3. Dashboard Examples:

   A) MAIN OVERVIEW DASHBOARD:
      - Scorecards: conversion_rate, unique_first_consents, accept_all_%
      - Time series: modal_views, first_consents, consent_updates
      - Pie chart: accept type distribution
      - Bar chart: category acceptance rates
   
   B) FUNNEL ANALYSIS:
      - Funnel visualization: modal_views → first_consents → consent_updates
      - Line chart: conversion_rate over time
      - Table: daily breakdown by hostname
   
   C) CATEGORY INSIGHTS:
      - Bar chart: category acceptance rates
      - Table: top_category_combinations
      - Trend: category acceptance over time

4. Filters to Add:
   - Date range (always required for partition filtering!)
   - Hostname (for multi-site analysis)
   
5. Performance Tips:
   - Always use date filter (leverages partitioning)
   - Use date ranges ≤ 90 days for best performance
   - Enable data caching in Looker Studio
   - All percentages calculated as calculated fields in Looker Studio
*/

-- ============================================================================
-- REFRESH VIEWS (Run periodically)
-- ============================================================================

-- Views are automatically updated when queried
-- No manual refresh needed - they query the base table dynamically
-- For better performance, consider materialized views for large datasets

-- Example: Create materialized view (updates every 4 hours)
/*
CREATE MATERIALIZED VIEW `polwell-data-warehouse.consentmanager.mv_consent_analytics`
PARTITION BY date
CLUSTER BY hostname
OPTIONS(
  enable_refresh = true,
  refresh_interval_minutes = 240
) AS
SELECT * FROM `polwell-data-warehouse.consentmanager.cc_logs_stats`;
*/

-- ============================================================================
-- LOOKER STUDIO CALCULATED FIELDS
-- ============================================================================
-- Create these as Calculated Fields in Looker Studio
-- All should be formatted as Percent (0.00%)
-- ============================================================================

/*
1. CONVERSION RATES (Funnel Analysis)
======================================

Conversion Rate
---------------
Formula: first_consents / modal_views
Description: Percentage of users who gave consent after seeing the modal
Format: Percent (0.00%)

Update Rate
-----------
Formula: consent_updates / first_consents
Description: Percentage of users who updated their consent after initial acceptance
Format: Percent (0.00%)

Engagement Rate
---------------
Formula: total_interactions / modal_views
Description: Overall engagement rate (first consents + updates)
Format: Percent (0.00%)


2. ACCEPT TYPE DISTRIBUTION
============================

Accept All Percentage
---------------------
Formula: accept_all_count / total_first_consents_with_type
Description: Percentage of users who accepted all cookies
Format: Percent (0.00%)

Accept Necessary Percentage
----------------------------
Formula: accept_necessary_count / total_first_consents_with_type
Description: Percentage of users who accepted only necessary cookies
Format: Percent (0.00%)

Accept Custom Percentage
------------------------
Formula: accept_custom_count / total_first_consents_with_type
Description: Percentage of users who made custom selection
Format: Percent (0.00%)


3. CATEGORY ACCEPTANCE RATES
=============================

Analytics Acceptance Rate
-------------------------
Formula: analytics_accepts / total_consents_with_categories
Description: Percentage of consents that included analytics category
Format: Percent (0.00%)

Marketing Acceptance Rate
--------------------------
Formula: marketing_accepts / total_consents_with_categories
Description: Percentage of consents that included marketing category
Format: Percent (0.00%)

Personalization Acceptance Rate
--------------------------------
Formula: personalization_accepts / total_consents_with_categories
Description: Percentage of consents that included personalization category
Format: Percent (0.00%)

Necessary Acceptance Rate
--------------------------
Formula: necessary_accepts / total_consents_with_categories
Description: Percentage of consents that included necessary category
Format: Percent (0.00%)

Functionality Acceptance Rate
------------------------------
Formula: functionality_accepts / total_consents_with_categories
Description: Percentage of consents that included functionality category
Format: Percent (0.00%)


SUMMARY
=======
Total Calculated Fields: 8
- 3 Conversion/Funnel rates
- 3 Accept type percentages
- 5 Category acceptance rates (you can create all or just the ones you need)

All formulas use simple division - the view provides both numerators and denominators.
*/
