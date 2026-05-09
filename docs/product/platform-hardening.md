# Platform Hardening

## Current Behavior

The backend now has a shared production baseline across entrypoints:

- request logging is structured and correlated by request ID,
- reverse proxy trust is explicit in deployed bootstraps,
- CORS normalization lives in a reusable security helper,
- queue health and dead-letter recovery are available to operators,
- production observability is documented as a first-class contract.

## Target Behavior

All backend entrypoints should share a single hardening baseline:

- strict CORS allow-list handling,
- request IDs propagated from edge to response,
- structured request logs with status, duration, and user context,
- explicit reverse-proxy handling,
- secure defaults for validation and error handling,
- queue observability, dead-letter recovery, and retry-safe job handling,
- a documented path for remaining auth, ownership, and IDOR hardening work.

## Affected Users

- API consumers.
- Frontend clients.
- Operators and on-call responders.
- Developers shipping backend services.

## Affected Product Docs

- `docs/product/platform-hardening.md`
- `docs/product/README.md`

## Non-Goals

- Rewriting every controller in one pass.
- Changing the public API shape unless a security fix requires it.
- Replacing the current auth/session model.
