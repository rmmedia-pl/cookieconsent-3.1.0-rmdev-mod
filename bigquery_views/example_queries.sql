-- =====================================================
-- EXAMPLE QUERIES FOR orders-ads-daily-analysis VIEW
-- =====================================================

-- ========================================
-- 1. DAILY PERFORMANCE OVERVIEW (Last 30 Days)
-- ========================================
SELECT 
  date,
  total_orders,
  total_revenue,
  total_ad_cost,
  roas,
  cpa,
  profit_margin_pct,
  conversion_rate_pct
FROM `quiet-fusion-449812-f1.lokikoki_orders.orders-ads-daily-analysis`
WHERE date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
ORDER BY date DESC;


-- ========================================
-- 2. MONTHLY AGGREGATED PERFORMANCE
-- ========================================
SELECT 
  FORMAT_DATE('%Y-%m', date) AS month,
  SUM(total_orders) AS monthly_orders,
  SUM(total_revenue) AS monthly_revenue,
  SUM(total_ad_cost) AS monthly_ad_cost,
  SAFE_DIVIDE(SUM(total_revenue), SUM(total_ad_cost)) AS monthly_roas,
  SAFE_DIVIDE(SUM(total_ad_cost), SUM(total_orders)) AS monthly_cpa,
  SUM(gross_profit) AS monthly_gross_profit,
  SAFE_DIVIDE(SUM(gross_profit), SUM(total_revenue)) * 100 AS monthly_profit_margin_pct
FROM `quiet-fusion-449812-f1.lokikoki_orders.orders-ads-daily-analysis`
WHERE date >= DATE_SUB(CURRENT_DATE(), INTERVAL 12 MONTH)
GROUP BY month
ORDER BY month DESC;


-- ========================================
-- 3. NEW VS RETURNING CUSTOMER ANALYSIS
-- ========================================
SELECT 
  date,
  new_customer_orders,
  returning_customer_orders,
  new_customer_revenue,
  returning_customer_revenue,
  roas_new_customers,
  cpa_new_customers,
  SAFE_DIVIDE(new_customer_revenue, total_revenue) * 100 AS new_customer_revenue_pct,
  SAFE_DIVIDE(returning_customer_revenue, total_revenue) * 100 AS returning_customer_revenue_pct
FROM `quiet-fusion-449812-f1.lokikoki_orders.orders-ads-daily-analysis`
WHERE date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
ORDER BY date DESC;


-- ========================================
-- 4. WEEKLY PERFORMANCE TRENDS
-- ========================================
SELECT 
  FORMAT_DATE('%Y-W%V', date) AS week,
  MIN(date) AS week_start,
  MAX(date) AS week_end,
  SUM(total_orders) AS weekly_orders,
  SUM(total_revenue) AS weekly_revenue,
  SUM(total_ad_cost) AS weekly_ad_cost,
  SAFE_DIVIDE(SUM(total_revenue), SUM(total_ad_cost)) AS weekly_roas,
  AVG(avg_order_value) AS avg_weekly_order_value,
  SUM(total_clicks) AS weekly_clicks,
  SUM(total_impressions) AS weekly_impressions
FROM `quiet-fusion-449812-f1.lokikoki_orders.orders-ads-daily-analysis`
WHERE date >= DATE_SUB(CURRENT_DATE(), INTERVAL 12 WEEK)
GROUP BY week
ORDER BY week DESC;


-- ========================================
-- 5. PROFITABILITY ANALYSIS
-- ========================================
SELECT 
  date,
  total_revenue,
  total_ad_cost,
  total_discount_value,
  gross_profit,
  profit_margin_pct,
  ad_cost_pct_of_revenue,
  CASE 
    WHEN roas >= 4 THEN 'Excellent (4+)'
    WHEN roas >= 3 THEN 'Good (3-4)'
    WHEN roas >= 2 THEN 'Average (2-3)'
    WHEN roas >= 1 THEN 'Poor (1-2)'
    ELSE 'Loss (<1)'
  END AS roas_category
FROM `quiet-fusion-449812-f1.lokikoki_orders.orders-ads-daily-analysis`
WHERE date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
ORDER BY date DESC;


