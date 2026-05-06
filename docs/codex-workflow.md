# Codex Workflow

This repo is set up to work with a Codex-first loop:

1. Read `AGENTS.md`.
2. Inspect the relevant surface docs:
   - `backend/docs/*`
   - `frontend/docs/*`
   - `SecondBrain/*`
3. Use the configured MCP tools in `.codex/config.toml`.
4. Make the smallest safe change.
5. Validate with the repo's own commands.
6. Record durable decisions in the Obsidian vault.

## Practical Notes

- `frontend/.mcp.json` already exposes the Next.js devtools MCP hint for frontend work.
- `Obsidian Home.md` is the vault entry point for human-readable notes.
- `SecondBrain/` is the place to record ongoing project decisions, debugging notes, and handoff context.

## Recommended Working Order

1. Frontend or backend docs first.
2. Code second.
3. Tests or lint last.
4. Vault note after the work is verified.

