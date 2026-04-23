## Context

This repository already contains a valid `openspec/` installation and passes strict OpenSpec validation, which means the main problem is not OpenSpec schema compliance itself. The larger issue is repository drift around that valid core:

- the git worktree is already mid-migration from legacy `specs/` to `openspec/`
- many public and internal docs still point to deleted `specs/` paths
- GitHub Pages content is polished but still behaves like a README mirror
- GitHub repository metadata is incomplete or partially inaccurate
- local and CI quality expectations are misaligned (`golangci-lint` v2 config, v1 local binary)
- project-specific AI and editor integration layers are mostly absent

The user wants an aggressive cleanup oriented toward finishing the project cleanly, minimizing future maintenance cost, and handing later implementation to OpenSpec-driven tooling or autopilot sessions.

## Goals / Non-Goals

**Goals:**
- Make `openspec/` the only source of truth for requirements and workflow.
- Establish a concise, project-specific governance layer for humans and AI agents.
- Reduce automation and maintenance noise while preserving high-value quality checks.
- Rebuild GitHub Pages and repository metadata so the public surfaces accurately present the project.
- Identify and fix defects uncovered during the cleanup.
- Leave the repository ready for a focused `/opsx:apply stabilize-project-closeout` execution.

**Non-Goals:**
- Adding new runtime product features such as SFU support, mobile apps, or persistence.
- Preserving every historical or redundant document if it no longer serves the closeout goal.
- Creating a large matrix of vendor-specific editor/AI configs without project-specific value.
- Expanding MCP usage simply because it is available.

## Decisions

### 1. Treat closeout as new governance capabilities, not as runtime spec edits

The cleanup mostly changes how the repository is governed, documented, and presented. Instead of forcing these concerns into runtime specs like `platform`, `signaling`, or `frontend`, this change introduces dedicated capabilities for governance and presentation.

**Alternatives considered:**
- Modify `platform` to absorb governance rules. Rejected because it mixes runtime behavior with repository operations.
- Avoid specs and only edit docs/config. Rejected because the user explicitly wants OpenSpec-driven closeout work.

### 2. Prefer consolidation and deletion over layered migration

Where legacy files duplicate or contradict the new source of truth, the default action should be to merge, rewrite, archive, or remove them rather than preserve both generations.

**Alternatives considered:**
- Keep legacy docs and add warning notes. Rejected because it preserves drift and increases maintenance burden.
- Soft-migrate over many phases. Rejected because the user wants a fast closeout trajectory.

### 3. Keep only low-noise, high-value automation

The repository should converge on a minimal workflow set: core validation, Pages publishing, and only the dependency/update automation that remains worth maintaining in a closeout-stage project.

**Alternatives considered:**
- Retain broad security and workflow fan-out by default. Rejected because it creates noise and ongoing upkeep.
- Remove nearly all automation. Rejected because a baseline quality gate is still needed for archive-ready stability.

### 4. Centralize AI guidance in a small number of authoritative surfaces

`AGENTS.md`, `CLAUDE.md`, and a project-level Copilot instruction file should become the main AI guidance surfaces. Any extra config for editor or vendor tooling must be justified by clear repository value.

**Alternatives considered:**
- Separate full guidance packs for every tool. Rejected because that creates configuration drift.
- Keep only one generic agent file. Rejected because the user wants tool-aware, project-specific guidance.

### 5. Use minimal editor/LSP configuration and be conservative with MCP

Repository-level LSP config should support Go and JavaScript authoring where Copilot CLI can benefit, but without introducing a large editor framework. MCP additions should only be considered when they provide clear net value over skills/CLI features and do not create heavy context or maintenance cost.

**Alternatives considered:**
- Add many MCP servers up front. Rejected because the user explicitly called out context and maintenance costs.
- Skip LSP config entirely. Rejected because the user asked for a best-fit setup and Copilot CLI supports `.github/lsp.json`.

### 6. Sequence the work from authority -> automation -> presentation -> defect sweep

The cleanup should first settle the source of truth and repository governance, then simplify automation, then rebuild Pages and GitHub metadata, and finally run a defect sweep against the stabilized structure.

**Alternatives considered:**
- Start with Pages cosmetics first. Rejected because content and navigation authority are still unstable.
- Start with bug fixing before governance cleanup. Rejected because many bugs are likely symptoms of structural drift.

## Risks / Trade-offs

- **Aggressive deletion removes useful history** -> Keep only concise, high-signal history in primary surfaces and archive the rest where needed.
- **Pages/navigation rewrites can break links** -> Preserve stable public entry points and add redirects or updated navigation deliberately.
- **Workflow simplification may reduce coverage** -> Map retained workflows directly to the commands that already prove real project health.
- **AI/config additions can become another source of drift** -> Keep one canonical guidance layer plus only the smallest justified tool-specific additions.
- **Working tree already contains user changes** -> Treat the current worktree as the baseline and avoid overwriting unrelated user edits.

## Migration Plan

1. Audit and replace all stale `/specs/`, `.meta/`, and outdated workflow references.
2. Redesign governance docs and add minimal tool configs (Copilot instructions, LSP, hooks) around the OpenSpec closeout flow.
3. Simplify CI/dependency automation and align toolchain expectations across local and CI paths.
4. Rebuild Pages IA and GitHub repository metadata using the new authoritative messaging.
5. Run full validations, repair discovered defects, and prepare the change for implementation and later archive.

## Open Questions

- Which legacy changelog artifacts should remain directly navigable versus moved out of primary navigation?
- Whether bilingual parity should be maintained for every public page or reduced to the highest-value entry points during closeout.
- Whether Dependabot should remain enabled at a lower cadence or be simplified further for archive-stage maintenance.
