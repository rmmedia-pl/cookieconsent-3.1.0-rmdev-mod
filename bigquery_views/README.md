# BigQuery Views Documentation

## orders-ads-daily-analysis

### Overview
Daily aggregated view combining order revenue data with Google Ads advertising costs to calculate ROAS and other marketing performance metrics.

### Data Sources
- **Orders**: `quiet-fusion-449812-f1.lokikoki_orders.lokikoki-orders-transactions`
- **Google Ads**: `quiet-fusion-449812-f1.gads_lokikoki.p_ads_*` (latest partition)

### Key Metrics

#### Order Metrics
- `total_orders` - Total number of orders
- `new_customer_orders` - Orders from new customers
- `returning_customer_orders` - Orders from returning customers
- `unique_customers` - Count of unique customers
- `new_customers` - Count of new customers
- `total_revenue` - Total order revenue (Order_total_cost)
- `new_customer_revenue` - Revenue from new customers
- `returning_customer_revenue` - Revenue from returning customers
- `avg_order_value` - Average order value

#### Advertising Metrics
- `total_ad_cost` - Total Google Ads spend
- `total_impressions` - Total ad impressions
- `total_clicks` - Total ad clicks
- `total_conversions` - Total conversions tracked in Google Ads
- `ctr` - Click-through rate (Clicks / Impressions)
- `cpc` - Cost per click
- `cpm` - Cost per thousand impressions

#### Performance Metrics
- **`roas`** - Return on Ad Spend (Revenue / Ad Cost)
- **`roas_new_customers`** - ROAS for new customers only
- **`cpa`** - Cost Per Acquisition (Ad Cost / Orders)
- **`cpa_new_customers`** - CPA for new customers
- **`gross_profit`** - Revenue - Ad Cost - Discounts
- **`profit_margin_pct`** - Profit margin percentage
- **`ad_cost_pct_of_revenue`** - Ad cost as % of revenue
- **`conversion_rate_pct`** - Orders / Clicks * 100

### Usage Examples

#### Basic daily performance
```sql
SELECT 
  date,
  total_revenue,
  total_ad_cost,
  roas,
  cpa
FROM `quiet-fusion-449812-f1.lokikoki_orders.orders-ads-daily-analysis`
WHERE date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
ORDER BY date DESC;
```

#### Monthly aggregation
```sql
SELECT 
  FORMAT_DATE('%Y-%m', date) AS month,
  SUM(total_revenue) AS monthly_revenue,
  SUM(total_ad_cost) AS monthly_ad_cost,
  SAFE_DIVIDE(SUM(total_revenue), SUM(total_ad_cost)) AS monthly_roas,
  SUM(total_orders) AS monthly_orders,
  SAFE_DIVIDE(SUM(total_ad_cost), SUM(total_orders)) AS monthly_cpa
FROM `quiet-fusion-449812-f1.lokikoki_orders.orders-ads-daily-analysis`
GROUP BY month
ORDER BY month DESC;
```

#### New vs Returning customer analysis
```sql
SELECT 
  date,
  new_customer_revenue,
  returning_customer_revenue,
  roas_new_customers,
  cpa_new_customers,
  SAFE_DIVIDE(new_customer_revenue, total_revenue) * 100 AS new_customer_revenue_pct
FROM `quiet-fusion-449812-f1.lokikoki_orders.orders-ads-daily-analysis`
WHERE date >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
ORDER BY date DESC;
```

#### Profitability analysis
```sql
SELECT 
  date,
  total_revenue,
  total_ad_cost,
  total_discount_value,
  gross_profit,
  profit_margin_pct,
  ad_cost_pct_of_revenue
FROM `quiet-fusion-449812-f1.lokikoki_orders.orders-ads-daily-analysis`
WHERE date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
ORDER BY date DESC;
```

### Looker Studio Integration
This view is optimized for Looker Studio dashboards. Recommended visualizations:
- Time series: ROAS, Revenue, Ad Cost trends
- Scorecards: Current ROAS, CPA, Profit Margin
- Tables: Daily breakdown with all metrics
- Pie charts: New vs Returning customer revenue split

### Notes
- Uses FULL OUTER JOIN to include days with orders but no ad spend, and vice versa
- Google Ads data uses the latest partition automatically
- All NULL values are converted to 0 for easier calculations
- SAFE_DIVIDE prevents division by zero errors
- Costs are converted from micros (Google Ads format) to standard currency
