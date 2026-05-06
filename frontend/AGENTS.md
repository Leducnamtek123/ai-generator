# Frontend Agent Rules

## Scope
- Apply this file when working inside `frontend/`.
- Follow the root [AGENTS.md](../AGENTS.md) first.
- Treat `frontend/docs/`, `frontend/.mcp.json`, and the Next.js source as the source of truth.

## Working Rules
- Read `frontend/docs/components-shadcn-rules.md` and `frontend/docs/form-field-rules.md` before changing UI code.
- Use the existing Next.js 16, React 19, and shadcn patterns in this repo.
- Prefer edits that preserve the established UI language and component patterns.
- Use the browser and Next.js devtools MCP tooling when you need local UI verification.

## Validation
- Use the frontend package scripts for lint, typecheck, build, and Playwright checks when relevant.
- Verify visual or interaction changes in the browser when possible.

