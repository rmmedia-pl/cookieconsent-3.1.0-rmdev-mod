# Database Setup for Consent Logging

## PostgreSQL Table

Create the table for storing consent logs:

```sql
CREATE TABLE consentmanager.logs (
    id SERIAL PRIMARY KEY,
    event VARCHAR(50) NOT NULL DEFAULT '',
    consent_id VARCHAR(100) NOT NULL,
    accept_type VARCHAR(20) DEFAULT '',
    accepted_categories TEXT,
    rejected_categories TEXT,
    ga4_client_id VARCHAR(50),
    ga4_session_id VARCHAR(50),
    user_agent TEXT,
    hostname VARCHAR(255),
    page_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_logs_consent_id ON consentmanager.logs(consent_id);
CREATE INDEX idx_logs_event ON consentmanager.logs(event);
CREATE INDEX idx_logs_created_at ON consentmanager.logs(created_at);
```

## Permissions

Grant permissions to PostgREST/Supabase roles:

```sql
GRANT ALL ON consentmanager.logs TO authenticator;
GRANT ALL ON consentmanager.logs TO anon;
GRANT USAGE, SELECT ON SEQUENCE consentmanager.logs_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE consentmanager.logs_id_seq TO authenticator;
```

## Event Types

The `event` column stores one of the following values:

| Event | Description |
|-------|-------------|
| `consent_modal_view` | Consent modal was displayed to user |
| `first_consent` | User gave consent for the first time |
| `consent_update` | User changed their consent preferences |

## Configuration

Enable consent logging in your CookieConsent config:

```javascript
CookieConsent.run({
    // ... other options
    consentLogging: {
        enabled: true,
        endpoint: 'https://your-domain.com/ccdata'
    }
});
```
