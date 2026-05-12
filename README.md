# AI Generator

AI Generator is a full-stack AI creation platform with a Next.js frontend, a NestJS backend, and a small MCP server for tooling integration.

The repository follows the Harness v0 operating model. Product behavior lives in `docs/product/*`, implementation work is tracked in `docs/stories/*`, and proof is mapped in `docs/TEST_MATRIX.md`.

## What Is In This Repo

- `frontend/`: Next.js 16 UI for dashboards, creator tools, social surfaces, billing, and workspace management.
- `backend/`: NestJS API with PostgreSQL, Redis/BullMQ, S3-compatible storage, authentication, and service entrypoints for the split runtime.
- `mcp-server/`: MCP bridge used by local tooling.
- `docker/`: Docker and compose layout for the platform stack.
- `docs/`: Harness docs, product contracts, stories, decisions, and validation proof.
- `scripts/`: Setup scripts for local GPU workflows.

## Current Product Areas

The live docs and test matrix currently cover these areas:

- Platform hardening
- Social Hub
- Notifications
- Community Marketplace
- Creator tools
- Workflow editor and canvas behavior
- Admin-managed content

See [docs/TEST_MATRIX.md](docs/TEST_MATRIX.md) for the current implementation and proof status of each area.

## Local Setup

1. Install dependencies in each workspace that you plan to run:

   ```powershell
   cd frontend; npm install
   cd ..\backend; npm install
   cd ..\mcp-server; npm install
   ```

2. Review environment examples before starting local services:

   - `.env.example`
   - `.env.social.example`
   - `backend/.env`
   - `frontend/.env`
   - `docker/.env.example`

3. Read [AGENTS.md](AGENTS.md) for the repo operating rules and [docs/FEATURE_INTAKE.md](docs/FEATURE_INTAKE.md) before starting work on a feature.

## Run Locally

Frontend:

```powershell
cd frontend
npm run dev
```

Backend:

```powershell
cd backend
npm run start:dev
```

MCP server:

```powershell
cd mcp-server
npm run dev
```

## Validation

Use the smallest relevant checks for the area you are changing:

- Frontend: `npm run typecheck`, `npm run build`, `npm run lint`
- Backend: `npm run build`, `npm run test`, `npm run test:e2e`
- Docker/runtime checks: see [docs/docker-architecture.md](docs/docker-architecture.md)

## Local GPU Quick Start

If you want image and video generation to use a local NVIDIA GPU:

1. Download the model files:

   ```powershell
   powershell -ExecutionPolicy Bypass -File .\scripts\download-local-ai-models.ps1
   ```

2. Start the full stack:

   ```powershell
   powershell -ExecutionPolicy Bypass -File .\scripts\start-local-ai.ps1
   ```

3. Open:

   - `http://localhost`
   - `http://localhost:8188`

The stack is wired to ComfyUI through `docker/.env`, and generated image URLs are rewritten so the browser can open the result directly.

### 16 GB GPU Fit

For an RTX 5070 Ti class card with 16 GB VRAM, the current practical baseline is:

- `SDXL base 1.0` for the image workflow already checked into `docker/comfyui-workflows/`.
- `FLUX.1-schnell` if you want a faster local image model.
- `FLUX.1-dev` in FP8 form if you want the higher-quality FLUX path and can afford a heavier setup.
- `Stable Diffusion 3.5 Medium` if you want a newer balanced model and accept a larger model bundle.

Use lower-precision encoders when VRAM gets tight. The ComfyUI guidance cited in the repo recommends `fp8` text encoders for lower memory use and `fp32` VAE for users with 16 GB+ VRAM who want the highest quality.

## Documentation Index

- [docs/README.md](docs/README.md): documentation map and navigation
- [docs/product/README.md](docs/product/README.md): current product contracts
- [docs/stories/README.md](docs/stories/README.md): story packet guidance
- [docs/HARNESS.md](docs/HARNESS.md): Harness operating model
- [docs/FEATURE_INTAKE.md](docs/FEATURE_INTAKE.md): how prompts become work
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): architecture discovery and boundary rules
- [docs/TEST_MATRIX.md](docs/TEST_MATRIX.md): behavior-to-proof map
- [docs/decisions/README.md](docs/decisions/README.md): architecture and contract decisions
- [docs/HARNESS_BACKLOG.md](docs/HARNESS_BACKLOG.md): harness improvements

## Working Notes

- The root working agreement is [AGENTS.md](AGENTS.md).
- Story work should start from [docs/stories/backlog.md](docs/stories/backlog.md) or the relevant story packet.
- When a behavior changes, update the product doc, the story packet, and the test matrix together.
