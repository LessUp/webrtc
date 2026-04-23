## Why

The repository has completed only part of its migration to OpenSpec. The main `openspec/` directory validates successfully, but the rest of the project still contains legacy spec references, stale documentation structure, noisy engineering configuration, inaccurate GitHub metadata, and Pages content that does not clearly present the project.

This cleanup is needed now because the project is entering a closeout phase: it should become coherent, low-maintenance, and archive-ready without introducing new product scope.

## What Changes

- Complete the migration so `openspec/` is the only authoritative specification and workflow system.
- Rebuild repository governance documents, AI instruction files, hooks, and contributor flow around a minimal closeout-oriented process.
- Simplify GitHub Actions, dependency/update policy, and toolchain pinning so maintenance overhead and workflow noise are reduced.
- Redesign GitHub Pages and public documentation so they present the project clearly instead of mirroring README content.
- Normalize GitHub repository metadata and topics through `gh` so the public project profile matches the actual implementation.
- Sweep and fix defects discovered during the governance, docs, automation, and presentation cleanup.

## Capabilities

### New Capabilities
- `project-governance`: Defines the authoritative repository workflow, AI guidance surfaces, local quality automation, and hygiene rules for a closeout-stage OpenSpec project.
- `project-presentation`: Defines GitHub Pages, public documentation IA, and GitHub repository metadata requirements for accurately presenting the project.

### Modified Capabilities

None.

## Impact

- `AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING.md`, `README.md`, `README.zh-CN.md`
- `openspec/` specifications and future change workflow
- GitHub Pages source files (`index.md`, `docs/`, `_layouts/`, `_includes/`, `_config.yml`, `404.md`)
- `.github/workflows/*`, `.github/*` governance files, dependency update policy
- Project-level AI/tooling config such as Copilot instructions, LSP config, and hooks
- GitHub repository metadata managed through `gh`
- Any code/config/tests that fail or drift during the cleanup
