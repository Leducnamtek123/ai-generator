# US-006 Community Marketplace Production Hardening

## Status

implemented

## Lane

normal

## Product Contract

The Community Marketplace must behave like a production listing surface. Buyers
need a clear browse experience with truthful previews, searchable type filters,
and visible pricing. Creators need a publish flow that uses the real template
type vocabulary, validates required fields, and makes it obvious what will be
published.

## Relevant Product Docs

- `docs/product/community-marketplace.md`
- `docs/product/social-hub.md`

## Acceptance Criteria

- The marketplace grid shows title, creator, type, price, tags, and a preview
  state even when no thumbnail exists.
- Template type labels are explicit and consistent across browse and publish
  flows.
- The publish form validates required fields and explains how each input affects
  the listing.
- Draft vs published state is visible in the creator-side listing panel.
- Buyer purchase flow still opens the purchased template after a successful
  checkout.

## Design Notes

- UI surfaces:
  - `frontend/src/app/[locale]/(dashboard)/community/page.tsx`
  - `frontend/src/components/community/CommunityMarketplacePanel.tsx`
- API surfaces:
  - `frontend/src/services/communityMarketplaceApi.ts`
  - `backend/src/community-marketplace/*`
- Domain rules:
  - Use canonical `TemplateTypeEnum` values for all create and filter paths.
  - Keep price and fee math visible in the UI so creators understand the split.
  - Treat empty thumbnails as a normal state with a deliberate fallback.

## Validation

| Layer | Expected proof |
| --- | --- |
| Unit | Pure formatting helpers keep type labels, tag parsing, and preview text stable. |
| Integration | Marketplace create/purchase contract remains aligned with backend payloads. |
| E2E | Browser verification covers browse cards, type filters, and publish form states. |
| Platform | `frontend` build and typecheck remain green. |
| Release | Manual browser smoke on the Community route after deploy. |

## Harness Delta

- Added a dedicated Community Marketplace product contract.
- Added a story packet for the production hardening pass.
- Updated the test matrix to track the Community Marketplace contract.

## Evidence

- `backend/src/community-marketplace/community-marketplace.controller.ts` exposes browse, mine, detail, create, update, delete, and purchase routes.
- `backend/src/community-marketplace/community-marketplace.service.ts` implements real browse/publish/purchase logic, canonical type mapping, preview fallback, and credit-reserved checkout.
- `backend/src/community-marketplace/community-marketplace.service.spec.ts` now proves purchase runs inside a single transaction, rolls back on insufficient credits, and posts all ledger entries atomically.
- `frontend/src/services/communityMarketplaceApi.ts` and `frontend/src/components/community/CommunityMarketplacePanel.tsx` are wired to the live contract, including type filters, preview states, draft/live states, and post-purchase routing.
- `frontend` `npm run typecheck` and `npm run build` passed in this sweep.
- Browser verification after sign-in covered the Community browse cards, type filters, publish form controls, and the live filter/search state changes on the marketplace surface.
