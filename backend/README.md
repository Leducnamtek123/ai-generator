# Backend

This workspace contains the NestJS API for AI Generator.

## Stack

- NestJS 11
- PostgreSQL via TypeORM
- Redis/BullMQ for queues
- S3-compatible storage
- Swagger/OpenAPI
- Optional MongoDB/Mongoose support for document-style features

## Main Entry Points

- `npm run start:dev`: start the backend in watch mode.
- `npm run build`: compile the backend.
- `npm run start`: run the compiled app.
- `npm run test`: run unit tests.
- `npm run test:e2e`: run end-to-end tests.

## Important Scripts

| Script | Purpose |
| --- | --- |
| `build` | Compile the backend to `dist/` |
| `start:dev` | Run the Nest app with file watching |
| `start:prod` | Run the compiled API |
| `start:billing` | Run the billing entrypoint from `dist/src/main.billing.js` |
| `start:generation` | Run the generation entrypoint from `dist/src/main.generation.js` |
| `lint` | Lint the backend TypeScript files |
| `test` | Run Jest unit tests |
| `test:e2e` | Run backend e2e tests |
| `migration:generate` | Generate a TypeORM migration |
| `migration:run` | Apply database migrations |
| `migration:revert` | Revert the latest migration |
| `seed:run:relational` | Run relational seed data |
| `seed:run:document` | Run document seed data |
| `seed:import:external` | Import external catalog seed data |

## Local Development

1. Copy or adjust `backend/.env` from `backend/.env.example` as needed.
2. Make sure PostgreSQL and Redis are available.
3. Run `npm run start:dev` from this directory.

## Data And Runtime Notes

- The backend contains the shared API gateway/runtime and the split entrypoints
  for billing and generation.
- Database changes should be made through TypeORM migrations.
- Use the docs in [../docs/product](../docs/product) and
  [../docs/TEST_MATRIX.md](../docs/TEST_MATRIX.md) when behavior changes.
