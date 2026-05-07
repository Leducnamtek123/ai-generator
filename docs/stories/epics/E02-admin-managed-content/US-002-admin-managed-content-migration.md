# US-002: Admin-managed content migration

## Summary
Move high-value landing, navigation, and stock content out of hardcoded frontend constants and into a JSON-backed site config that admins can edit from the existing `/admin` console.

## Acceptance
- Landing copy uses locale messages, with admin-configurable content arrays as fallback overrides.
- Sidebar / mobile navigation can read admin overrides without losing default icons or pinning behavior.
- Stock categories and featured collections can be edited from the admin console and still fall back to bundled defaults.
- Every admin save writes an audit record.

## Validation
- Frontend smoke coverage checks the landing sections instead of brittle marketing copy.
- Backend unit/integration checks cover site-config read, update, fallback, and audit logging.
- Admin UI can load, edit, and save a JSON config entry for landing/navigation/stock.
