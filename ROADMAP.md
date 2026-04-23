---
layout: default
title: Roadmap — WebRTC
description: Current scope and follow-up priorities for the LessUp WebRTC project.
---

[← Back to Home]({{ site.baseurl }}/)

# Roadmap

This roadmap is intentionally short. The project already covers its target feature set; remaining work focuses on keeping the repository clean, coherent, and easy to understand.

## Current scope

| Area | Status |
|:-----|:-------|
| Go signaling server | Stable |
| Vanilla JS client | Stable |
| Mesh room calling | Stable for small rooms |
| DataChannel chat | Stable |
| Screen share and recording | Stable |
| Docker deployment | Stable |
| Docs + OpenSpec workflow | Active cleanup and consolidation |

## Current priorities

1. **Repository coherence**
   - keep `openspec/` as the only spec authority
   - remove stale docs, routes, and config references

2. **Low-noise automation**
   - keep only high-value CI checks
   - align local commands with CI expectations

3. **Public presentation**
   - improve Pages information architecture
   - keep GitHub metadata and docs aligned with the real implementation

4. **Stability fixes**
   - fix defects uncovered during cleanup
   - keep tests and deployment paths working

## Explicit non-goals

These are not planned unless the project direction changes:

- SFU or large-room architecture
- mobile clients
- persistent storage or account systems
- heavy framework adoption on the frontend
- large custom automation stacks or plugin sprawl

## Tracking change work

Implementation planning now lives in `openspec/changes/`. See the public [spec guide]({{ site.baseurl }}/docs/specs) for the current spec map and workflow.
