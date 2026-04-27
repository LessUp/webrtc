# Tasks: Finalize Project Closeout

## Phase 1: Bug Fixes

- [x] P1.1.1 Fix `broadcastMembers` TOCTOU race condition
- [x] P1.1.2 Fix client ID collision risk (remove unsafe fallback)
- [x] P1.1.3 Fix `sendError()` return values being ignored

## Phase 2: Code Quality

- [x] P1.2.1 Fix HTML aria-label newline bug
- [x] P1.2.2 Fix pre-commit hook concurrency issue
- [x] P1.2.3 Verify WebSocket state check consistency
- [x] P1.2.4 Audit silent failure points

## Phase 3: Configuration Cleanup

- [x] P1.3.1 Clean up duplicate OpenSpec skill definitions (already using opsx commands)
- [x] P1.3.2 Clean up changelog duplicate entries
- [x] P1.3.3 Fix TodoWrite reference in skill file

## Phase 4: CI/CD Optimization

- [x] P2.1.2 Optimize pages.yml fetch-depth

## Phase 5: Test Updates

- [x] Update client ID test to expect error instead of fallback

## Verification

- [x] `make test` passes
- [x] `cd web && npm test` passes
- [x] `go vet ./...` passes
- [x] `go build ./...` succeeds

## Summary

All 14 tasks completed successfully. The project is now in a stable, archive-ready state.
