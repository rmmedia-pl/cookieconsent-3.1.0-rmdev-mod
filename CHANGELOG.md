# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
