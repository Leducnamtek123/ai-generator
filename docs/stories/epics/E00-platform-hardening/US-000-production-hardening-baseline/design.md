# Design

## Domain Model

This story does not introduce new business entities. It introduces a platform
boundary contract for HTTP services:

- request ID,
- trusted edge proxy,
- structured request log,
- normalized CORS allow-list.

## Application Flow

- `main.ts`, `main.billing.ts`, and `main.generation.ts` all call the shared
  HTTP bootstrap.
- The bootstrap attaches request metadata before controllers execute.
- The exception filter returns user-safe errors while operational logs retain
  the request context.

## Interface Contract

- `x-request-id` is accepted on inbound requests when supplied.
- `x-request-id` is echoed back on responses.
- CORS is only enabled for validated origins.
- Request logs include method, path, status, duration, and known user ID.

## Data Model

No new tables are introduced in this story.

## UI / Platform Impact

No immediate UI changes are required, but browser/API clients benefit from more
predictable failures and better traceability.

## Observability

Structured logs should be machine-parsable JSON lines. They should be
correlated by request ID and should include enough context to debug production
errors without exposing secrets.

## Alternatives Considered

1. Keep bootstrap behavior duplicated in multiple files and patch each entrypoint
   separately.
2. Introduce a single shared bootstrap/security helper and use it everywhere.

The second option is preferred because it reduces drift and makes future
security changes harder to miss.
