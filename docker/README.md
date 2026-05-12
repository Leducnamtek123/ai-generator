# Docker Layout

This folder contains the source-of-truth Docker layout for the repository.

## What is here

- `docker-compose-template.yaml`: layered compose template for the default full stack
- `docker-compose.yaml`: generated main compose snapshot used by `docker compose up -d`
- `docker-compose.middleware.yaml`: middleware-only stack
- `.env.example`: full environment variables
- `middleware.env.example`: middleware-only environment variables
- `generate_docker_compose`: copies the template to a generated compose file
- `build-web.cmd` / `build-web.ps1`: local web image helpers
- `verify-stack.cmd`: quick runtime check helper
- `nginx/`: reverse proxy templates
- `ssrf_proxy/`: sandbox proxy config

## How to use

1. Copy `docker/.env.example` to `docker/.env`.
2. Adjust public URLs, secrets, DB, Redis, and optional profiles.
3. Run the generator if you want to refresh the generated compose snapshot:

   ```bash
   ./docker/generate_docker_compose
   ```

4. Use the middleware-only compose for local backend tooling:

   ```bash
   docker compose --env-file docker/middleware.env.example -f docker/docker-compose.middleware.yaml -p ai-generator up -d
   ```

## Repo mapping

- `api` -> backend gateway runtime
- `worker` -> queue worker
- `billing-service` -> credits and payments boundary
- `generation-service` -> task execution boundary
- `web` -> frontend console
- `landing` -> public landing page
- `postgres`, `redis`, `minio` -> infrastructure services
