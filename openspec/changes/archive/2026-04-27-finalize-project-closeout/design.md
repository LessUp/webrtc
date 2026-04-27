# Design: Finalize Project Closeout

## Architecture

This change focuses on fixing existing issues rather than architectural changes.

## Implementation Details

### 1. broadcastMembers Race Condition Fix

**Problem**: The original implementation released and re-acquired locks multiple times during broadcast, creating Time-Of-Check to Time-Of-Use (TOCTOU) race conditions.

**Solution**: Refactored to use a single critical section with `defer`:
- Acquire RLock once at the start
- Capture both member IDs and client pointers in single pass
- Send messages while holding lock (enqueue is non-blocking)
- Use goroutines for removeClient/close to avoid deadlock

### 2. Client ID Security Fix

**Problem**: `Math.random()` fallback was cryptographically unsafe.

**Solution**: Remove the fallback entirely. If `crypto.randomUUID()` or `crypto.getRandomValues()` is unavailable, throw an explicit error requiring a modern browser.

### 3. Error Handling Improvements

**Problem**: `sendError()` return values were ignored with `_` assignment.

**Solution**: Log errors from all `sendError()` calls to aid debugging.

### 4. Configuration Cleanup

- **Changelog**: Merged duplicate date entries (2026-03-09, 2026-03-10)
- **Skills**: Updated TodoWrite reference to TaskCreate/TaskUpdate
- **CI**: Changed fetch-depth from 0 to 1 (Jekyll doesn't need full history)

## Files Changed

| File | Change Type |
|------|-------------|
| `internal/signal/hub.go` | Bug fix, refactoring |
| `web/src/config.js` | Security fix |
| `web/tests/app.config.test.js` | Test update |
| `_includes/nav-header.html` | Bug fix |
| `.githooks/pre-commit` | Bug fix |
| `.github/workflows/pages.yml` | Optimization |
| `.claude/skills/openspec-propose/SKILL.md` | Fix tool reference |
| `changelog/archive/*.md` | Consolidation |

## Verification

- `make test` - Go tests with race detector
- `cd web && npm test` - Frontend tests
- `go vet ./...` - Static analysis
- `go build ./...` - Build verification
