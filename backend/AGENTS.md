# Backend Agent Rules

## Scope
- Apply this file when working inside `backend/`.
- Follow the root [AGENTS.md](../AGENTS.md) first.
- Treat `backend/docs/` and the NestJS source as the source of truth.

## Working Rules
- Prefer the smallest backend-only change that solves the request.
- Read `backend/docs/readme.md`, `backend/docs/architecture.md`, `backend/docs/auth.md`, and `backend/docs/database.md` before changing backend behavior.
- Preserve the existing NestJS structure, TypeORM patterns, and migration workflow.
- When schema changes are involved, update migrations and validate them.
- When API behavior changes, check the request/response contract and side effects.

## Validation
- Use the backend package scripts for lint, test, build, or migration validation when relevant.
- Do not claim an API fix without checking the actual runtime path.

