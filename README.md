# AI Generator Project

This project is a web application with a backend and frontend, now integrated with the **Harness v0** collaboration model.

## Local GPU Quick Start

If you want image and video generation to use your local NVIDIA GPU:

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

The stack is already wired to ComfyUI in `docker/.env`, and the image result URL is rewritten to `http://localhost:8188` so the browser can open the generated file directly.

## Project Structure

- `frontend/`: React/Next.js frontend.
- `backend/`: Node.js/Express backend.
- `docs/`: Project documentation and Harness artifacts.
  - `docs/product/`: Product contract files.
  - `docs/stories/`: Story packets and backlog.
  - `docs/decisions/`: Architecture decisions and tradeoffs.
  - `docs/templates/`: Reusable templates for stories, decisions, etc.
- `scripts/`: Project scripts.

## Collaboration Model

This project follows the Harness v0 operating model for human-agent collaboration.

- **Entrypoint**: See [AGENTS.md](AGENTS.md) for operating rules.
- **Workflow**: Requests are classified via [docs/FEATURE_INTAKE.md](docs/FEATURE_INTAKE.md) and turned into stories in [docs/stories/](docs/stories/).
- **Proof**: Behavior-to-proof mapping is tracked in [docs/TEST_MATRIX.md](docs/TEST_MATRIX.md).

## Getting Started

1. Check [AGENTS.md](AGENTS.md) to understand the agent operating model.
2. Review the current backlog in [docs/stories/backlog.md](docs/stories/backlog.md).
3. Follow the feature intake process in [docs/FEATURE_INTAKE.md](docs/FEATURE_INTAKE.md) for new work.

## Development

- Frontend: `npm run dev` inside `frontend/`.
- Backend: `npm run dev` inside `backend/`.
- Docker: See `docker/` for containerization setup.
