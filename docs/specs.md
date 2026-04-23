---
layout: docs
title: OpenSpec Hub — WebRTC
description: Public map of the main OpenSpec capabilities and change workflow for LessUp WebRTC.
---

# OpenSpec Hub

`openspec/` is the repository's only source of truth for requirements and change planning.

## Main capability specs

| Capability | Purpose | Source |
|:-----------|:--------|:-------|
| Platform | Product scope, capabilities, and security expectations | [platform/spec.md](https://github.com/LessUp/webrtc/blob/main/openspec/specs/platform/spec.md) |
| Signaling | WebSocket lifecycle, room rules, relay behavior, limits | [signaling/spec.md](https://github.com/LessUp/webrtc/blob/main/openspec/specs/signaling/spec.md) |
| Frontend | Browser module boundaries and client behavior | [frontend/spec.md](https://github.com/LessUp/webrtc/blob/main/openspec/specs/frontend/spec.md) |
| API | HTTP endpoints, message schema, and error codes | [api/spec.md](https://github.com/LessUp/webrtc/blob/main/openspec/specs/api/spec.md) |
| Storage | In-memory state model and concurrency assumptions | [storage/spec.md](https://github.com/LessUp/webrtc/blob/main/openspec/specs/storage/spec.md) |
| Testing | Expected validation surfaces and test categories | [testing-spec.feature](https://github.com/LessUp/webrtc/blob/main/openspec/testing-spec.feature) |

## Change workflow

Runtime or repository changes should move through `openspec/changes/<name>/`:

1. **proposal.md** — why the change is needed
2. **design.md** — implementation approach and trade-offs
3. **specs/** — added or modified requirements
4. **tasks.md** — implementation checklist

## Public workflow summary

- use OpenSpec to define the change
- implement against the change tasks
- validate with repo checks
- review before merge
- archive the change once implementation and spec sync are complete

## Current cleanup change

The repository-wide closeout cleanup is tracked in:

- [`openspec/changes/stabilize-project-closeout/`](https://github.com/LessUp/webrtc/tree/main/openspec/changes/stabilize-project-closeout)
