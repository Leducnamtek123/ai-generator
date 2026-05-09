# Overview

## Current Behavior

The shared backend bootstrap now covers the durable production baseline for
structured logs, proxy trust, consistent origin handling, queue observability,
and dead-letter recovery. The remaining hardening work is now documented as
follow-up scope rather than a blocker on the baseline itself.

## Target Behavior

Every backend service should start with the same hardening primitives:

- normalized CORS allow-lists,
- request IDs on inbound and outbound HTTP traffic,
- structured request logs for operational tracing,
- explicit proxy trust in deployed environments,
- documented follow-up work for ownership checks and IDOR-prone routes.

## Affected Users

- Operators.
- Backend developers.
- Frontend developers consuming API contracts.

## Affected Product Docs

- `docs/product/platform-hardening.md`

## Non-Goals

- Full auth model redesign.
- Large-scale controller refactors unrelated to platform safety.

## Evidence

- `backend/src/bootstrap/security.ts` normalizes inbound request IDs, rejects unsafe request-id headers, and echoes the ID back on the response.
- `backend/src/bootstrap/http-bootstrap.ts` explicitly configures `trust proxy` in deployed bootstraps.
- `frontend/src/lib/api.ts` attaches an outbound `x-request-id` header and mirrors the response header back into error handling.
- `backend/src/generations/generations.controller.ts` now threads the request ID into direct generation metadata so idempotency survives the HTTP boundary.
- `backend/src/workflows/workflows.service.ts` and `backend/src/workflows/engine/workflow.processor.ts` persist workflow execution snapshots and expose execution history for later inspection.
- `backend/src/bootstrap/security.spec.ts` and `backend/src/bootstrap/http-bootstrap.spec.ts` already cover the request-id and proxy-trust contract.
- `backend/src/queues/queue-reliability.service.ts`, `backend/src/health/queue-health.service.ts`, and `backend/src/admin/admin-queue.service.ts` provide queue retry/backoff defaults, dead-letter archiving, live queue snapshots, and admin recovery for failed jobs.
- `backend/src/bootstrap/security.spec.ts` now covers structured request log output, including request ID, response status, user context, and duration.
