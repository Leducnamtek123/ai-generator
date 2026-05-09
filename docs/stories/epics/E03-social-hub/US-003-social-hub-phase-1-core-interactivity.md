# US-003 Social Hub Phase 1 Core Interactivity

## Status

implemented

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
| Release | Frontend and backend build/typecheck remain green, with Social Hub Playwright coverage passing. |

## Harness Delta

- Added a Social Hub product doc.
- Added a Phase 1 story packet for the analytics and interaction contract.
- Added the Social Hub contract row to the test matrix.

## Evidence

- `backend/src/social-hub/social-hub.controller.ts` exposes the live analytics, channels, inbox, reply, handled, and reschedule routes.
- `backend/src/social-hub/services/social-analytics.service.ts` computes dashboard stats and channel analytics from stored data and accepts a `days` window.
- `frontend/src/services/socialHubApi.ts` mirrors those endpoints, including the analytics day-range query and inbox/reschedule actions.
- `frontend/src/app/[locale]/(dashboard)/social/dashboard/page.tsx`, `frontend/src/app/[locale]/(dashboard)/social/channels/page.tsx`, `frontend/src/app/[locale]/(dashboard)/social/inbox/page.tsx`, and `frontend/src/app/[locale]/(dashboard)/social/calendar/page.tsx` are already wired to the live contract.
- `frontend/src/app/[locale]/(dashboard)/social/page.tsx` now acts as the Social Hub entry point, and `frontend/src/app/[locale]/(dashboard)/social/dashboard/page.tsx` now shows a real operating snapshot with connected accounts, inbox load, publishing queue, and next scheduled post data.
- `frontend/src/app/[locale]/(dashboard)/social/channels/page.tsx` now includes a Facebook-first operating snapshot, workspace shortcuts, and a page-review onboarding flow that matches the page-first product contract.
- `frontend/src/app/[locale]/(dashboard)/social/publish/page.tsx` and `frontend/src/app/[locale]/(dashboard)/social/publish/view.tsx` now persist draft state locally, save backend drafts, and surface a publish snapshot with selected targets, scheduling mode, and autosave status.
- `frontend/src/app/[locale]/(dashboard)/social/inbox/page.tsx` now adds an operational inbox snapshot, backend follow-up/assignment/label triage, and saved-reply shortcuts on top of the live interaction stream.
- `frontend/src/app/[locale]/(dashboard)/social/calendar/page.tsx` now shows a planner snapshot with status counts, next scheduled post context, and a direct hub shortcut on top of the live month/week/day views and reschedule actions.
- `frontend/src/app/[locale]/(dashboard)/social/publish/view.tsx` now includes a publishing checklist and target summary so the composer reads like a real queue gate instead of a bare form.
- `frontend/src/app/[locale]/(dashboard)/social/inbox/page.tsx` now includes backend assignment cycling, label tagging, and follow-up persistence alongside the operational inbox snapshot so triage reads more like a real unified inbox.
- `backend/src/social-hub/services/publishing.service.ts` now distinguishes backend draft saves from immediate publish requests, queueing immediate posts without forcing them into draft state.
- `backend/src/social-hub/services/channels.service.ts` and `backend/src/social-hub/social-hub.controller.ts` now persist inbox triage updates to account metadata and expose a dedicated triage endpoint.
- Backend build passed after the Social Hub publish/inbox persistence slice.
- Frontend typecheck passed after the Social Hub publish/inbox persistence slice.
- Frontend production build passed in this sweep.
- Backend Social Hub controller/service unit tests passed for publish draft/immediate handling and inbox triage persistence.
- Frontend Playwright coverage passed for the Social Hub overview, publish composer, inbox, channels, and calendar flows after sign-in.
