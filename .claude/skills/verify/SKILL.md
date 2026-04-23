---
name: verify
description: Run the full CI check suite locally — build, test with race detector, lint, and vet. Use before committing or after making changes.
---

Run the complete pre-commit check suite for this Go + vanilla JS WebRTC project.

## Steps

1. Run `make check` which executes:
   - `go build ./...` — compile all packages
   - `go test -race -count=1 ./...` — tests with race detector
   - `golangci-lint run` — lint with 14 linters
   - `go vet ./...` — static analysis

2. If checks fail, fix the issues and re-run.

## Optional: Frontend Tests

After backend checks pass, optionally run:
- `cd web && npm test` — Vitest unit tests
- `cd e2e && npm test` — Playwright E2E tests (requires running server)
