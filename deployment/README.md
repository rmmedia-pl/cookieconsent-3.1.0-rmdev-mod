# Deployment Configuration

Konfiguracja dla consent logging z BigQuery.

## Architektura

```
Browser → nginx (cc.flkpro.com/ccdata) → Cloud Function → BigQuery
```

## 1. Cloud Function

### Deployment

```bash
cd deployment/cloud-function

# Deploy do Google Cloud
gcloud functions deploy logConsent \
  --gen2 \
  --runtime nodejs20 \
  --trigger-http \
  --allow-unauthenticated \
  --entry-point logConsent \
  --region europe-central2 \
  --memory 256MB \
  --timeout 10s \
  --project polwell-data-warehouse
```

### Konfiguracja

- **Projekt**: `polwell-data-warehouse`
- **Dataset**: `consentmanager`
- **Tabela**: `logs`
- **Batch size**: 200 rekordów
- **Flush interval**: 60 sekund

### Tabela BigQuery

**IMPORTANT**: Use the optimized partitioned table structure from `bigquery-migration.sql`

Optimized table with partitioning and clustering:

```sql
CREATE TABLE `polwell-data-warehouse.consentmanager.logs`
(
  event STRING,
  consent_id STRING,
  accept_type STRING,
  accepted_categories STRING,
  rejected_categories STRING,
  ga4_client_id STRING,
  ga4_session_id STRING,
  user_agent STRING,
  hostname STRING,
  page_url STRING,
  created_at TIMESTAMP
)
PARTITION BY DATE(created_at)
CLUSTER BY hostname, event
OPTIONS(
  partition_expiration_days=1095,  -- 3 years
  require_partition_filter=true
);
```

**Migration**: If you have an existing table, use `bigquery-migration.sql` to migrate to the partitioned structure.

### Benefits of Partitioning

- **Cost savings**: 99% reduction in query costs (scan only needed days)
- **Performance**: 10-100x faster queries
- **Auto-cleanup**: Old partitions automatically deleted after 3 years
- **Clustering**: Groups data by hostname and event for better compression

## 2. BigQuery Migration

If you have an existing unpartitioned table, run the migration script:

```bash
# Review the migration script
cat bigquery-migration.sql

# Execute in BigQuery Console or CLI
bq query --use_legacy_sql=false < bigquery-migration.sql
```

The migration script will:
1. Create new partitioned table (`logs_v2`)
2. Copy all data (excluding deprecated `id` field)
3. Verify data integrity
4. Create backup of old table
5. Replace old table with new partitioned table

**Estimated time**: ~1-5 minutes depending on data size

## 3. Nginx Reverse Proxy

### Instalacja

1. Skopiuj `nginx/cc.flkpro.com.conf` do Cloudpanel
2. Zaktualizuj URL Cloud Function w linii 51:
   ```nginx
   proxy_pass https://TWOJ-CLOUD-FUNCTION-URL;
   ```
3. Przeładuj nginx:
   ```bash
   nginx -t && nginx -s reload
   ```

### Kluczowe elementy

- **CORS headers**: Ukrywa duplikaty z Cloud Function
- **Timeout**: 5s dla szybkich odpowiedzi
- **Allowed headers**: `Content-Type, Prefer`

## 3. CookieConsent Configuration

```javascript
CookieConsent.run({
  consentLogging: {
    enabled: true,
    endpoint: 'https://cc.flkpro.com/ccdata'
  }
});
```

## Koszty

- **Cloud Function**: ~$0.09/miesiąc dla 50k rekordów
- **BigQuery Storage**: ~$0.006/miesiąc
- **BigQuery Inserts**: FREE (batch inserts)

**Total**: ~$0.10/miesiąc

## Test

```bash
curl -X POST https://cc.flkpro.com/ccdata \
  -H "Content-Type: application/json" \
  -d '{
    "event": "consent_given",
    "consent_id": "test-123",
    "accepted_categories": "analytics, marketing",
    "hostname": "test.pl",
    "page_url": "https://test.pl/"
  }'
```

Sprawdź dane w BigQuery:

```sql
SELECT * FROM `polwell-data-warehouse.consentmanager.logs` 
ORDER BY created_at DESC 
LIMIT 10;
```

## Monitoring

### Cloud Function Logs

```bash
gcloud functions logs read logConsent \
  --region europe-central2 \
  --limit 50
```

### BigQuery Query

```sql
-- Dzienne statystyki
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_events,
  COUNT(DISTINCT consent_id) as unique_consents
FROM `polwell-data-warehouse.consentmanager.logs`
GROUP BY date
ORDER BY date DESC;
```
