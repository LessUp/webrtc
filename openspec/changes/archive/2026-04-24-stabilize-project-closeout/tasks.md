## 1. Canonicalize repository authority

- [x] 1.1 Audit all remaining `/specs/`, `.meta/`, and superseded SDD references, then classify each as rewrite, redirect, archive, or delete
- [x] 1.2 Rewrite the core authority documents (`AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING.md`, `README.md`, `README.zh-CN.md`) so `openspec/` is the only workflow and specification authority
- [x] 1.3 Repair site templates, Pages config, and documentation links so public navigation points only to live `openspec/` content and current public pages

## 2. Rebuild governance and AI/tooling guidance

- [x] 2.1 Design minimal project hooks and local automation for fast, high-value checks that fit closeout-mode development
- [x] 2.2 Add project-level Copilot instructions and rationalize Claude/Copilot/OpenCode-facing guidance into a small, consistent set of files
- [x] 2.3 Add repository LSP configuration and any justified workspace defaults for Go and vanilla JavaScript authoring
- [x] 2.4 Document the closeout workflow covering OpenSpec proposal/apply/archive, planning, review checkpoints, autopilot use, and limited `/fleet` usage

## 3. Simplify engineering automation

- [x] 3.1 Reduce GitHub Actions to a low-noise set of high-value workflows, with cleaned triggers, permissions, and maintenance cost
- [x] 3.2 Align local and CI toolchain expectations, especially linting/version pinning, so documented commands match supported tool versions
- [x] 3.3 Reassess dependency update automation and related engineering config for archive-stage maintenance

## 4. Rebuild public presentation surfaces

- [x] 4.1 Redesign the GitHub Pages landing page and documentation information architecture so the site explains and promotes the project instead of mirroring the README
- [x] 4.2 Prune or consolidate stale docs, redundant release notes, and low-signal changelog content while preserving the useful history
- [x] 4.3 Use `gh` to set accurate repository description, homepage, and topics after the site message and canonical URLs are finalized

## 5. Stabilize and validate the baseline

- [x] 5.1 Run the repository checks, fix code/docs/build/test defects uncovered by the cleanup, and keep repairs within the current product scope
- [x] 5.2 Resolve GitHub Pages build, navigation, and link integrity issues introduced by the migration and content consolidation
- [x] 5.3 Re-run OpenSpec validation and project health checks, then leave the change ready for `/opsx:apply stabilize-project-closeout`
