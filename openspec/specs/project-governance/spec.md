## Purpose

Defines the authoritative repository workflow, AI guidance surfaces, local quality automation, and hygiene rules for a closeout-stage OpenSpec project.

## Requirements

### Requirement: OpenSpec is the sole repository authority
The repository SHALL treat `openspec/` as the only authoritative system for specifications, change planning, and implementation workflow.

#### Scenario: Legacy spec references are removed
- **WHEN** repository documents, site pages, templates, or workflow files reference specifications
- **THEN** they SHALL reference `openspec/` paths only
- **AND** stale references to legacy `/specs/` paths or superseded SDD instructions SHALL be removed or rewritten

#### Scenario: Changes start from OpenSpec artifacts
- **WHEN** a maintainer wants to add, modify, or remove repository behavior
- **THEN** the work SHALL start from an OpenSpec change under `openspec/changes/`
- **AND** implementation SHALL not begin until the change has apply-ready artifacts

### Requirement: The repository defines a minimal closeout workflow
The repository SHALL document and enforce a low-noise workflow optimized for stabilization, review, and archive readiness.

#### Scenario: Default closeout flow is documented
- **WHEN** a maintainer reads the repository workflow guidance
- **THEN** it SHALL describe how to use OpenSpec proposal/apply/archive flow together with planning and review steps
- **AND** it SHALL prioritize a single focused execution path over parallel exploratory churn

#### Scenario: Expensive agent modes are constrained
- **WHEN** GitHub Copilot execution modes are documented for this repository
- **THEN** `/fleet` SHALL be treated as opt-in rather than default
- **AND** autopilot SHALL only be recommended after tasks are explicit and review checkpoints are defined

### Requirement: AI guidance is project-specific and consistent
The repository SHALL provide concise, project-specific guidance for supported AI agents without duplicative or contradictory instructions.

#### Scenario: Shared guidance surfaces are aligned
- **WHEN** an AI agent reads `AGENTS.md`, `CLAUDE.md`, or Copilot instruction files
- **THEN** the files SHALL describe the same project architecture, OpenSpec flow, quality expectations, and closeout posture
- **AND** generic filler guidance or duplicated legacy instructions SHALL not remain

#### Scenario: Tool-specific configs are justified
- **WHEN** repository-specific AI or editor configuration is added
- **THEN** it SHALL be justified by this repository's Go and vanilla JavaScript workflow
- **AND** unnecessary vendor-specific configuration sprawl SHALL be avoided

### Requirement: Local quality automation is minimal and explicit
The repository SHALL provide only fast, high-value local automation that reinforces the intended workflow without hidden side effects.

#### Scenario: Hooks target fast closeout checks
- **WHEN** local hooks are defined for the repository
- **THEN** they SHALL focus on fast checks such as formatting, link/path validation, or actionable guidance
- **AND** they SHALL fail clearly instead of silently mutating unrelated files

#### Scenario: Documented tools match supported versions
- **WHEN** repository automation depends on a specific tool version or config format
- **THEN** the repository SHALL document or enforce a compatible version
- **AND** known mismatches between local and CI expectations SHALL be resolved

### Requirement: Governance assets stay intentionally scoped
The repository SHALL aggressively remove or consolidate stale, redundant, or low-signal governance assets.

#### Scenario: Redundant documents are consolidated
- **WHEN** multiple docs repeat the same process or describe superseded workflows
- **THEN** they SHALL be merged, rewritten, archived, or removed
- **AND** each retained governance document SHALL have a clear audience and purpose

#### Scenario: Changelog history is curated for low maintenance
- **WHEN** project history is exposed in primary docs or navigation
- **THEN** the visible changelog structure SHALL be concise and intentionally curated
- **AND** duplicated, placeholder, or low-value entries SHALL not remain in primary navigation
