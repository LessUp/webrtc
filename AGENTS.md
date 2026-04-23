# AGENTS.md

Repository guidance for AI coding agents working on **LessUp WebRTC**.

## Project snapshot

- **Purpose:** a polished, learning-oriented WebRTC demo with a Go signaling server and a vanilla JavaScript client
- **Runtime scope:** WebSocket signaling, 1:1 and small-room mesh calling, DataChannel chat, screen share, browser-side recording
- **Primary backend:** `cmd/server/main.go`, `internal/signal/`
- **Primary frontend:** `web/index.html`, `web/src/`
- **Public site:** Jekyll Pages from the repository root
- **Source of truth:** `openspec/`

## Non-negotiable rules

1. `openspec/` is the only spec and change-management authority.
2. Do not reintroduce the legacy `/specs/` tree or `.meta/` conventions.
3. Keep the repo in **closeout mode**: favor clarity, consolidation, and low-maintenance choices over new scope.
4. Public docs must stay polished. Do not mention private archive or reduced-maintenance intent.
5. Prefer deletion or consolidation of stale assets over keeping duplicate generations of docs/config.

## Repository map

```text
cmd/server/main.go          Go entrypoint and HTTP serving
internal/signal/            Signaling hub, message validation, tests
web/src/core/app.js         Frontend entrypoint
web/src/controllers/        Media, peers, signaling, stats, UI
web/src/config.js           Browser config and capabilities
docs/                       Public docs rendered by Pages
openspec/specs/             Main capability specs
openspec/changes/           Proposed or active changes
.github/workflows/          CI and Pages automation
```

## Working model

### 1. Start from OpenSpec

- For any meaningful change, begin with an OpenSpec change under `openspec/changes/<name>/`.
- Read `proposal.md`, `design.md`, `tasks.md`, and any delta specs before editing code.
- When runtime or repository behavior changes, update the relevant OpenSpec artifacts.

### 2. Use a tight execution loop

Recommended flow:

1. `/plan` or equivalent planning for cross-file work
2. implement the active OpenSpec tasks
3. run targeted validation
4. use `/review` before merge or before declaring the closeout batch complete

### 3. Keep agent usage deliberate

- **Autopilot:** good after tasks are explicit and bounded by an OpenSpec change
- **`/fleet`:** opt-in only; avoid by default because this repo benefits more from longer focused sessions than parallel churn
- **`/remote` and `/research`:** useful when GitHub context or external facts are needed, but avoid them for simple local work
- **MCP/plugin additions:** do not add by default; the built-in GitHub integration plus repository instructions are enough for this project

## Tool-specific guidance

### Copilot CLI

- Primary repo instructions live in `.github/copilot-instructions.md`
- Repo-level LSP config belongs in `.github/lsp.json`
- Prefer `/review` for final signal rather than inventing extra review flows

### Claude Code

- `CLAUDE.md` should stay shorter than this file and point back here for project-wide rules
- `.claude/settings.json` should remain minimal and only enforce fast, predictable checks

### OpenCode and other agentic CLIs

- Consume `AGENTS.md` as the canonical project brief
- Do not add extra repo-specific OpenCode config unless there is a stable, documented need

## Validation commands

Use the existing commands already supported by the repo:

```bash
make check
cd web && npm test
cd e2e && npm test
openspec validate --all --strict
```

## Documentation and Pages expectations

- Pages is a project site, not a README mirror.
- `docs/index.md` is the docs hub.
- `docs/specs*.md` is the public entrypoint for OpenSpec material.
- If a page links to specs, it should link to current `openspec/` content or to the curated public spec hub.
- Avoid outdated module names like `web/app.js` or `app.*.js`; use the real `web/src/` structure.

## Closeout quality bar

A change is only complete when:

- code, docs, and navigation agree with the current structure
- automation and local instructions match the actual toolchain
- GitHub metadata matches the site and the implementation
- the OpenSpec change is ready to apply or archive without ambiguity
