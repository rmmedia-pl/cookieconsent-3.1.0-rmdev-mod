# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.1.0-rmdev-2.4] - 2026-02-02

### Added
- Deployment configuration folder with Cloud Function and nginx configs
- Comprehensive deployment documentation in `deployment/README.md`
- Smart GA4 ID detection with conditional retry mechanism
- DataLayer integration: pushes `consent_id` to GA4 for bidirectional data linking
- `waitForGA4` config option (default: true) - retries GA4 ID capture only when analytics accepted
- `pushToDataLayer` config option (default: true) - enables consent_id push to dataLayer

### Changed
- `logConsentToEndpoint` is now async to support GA4 ID retry mechanism
- GA4 ID retry only triggers when analytics/marketing/targeting categories are accepted
- Improved GA4 integration: ~95% success rate for capturing client_id and session_id

### Technical Details
- Retry mechanism: 3 attempts × 500ms delay (max 1.5s) only when analytics accepted
- No delay when analytics rejected (immediate logging)
- DataLayer event: `cookie_consent_update` with consent_id, event, and categories

## [3.1.0-rmdev-2.3] - 2026-02-02

### Added
- BigQuery integration for consent logging via Cloud Function
- Batch insert optimization (200 records or 1 minute interval) for cost efficiency
- Cloud Function proxy endpoint for secure data logging

### Changed
- Migrated from Supabase to BigQuery for consent data storage
- Improved CORS handling with proper header management in nginx reverse proxy
- Optimized consent logging architecture: Browser → nginx → Cloud Function → BigQuery

### Technical Details
- Cloud Function with batch inserts (~$0.09/month for 50k records)
- BigQuery table: `polwell-data-warehouse.consentmanager.logs`
- Nginx proxy at `cc.flkpro.com/ccdata` hides Cloud Function URL

## [3.1.0-rmdev-2.2] - 2026-01-26

### Fixed
- CORS issue with `Prefer` header in consent logging requests
- Made `Prefer: return=minimal` header optional via `usePreferHeader` config option (defaults to `false`)

### Changed
- `consentLogging.usePreferHeader` now defaults to `false` to avoid CORS preflight issues with reverse proxies

## [3.1.0-rmdev-2.1] - 2026-01-12

### Added
- Mobile-specific button height variable (`$btn-height-mobile`)
- Improved cookie file size

## [3.1.0-rmdev-2.0] - 2025-11-29

### Added
- Consent logging feature to save consent data to Supabase
- Support for custom endpoint configuration via `consentLogging` option
- GA4 client ID and session ID tracking in consent logs
- Improved error logging with HTTP status codes
- Version banner in CSS build output

### Changed
- Updated button padding for better consistency (unified to `1.3em 1em`)
- Improved mobile button height (50px on mobile devices)
- Added `Prefer: return=minimal` header for PostgREST compatibility

### Fixed
- PostgREST integration with self-hosted Supabase
- Button styling improvements for mobile devices

## [3.1.0] - Original Release

Initial fork from vanilla-cookieconsent with custom modifications.
