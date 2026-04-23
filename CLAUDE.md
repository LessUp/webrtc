# CLAUDE.md

Use `AGENTS.md` as the primary project brief.

## Repo essentials

- Specs and change flow live in `openspec/`
- Backend entry: `cmd/server/main.go`
- Signaling core: `internal/signal/`
- Frontend entry: `web/src/core/app.js`
- Public docs and Pages source: `docs/`, `index*.md`, `_layouts/`, `_includes/`, `_config.yml`

## Working rules

1. Do not bring back legacy `/specs/` paths or `.meta/` conventions.
2. Prefer small, high-signal closeout work over new features or framework additions.
3. Keep public docs polished and accurate; never mention private archive intentions.
4. Use the existing commands:
   - `make check`
   - `cd web && npm test`
   - `cd e2e && npm test`
   - `openspec validate --all --strict`
5. Use `/review` before merge or before calling a major cleanup batch complete.

## Local automation

- Optional repo hook path: `git config core.hooksPath .githooks`
- Claude-specific hooks live in `.claude/settings.json` and must stay fast and predictable
