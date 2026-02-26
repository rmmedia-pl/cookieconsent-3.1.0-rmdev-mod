-- =====================================================
-- VIEW: orders-ads-daily-analysis
-- PURPOSE: Daily analysis of orders and advertising costs
-- DESCRIPTION: 
--   - Combines order revenue with Google Ads costs
--   - Calculates ROAS and other key marketing metrics
--   - Aggregated by day for performance tracking
-- GRAIN: Daily level
-- =====================================================

CREATE OR REPLACE VIEW `quiet-fusion-449812-f1.lokikoki_orders.orders-ads-daily-analysis` AS

WITH daily_orders AS (
  -- Aggregate order data by day
  SELECT
    Order_date,
    COUNT(DISTINCT Order_ID) AS total_orders,
    COUNT(DISTINCT CASE WHEN Client_type = 'New' THEN Order_ID END) AS new_customer_orders,
    COUNT(DISTINCT CASE WHEN Client_type = 'Returning' THEN Order_ID END) AS returning_customer_orders,
    COUNT(DISTINCT Client_email) AS unique_customers,
    COUNT(DISTINCT CASE WHEN Client_type = 'New' THEN Client_email END) AS new_customers,
    SUM(Order_total_cost) AS total_revenue,
    SUM(CASE WHEN Client_type = 'New' THEN Order_total_cost ELSE 0 END) AS new_customer_revenue,
    SUM(CASE WHEN Client_type = 'Returning' THEN Order_total_cost ELSE 0 END) AS returning_customer_revenue,
    AVG(Order_total_cost) AS avg_order_value,
    SUM(Order_products_cost) AS total_products_cost,
    SUM(Order_shipping_cost) AS total_shipping_cost,
    SUM(Order_discount_value) AS total_discount_value
  FROM `quiet-fusion-449812-f1.lokikoki_orders.lokikoki-orders-transactions`
  WHERE Order_date IS NOT NULL
  GROUP BY Order_date
),

daily_ads AS (
  -- Aggregate Google Ads data by day
  SELECT
    DATE(segments.date) AS ad_date,
    SUM(metrics.cost_micros / 1000000) AS total_ad_cost,
    SUM(metrics.impressions) AS total_impressions,
    SUM(metrics.clicks) AS total_clicks,
    SUM(metrics.conversions) AS total_conversions,
    SUM(metrics.conversions_value) AS total_conversions_value,
    SAFE_DIVIDE(SUM(metrics.clicks), SUM(metrics.impressions)) AS ctr,
    SAFE_DIVIDE(SUM(metrics.cost_micros / 1000000), SUM(metrics.clicks)) AS cpc,
    SAFE_DIVIDE(SUM(metrics.cost_micros / 1000000), SUM(metrics.impressions)) * 1000 AS cpm
  FROM `quiet-fusion-449812-f1.gads_lokikoki.p_ads_*`
  WHERE _TABLE_SUFFIX = (
    SELECT MAX(_TABLE_SUFFIX) 
    FROM `quiet-fusion-449812-f1.gads_lokikoki.__TABLES__`
    WHERE table_id LIKE 'p_ads_%'
  )
  GROUP BY ad_date
)

-- Combine orders and ads data
SELECT
  COALESCE(o.Order_date, a.ad_date) AS date,
  
  -- ========================================
  -- ORDER METRICS
  -- ========================================
  IFNULL(o.total_orders, 0) AS total_orders,
  IFNULL(o.new_customer_orders, 0) AS new_customer_orders,
  IFNULL(o.returning_customer_orders, 0) AS returning_customer_orders,
  IFNULL(o.unique_customers, 0) AS unique_customers,
  IFNULL(o.new_customers, 0) AS new_customers,
  IFNULL(o.total_revenue, 0) AS total_revenue,
  IFNULL(o.new_customer_revenue, 0) AS new_customer_revenue,
  IFNULL(o.returning_customer_revenue, 0) AS returning_customer_revenue,
  IFNULL(o.avg_order_value, 0) AS avg_order_value,
  IFNULL(o.total_products_cost, 0) AS total_products_cost,
  IFNULL(o.total_shipping_cost, 0) AS total_shipping_cost,
  IFNULL(o.total_discount_value, 0) AS total_discount_value,
  
  -- ========================================
  -- ADVERTISING METRICS
  -- ========================================
  IFNULL(a.total_ad_cost, 0) AS total_ad_cost,
  IFNULL(a.total_impressions, 0) AS total_impressions,
  IFNULL(a.total_clicks, 0) AS total_clicks,
  IFNULL(a.total_conversions, 0) AS total_conversions,
  IFNULL(a.total_conversions_value, 0) AS total_conversions_value,
  IFNULL(a.ctr, 0) AS ctr,
  IFNULL(a.cpc, 0) AS cpc,
  IFNULL(a.cpm, 0) AS cpm,
  
  -- ========================================
  -- CALCULATED PERFORMANCE METRICS
  -- ========================================
  -- ROAS (Return on Ad Spend): Revenue / Ad Cost
  SAFE_DIVIDE(IFNULL(o.total_revenue, 0), IFNULL(a.total_ad_cost, 0)) AS roas,
  
  -- ROAS for new customers only
  SAFE_DIVIDE(IFNULL(o.new_customer_revenue, 0), IFNULL(a.total_ad_cost, 0)) AS roas_new_customers,
  
  -- CPA (Cost Per Acquisition): Ad Cost / Orders
  SAFE_DIVIDE(IFNULL(a.total_ad_cost, 0), IFNULL(o.total_orders, 0)) AS cpa,
  
  -- CPA for new customers
  SAFE_DIVIDE(IFNULL(a.total_ad_cost, 0), IFNULL(o.new_customers, 0)) AS cpa_new_customers,
  
  -- Profit margin (Revenue - Ad Cost - Discounts)
  IFNULL(o.total_revenue, 0) - IFNULL(a.total_ad_cost, 0) - IFNULL(o.total_discount_value, 0) AS gross_profit,
  
  -- Profit margin percentage
  SAFE_DIVIDE(
    IFNULL(o.total_revenue, 0) - IFNULL(a.total_ad_cost, 0) - IFNULL(o.total_discount_value, 0),
    IFNULL(o.total_revenue, 0)
  ) * 100 AS profit_margin_pct,
  
  -- Ad cost as percentage of revenue
  SAFE_DIVIDE(IFNULL(a.total_ad_cost, 0), IFNULL(o.total_revenue, 0)) * 100 AS ad_cost_pct_of_revenue,
  
  -- Conversion rate (Orders / Clicks)
  SAFE_DIVIDE(IFNULL(o.total_orders, 0), IFNULL(a.total_clicks, 0)) * 100 AS conversion_rate_pct

FROM daily_orders o
FULL OUTER JOIN daily_ads a ON o.Order_date = a.ad_date
ORDER BY date DESC;
