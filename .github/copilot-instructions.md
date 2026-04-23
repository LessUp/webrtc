# Copilot instructions for LessUp WebRTC

- Treat `openspec/` as the only source of truth for requirements and change workflow. Do not reintroduce the legacy `/specs/` layout.
- Use `openspec/changes/<name>/` artifacts before implementation. For multi-step work, keep tasks aligned with the active OpenSpec change.
- This repository is in closeout mode: prefer small, high-signal edits that improve correctness, coherence, and maintainability over new features or clever abstractions.
- Keep public messaging stable and polished. Do not mention private archive or reduced-maintenance intent in README, docs, Pages, or repository metadata.
- Prefer the existing stack: Go standard library + Gorilla WebSocket on the backend, vanilla JavaScript ES modules on the frontend, Jekyll for Pages.
- Keep automation minimal. Avoid adding new tools, plugins, MCP servers, or editor-specific config unless they clearly help this repository.
- Use these validation commands when relevant:
  - `make check`
  - `cd web && npm test`
  - `cd e2e && npm test`
  - `openspec validate --all --strict`
- Before changing public docs or navigation, verify paths against the real code tree:
  - backend entry: `cmd/server/main.go`
  - signaling core: `internal/signal/`
  - frontend entry: `web/src/core/app.js`
  - specs: `openspec/specs/`
- When editing docs, templates, YAML, or metadata, fail closed on stale references such as `/specs/` or `.meta/`.
