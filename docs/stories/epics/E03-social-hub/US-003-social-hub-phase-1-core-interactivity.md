# US-003 Social Hub Phase 1 Core Interactivity

## Status

in_progress

## Lane

normal

## Product Contract

Social Hub Phase 1 removes hardcoded dashboard analytics, makes the analytics
date range affect backend data, and keeps the channel and inbox interactions
bound to real application state.

## Relevant Product Docs

- `docs/product/social-hub.md`

## Acceptance Criteria

- Dashboard audience distribution renders from backend analytics data.
- Dashboard 7-day and 30-day controls request different analytics windows.
- Analytics backend accepts a `days` query parameter and returns matching chart
  data.
- Social analytics type definitions include the platform breakdown contract.
- Story notes capture the Phase 1 scope so follow-up work can extend into
  calendar and inbox enhancements.

## Design Notes

- Commands:
  - `GET /api/v1/social-hub/analytics?days=7`
  - `GET /api/v1/social-hub/analytics?days=30`
- Queries:
  - `GET /api/v1/social-hub/channels`
- API:
  - `frontend/src/services/socialHubApi.ts`
- Tables:
  - `social_post`
  - `social_post_metric`
  - `social_account`
- Domain rules:
  - Platform distribution is derived from stored post counts per platform.
  - Analytics windows are server-driven, not just visual toggles.
  - Hardcoded placeholder percentages should not remain in the dashboard.
- UI surfaces:
  - `frontend/src/app/[locale]/(dashboard)/social/dashboard/page.tsx`
  - `frontend/src/app/[locale]/(dashboard)/social/channels/page.tsx`
  - `frontend/src/app/[locale]/(dashboard)/social/inbox/page.tsx`

## Validation

| Layer | Expected proof |
| --- | --- |
| Unit | Analytics contract and distribution mapping behave correctly. |
| Integration | Backend `/social-hub/analytics` honors `days` and returns a platform breakdown. |
| E2E | Dashboard 7-day and 30-day controls render different chart windows. |
| Platform | N/A |
| Release | Frontend and backend build/typecheck remain green. |

## Harness Delta

- Added a Social Hub product doc.
- Added a Phase 1 story packet for the analytics and interaction contract.
- Added the Social Hub contract row to the test matrix.

## Evidence

- Backend `npm run build` passed after wiring analytics and inbox endpoints.
- Frontend `npm run typecheck` is still blocked by unrelated parse errors in
  `frontend/src/app/[locale]/(dashboard)/creator/image-generator/page.tsx`.
