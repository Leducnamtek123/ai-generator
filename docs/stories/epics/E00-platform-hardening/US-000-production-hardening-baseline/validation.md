# Validation

## Proof Strategy

The story is complete when the shared bootstrap behavior is covered by unit
tests, the queue recovery surface is live, and the backend build still
succeeds.

## Test Plan

| Layer | Cases |
| --- | --- |
| Unit | CORS normalization, request ID propagation, bootstrap configuration. |
| Integration | Shared bootstrap is applied to the API, billing, and generation entrypoints. |
| E2E | Not required for the bootstrap slice. |
| Platform | Startup smoke proves request IDs and proxy settings are initialized. |
| Performance | Not required for this slice. |
| Logs/Audit | Request logs include request ID, response status, duration, and user context. |

## Fixtures

- Mock ConfigService values for frontend domain and node environment.
- Mock Nest application and HTTP adapter instances.

## Commands

```text
npm run build
npm test -- --runInBand
docker compose -f docker-compose.yaml up -d --no-deps --build api
curl http://localhost:8000/api/health
curl http://localhost:8000/api/health/queues
```

## Acceptance Evidence

Verified:

- `npm run build` passed in `backend/`.
- `npm test -- --runInBand` passed in `backend/` with `41/41` suites and `103/103` tests.
- Docker API rebuilt successfully and started cleanly.
- `GET /api/health` returned DB and memory status.
- `GET /api/health/queues` returned live counts for generation, workflow, social posting, social analytics, visual flow, and dead-letter queues.
- `POST /api/v1/admin/queues/dead-letter/:jobId/requeue` successfully recovered a seeded dead-letter job back into the `generation` queue.
