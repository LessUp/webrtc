GOLANGCI_LINT ?= golangci-lint
GOLANGCI_LINT_VERSION ?= v2.1.0

# Build
build:
	go build ./...

# Run server
run:
	go run ./cmd/server

# Test with race detector
test:
	go test -race -count=1 ./...

# Test with coverage
test-cover:
	go test -race -count=1 -coverprofile=coverage.out ./...
	go tool cover -html=coverage.out -o coverage.html

# Lint
lint:
	@$(GOLANGCI_LINT) version | grep -Eq "version v?2\\." || (echo "golangci-lint v2 is required. Install with: go install github.com/golangci/golangci-lint/v2/cmd/golangci-lint@$(GOLANGCI_LINT_VERSION)" >&2; exit 1)
	$(GOLANGCI_LINT) run

# Vet
vet:
	go vet ./...

# Format
fmt:
	go fmt ./...

# All checks (run before commit)
check: build test lint vet

# Development with hot reload (requires air)
dev:
	air

# Clean
clean:
	rm -f coverage.out coverage.html

.PHONY: build run test test-cover lint vet fmt check dev clean
