# Decision 0004: Shared Production Hardening Baseline

## Status

Accepted

## Context

The backend has multiple service entrypoints, and production behavior must be
consistent across all of them. Security and observability drift would be easy to
introduce if each entrypoint kept its own bootstrap rules.

## Decision

Use one shared HTTP bootstrap path for the API, billing service, and generation
service. The shared bootstrap owns:

- reverse proxy trust,
- request ID propagation,
- structured request logging,
- CORS normalization,
- exception filtering,
- validation and serializer setup.

## Consequences

Positive:

- less security drift between services,
- easier incident debugging,
- one place to harden future HTTP behavior.

Negative:

- bootstrap changes affect every service at once,
- the shared layer must remain well tested.

## Follow-up

Remaining auth, ownership, and IDOR hardening should be tracked as separate
stories instead of being hidden inside bootstrap changes.
