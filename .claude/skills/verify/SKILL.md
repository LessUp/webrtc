---
name: verify
description: Run the full CI check suite locally — build, test with race detector, and lint.
---

Run the full verification suite that CI runs:

1. Build: `go build ./...`
2. Test: `go test -race -count=1 -coverprofile=coverage.out ./...`
3. Vet: `go vet ./...`
4. Lint: `golangci-lint run`

Report pass/fail for each step. If any step fails, show the relevant output and stop.