-- ========================================
-- 6. BEST & WORST PERFORMING DAYS
-- ========================================
-- Top 10 days by ROAS
SELECT 
  date,
  total_revenue,
  total_ad_cost,
  roas,
  total_orders,
  cpa
FROM `quiet-fusion-449812-f1.lokikoki_orders.orders-ads-daily-analysis`
WHERE total_ad_cost > 0 
  AND date >= DATE_SUB(CURRENT_DATE(), INTERVAL 90 DAY)
ORDER BY roas DESC
LIMIT 10;


-- ========================================
-- 7. AD EFFICIENCY METRICS
-- ========================================
SELECT 
  date,
  total_impressions,
  total_clicks,
  total_orders,
  ctr * 100 AS ctr_pct,
  cpc,
  cpm,
  conversion_rate_pct,
  cpa,
  roas
FROM `quiet-fusion-449812-f1.lokikoki_orders.orders-ads-daily-analysis`
WHERE total_clicks > 0
  AND date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
ORDER BY date DESC;


-- ========================================
-- 8. CUMULATIVE PERFORMANCE (Year to Date)
-- ========================================
SELECT 
  SUM(total_orders) AS ytd_orders,
  SUM(total_revenue) AS ytd_revenue,
  SUM(total_ad_cost) AS ytd_ad_cost,
  SAFE_DIVIDE(SUM(total_revenue), SUM(total_ad_cost)) AS ytd_roas,
  SAFE_DIVIDE(SUM(total_ad_cost), SUM(total_orders)) AS ytd_cpa,
  SUM(new_customers) AS ytd_new_customers,
  SUM(gross_profit) AS ytd_gross_profit,
  SAFE_DIVIDE(SUM(gross_profit), SUM(total_revenue)) * 100 AS ytd_profit_margin_pct
FROM `quiet-fusion-449812-f1.lokikoki_orders.orders-ads-daily-analysis`
WHERE EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM CURRENT_DATE());


-- ========================================
-- 9. MONTH-OVER-MONTH COMPARISON
-- ========================================
WITH monthly_data AS (
  SELECT 
    FORMAT_DATE('%Y-%m', date) AS month,
    SUM(total_revenue) AS monthly_revenue,
    SUM(total_ad_cost) AS monthly_ad_cost,
    SAFE_DIVIDE(SUM(total_revenue), SUM(total_ad_cost)) AS monthly_roas,
    SUM(total_orders) AS monthly_orders
  FROM `quiet-fusion-449812-f1.lokikoki_orders.orders-ads-daily-analysis`
  GROUP BY month
)
SELECT 
  month,
  monthly_revenue,
  monthly_ad_cost,
  monthly_roas,
  monthly_orders,
  LAG(monthly_revenue) OVER (ORDER BY month) AS prev_month_revenue,
  LAG(monthly_roas) OVER (ORDER BY month) AS prev_month_roas,
  SAFE_DIVIDE(monthly_revenue - LAG(monthly_revenue) OVER (ORDER BY month), 
              LAG(monthly_revenue) OVER (ORDER BY month)) * 100 AS revenue_growth_pct,
  monthly_roas - LAG(monthly_roas) OVER (ORDER BY month) AS roas_change
FROM monthly_data
ORDER BY month DESC
LIMIT 12;


-- ========================================
-- 10. CUSTOMER ACQUISITION COST BREAKDOWN
-- ========================================
SELECT 
  FORMAT_DATE('%Y-%m', date) AS month,
  SUM(new_customers) AS new_customers_acquired,
  SUM(total_ad_cost) AS total_ad_spend,
  SAFE_DIVIDE(SUM(total_ad_cost), SUM(new_customers)) AS cac_customer_acquisition_cost,
  SUM(new_customer_revenue) AS new_customer_revenue,
  SAFE_DIVIDE(SUM(new_customer_revenue), SUM(new_customers)) AS avg_new_customer_value,
  SAFE_DIVIDE(SUM(new_customer_revenue), SUM(total_ad_cost)) AS new_customer_roas
FROM `quiet-fusion-449812-f1.lokikoki_orders.orders-ads-daily-analysis`
WHERE date >= DATE_SUB(CURRENT_DATE(), INTERVAL 6 MONTH)
GROUP BY month
ORDER BY month DESC;
