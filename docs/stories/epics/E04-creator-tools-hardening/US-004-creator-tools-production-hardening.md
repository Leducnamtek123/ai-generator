# US-004 Creator Tools Production Hardening

## Status

in_progress

## Lane

normal

## Product Contract

The creator tools surface should behave like a real customer-facing product,
not a demo shell. Core tools must use real generation endpoints, show loading
and error states, avoid hardcoded result payloads, and guide users through
production-safe flows such as empty states, retry paths, and truthful
first-load behavior.

## Relevant Product Docs

- `docs/product/README.md`

## Acceptance Criteria

- AI Assistant routes quick actions to the correct generation endpoints and
  reports success or failure in the conversation.
- Icon Generator uses the live generation pipeline instead of hardcoded result
  URLs.
- Mockup Generator renders real generation output and shows backend failures.
- Video Editor starts from a truthful empty timeline and handles media loading
  errors with retry.
- Image Generator replaces placeholder tutorial copy with actionable guidance
  and keeps typed contract clean.

## Design Notes

- API surfaces:
  - `frontend/src/stores/generation-store.ts`
  - `frontend/src/lib/api/generations.ts`
  - `frontend/src/services/mediaApi.ts`
- UI surfaces:
  - `frontend/src/app/[locale]/(dashboard)/creator/ai-assistant/page.tsx`
  - `frontend/src/app/[locale]/(dashboard)/creator/icon-generator/page.tsx`
  - `frontend/src/app/[locale]/(dashboard)/creator/mockup-generator/page.tsx`
  - `frontend/src/app/[locale]/(dashboard)/creator/video-editor/page.tsx`
  - `frontend/src/app/[locale]/(dashboard)/creator/image-generator/page.tsx`
- Domain rules:
  - Generation state must come from the store or backend, not hardcoded mock
    arrays.
  - Quick actions must map to the correct endpoint for the requested task.
  - Empty states are valid product states and should be explicit.
  - Error states must be visible and actionable.

## Validation

| Layer | Expected proof |
| --- | --- |
| Unit | Generation action mapping and assistant message construction behave correctly. |
| Integration | Live generation endpoints populate `currentGeneration` and clear error states. |
| E2E | Creator tools render loading, error, and result states without demo payloads. |
| Platform | `frontend` build and typecheck remain green. |
| Release | Browser verification of the modified tool routes. |

## Harness Delta

- Added a creator tools hardening story packet.
- Added a test matrix row to track the creator tools contract.
- Replaced mock/demo behavior in the highest-impact creator tools with real or truthful state handling.

## Evidence

- `frontend` `npm run typecheck` passed.
- `frontend` `npm run build` passed.
- Browser verification is still limited by the local environment showing a proxy/firewall error page instead of the app runtime.
