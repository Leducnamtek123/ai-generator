# US-002: Admin-managed content migration

## Status

implemented

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
- Frontend and backend build/typecheck remain green.

## Evidence

- `backend/src/site-config/site-config.service.ts` and `backend/src/site-config/site-config.controller.ts` expose the public site-config read/fallback contract.
- `backend/src/admin/admin.controller.ts` exposes admin `GET /admin/site-configs` and `PATCH /admin/site-configs/:key`, and `backend/src/admin/admin.controller.ts` records an audit entry on every save through `backend/src/admin/admin-audit.service.ts`.
- `frontend/src/services/siteConfigApi.ts` and `frontend/src/hooks/queries/useSiteConfig.ts` wire the UI to the public and admin site-config APIs.
- `frontend/src/app/[locale]/(dashboard)/admin/page.tsx` contains the JSON editor and save flow for landing/navigation/stock config.
- `frontend/src/components/layouts/Sidebar.tsx`, `frontend/src/components/layouts/MobileNav.tsx`, `frontend/src/app/[locale]/page.tsx`, and `frontend/src/app/[locale]/(dashboard)/stock/page.tsx` already read site-config overrides instead of relying only on hardcoded constants.
- Browser verification covered the Admin `Content Config` editor, including the config key and locale selectors plus the save/reset controls.
