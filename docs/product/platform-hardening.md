# Platform Hardening

## Current Behavior

The backend already has some baseline controls such as validation pipes,
throttling, Swagger auth, and an exception filter. However, the production
runtime is still uneven across entrypoints:

- request logging is not consistently structured,
- reverse proxy trust is implicit instead of explicit,
- CORS normalization lives in bootstrap code instead of a reusable security
  helper,
- some public surface areas still need ownership and exposure review,
- production observability is not documented as a first-class contract.

## Target Behavior

All backend entrypoints should share a single hardening baseline:

- strict CORS allow-list handling,
- request IDs propagated from edge to response,
- structured request logs with status, duration, and user context,
- explicit reverse-proxy handling,
- secure defaults for validation and error handling,
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
