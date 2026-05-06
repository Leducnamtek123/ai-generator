# Service Split Plan

## Goal

Split the platform into two first-class services for the money and compute boundaries:

- `billing-service`
- `generation-service`

Keep the existing API gateway for shared and later-split domains.

## Responsibilities

### billing-service

Owns all money-facing flows:

- payment checkout
- payment return/IPN handling
- credit balance
- credit ledger / transaction history
- refunds and admin adjustments

Main routes:

- `/api/v1/payments/*`
- `/api/v1/credits/*`

### generation-service

Owns all compute-facing flows:

- task execution
- cost reservation / deduction
- async processing
- failure events and refund triggers
- generation history

Main routes:

- `/api/v1/generations/*`
- `/api/v1/workflows/*`
- `/api/v1/queues/*`

### api gateway

Keeps shared platform concerns for now:

- auth/session bootstrapping
- dashboard aggregation
- organizations / members / invites
- social hub
- other shared domain routes

## Routing Rules

Frontend proxy routes requests by path:

- `/api/payments` and `/api/credits` -> `billing-service`
- `/api/generations`, `/api/workflows`, `/api/queues` -> `generation-service`
- everything else -> gateway

## Current Implementation Notes

- The new services use the same database and shared auth stack for now.
- This keeps the split deployable without forcing a data-model migration on day one.
- The next step after this split is to move ledger writes behind a billing API client and remove direct credit writes from generation code.
- The broader Docker layering guidance for this repo lives in [docs/docker-architecture.md](C:/Users/leduc/Documents/ai-generator/docs/docker-architecture.md).
