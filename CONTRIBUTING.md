---
layout: default
title: Contributing — WebRTC
description: Contribution workflow for LessUp WebRTC using OpenSpec, focused reviews, and low-noise closeout practices.
---

[← Back to Home]({{ site.baseurl }}/)

# Contributing

This repository uses **OpenSpec** for planning and change control. Contributions should keep the project coherent, low-noise, and easy to maintain.

## Before you start

1. Read the relevant spec in `openspec/specs/`.
2. If behavior or scope needs to change, create or update an OpenSpec change in `openspec/changes/`.
3. Keep the change focused. This repo prefers a single clean result over many parallel branches or speculative experiments.

## Recommended flow

1. **Plan the work**
   - Use `/plan` or write out the implementation approach locally for multi-file work.
   - If a change already exists, read `proposal.md`, `design.md`, and `tasks.md`.

2. **Implement against the active change**
   - Follow the task order in `openspec/changes/<name>/tasks.md`.
   - Update docs/config with the code so the repo stays coherent.

3. **Validate**
   - `make check`
   - `cd web && npm test`
   - `cd e2e && npm test` when UI or signaling behavior changes
   - `openspec validate --all --strict`

4. **Review**
   - Run `/review` before merge or before shipping a large cleanup batch.
   - Note any intentional deletions, consolidations, or trade-offs in the PR description.

## Branching and merge style

- Prefer short-lived branches.
- Merge quickly once the OpenSpec tasks and review are complete.
- Avoid accumulating many local/cloud branches waiting to be reconciled.
- Avoid `/fleet` by default; longer focused sessions fit this project better.

## Optional local hook setup

The repo includes a lightweight pre-commit hook:

```bash
git config core.hooksPath .githooks
```

The hook:

- formats staged Go files with `gofmt`
- blocks staged docs/config files that still reference legacy `/specs/` or `.meta/`

## Tooling expectations

| Area | Current expectation |
|:-----|:--------------------|
| Go | 1.22+ |
| Frontend | Vanilla JavaScript ES modules |
| Lint | `golangci-lint` v2 config |
| Specs | `openspec/` only |
| Pages | Jekyll from repository root |

## Pull requests

- Reference the active OpenSpec change when relevant.
- Keep PR scope narrow.
- If you delete or consolidate docs, explain why.
- Make sure public docs do not expose private maintenance or archive intentions.

Thanks for helping keep the project clean and stable.
