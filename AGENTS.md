<!-- AGENTS.md - AI Agent Guidelines for WebRTC Project -->

# AGENTS.md

This file provides guidance to AI coding agents (Claude Code, Cursor, GitHub Copilot, etc.) when working with code in this repository.

---

## Project Overview

**LessUp WebRTC** is a production-ready WebRTC learning platform that demonstrates peer-to-peer video calling with a Go-based signaling server and vanilla JavaScript frontend.

| Aspect | Details |
|:-------|:--------|
| **Name** | LessUp WebRTC |
| **Type** | Learning-oriented production demo |
| **License** | MIT |
| **Language** | Go 1.22+ / Vanilla JavaScript |
| **Architecture** | Mesh (up to 50 participants per room) |
| **Development Model** | Spec-Driven Development (SDD) |

### Core Capabilities

- **WebSocket Signaling** — Gorilla WebSocket with heartbeat & room management
- **Multi-party Mesh** — Up to 50 participants per room (1000 rooms max)
- **DataChannel Chat** — P2P messaging without server relay
- **Media Controls** — Mute/unmute, camera toggle, screen sharing
- **Local Recording** — Browser-side MediaRecorder with WebM export

---

## Technology Stack

### Backend

| Component | Technology |
|:----------|:-----------|
| Language | Go 1.22+ |
| WebSocket | `github.com/gorilla/websocket` v1.5.3 |
| HTTP Server | `net/http` (standard library) |
| Build Tool | Make, Air (live reload) |

### Frontend

| Component | Technology |
|:----------|:-----------|
| Language | Vanilla JavaScript (ES6+) |
| Modules | ES Modules (`type: "module"`) |
| Framework | None — framework-free by design |
| Styling | Vanilla CSS |
| Testing | Vitest (unit), Playwright (e2e) |

### Infrastructure

| Component | Technology |
|:----------|:-----------|
| Containerization | Docker (multi-stage builds) |
| Reverse Proxy | Caddy 2 |
| TURN Server | Coturn |
| Hosting | GitHub Pages (docs), Fly.io/Docker-ready |

---

## Project Structure

```
webrtc/
├── cmd/server/              # Application entry point
│   └── main.go              # HTTP server, WebSocket upgrade, config handling
├── internal/signal/         # Core signaling logic (private packages)
│   ├── hub.go               # Room management, message routing, rate limiting
│   ├── hub_test.go          # Comprehensive unit tests with mocks
│   └── message.go           # Message type definitions
├── web/                     # Frontend (static files)
│   ├── src/
│   │   ├── core/
│   │   │   └── app.js       # Application initialization, event binding
│   │   ├── controllers/
│   │   │   ├── media.js     # getUserMedia, screen share, recording
│   │   │   ├── peers.js     # RTCPeerConnection management, mesh logic
│   │   │   ├── signaling.js # WebSocket connection, message handling
│   │   │   ├── stats.js     # Connection statistics display
│   │   │   └── ui.js        # DOM manipulation, button states
│   │   └── config.js        # RTC config, constants, client ID generation
│   ├── tests/               # Vitest unit tests
│   ├── index.html           # Main UI (bilingual: English + Chinese)
│   ├── styles.css           # Responsive layout, dark/light theme
│   └── package.json         # Node dependencies (private, no publishing)
├── specs/                   # Single Source of Truth (SDD)
│   ├── product/             # Feature specs and acceptance criteria
│   ├── rfc/                 # Architecture RFCs
│   ├── api/                 # OpenAPI 3.0 signaling specification
│   ├── db/                  # Data schema definitions
│   └── testing/             # BDD test specifications
├── deploy/                  # Deployment configurations
│   ├── docker/              # Dockerfile, docker-compose.yml
│   ├── web/Caddyfile        # Caddy reverse proxy config
│   └── turnserver.conf.example  # Coturn TURN server config template
├── e2e/                     # End-to-end tests (Playwright)
│   ├── room.spec.js         # Room joining, member list tests
│   ├── playwright.config.js
│   └── package.json
├── docs/                    # User documentation (EN/ZH)
├── .github/workflows/       # CI/CD pipelines
│   ├── ci.yml               # Go lint, test, Docker build, security scan
│   └── pages.yml            # GitHub Pages documentation deployment
├── Makefile                 # Build commands
├── go.mod                   # Go module definition
├── .golangci.yml            # Linter configuration (11 linters)
├── .air.toml                # Live reload configuration
└── .env.example             # Environment variables template
```

---

## Build and Development Commands

### Prerequisites

- Go 1.22+ (tested on 1.22, 1.23)
- Node.js 20+ (for frontend/e2e tests)
- Docker (optional, for containerized deployment)
- `golangci-lint` (optional, for local linting)
- `air` (optional, for live reload: `go install github.com/cosmtrek/air@latest`)

### Make Commands

```bash
# Build the server binary
make build

# Run the server (requires .env or env vars)
make run

# Run all tests with race detector
make test

# Run tests with coverage report
make test-cover

# Run linter (11 linters including staticcheck, revive, gocritic)
make lint

# Run go vet
make vet

# Format Go code
make fmt

# Run all checks (build, test, lint, vet) — run before commit
make check

# Development with hot reload (requires air)
make dev

# Clean build artifacts
make clean
```

### Frontend Testing

```bash
# Unit tests (Vitest + JSDOM)
cd web && npm test

# Watch mode
cd web && npm run test:watch

# E2E tests (requires server running)
cd e2e && npm test
```

### Manual Testing

```bash
# Terminal 1: Start server
go run ./cmd/server

# Terminal 2: Open two browser windows
# http://localhost:8080
# Join same room, initiate calls
```

---

## Code Style Guidelines

### Go Code Style

| Rule | Value | Enforced By |
|:-----|:------|:------------|
| Indentation | Tabs | `.editorconfig`, `gofmt` |
| Line endings | LF | `.editorconfig` |
| Formatting | `gofmt` | CI, pre-commit |
| Linting | 11 linters (see below) | `.golangci.yml` |
| Spelling | US English | `misspell` linter |
| Imports | No dot imports, no blank imports | `revive` |
| Comments | `go vet` compliant | `go vet` |

**Enabled Linters** (`golangci-lint run`):

- `errcheck` — Unchecked errors
- `govet` — Standard vet checks
- `ineffassign` — Ineffective assignments
- `staticcheck` — Advanced static analysis
- `unused` / `gosimple` — Dead code, simplifications
- `gocritic` — Style and performance checks
- `revive` — Drop-in replacement for golint
- `misspell` — US English spelling
- `prealloc` — Pre-allocation hints
- `bodyclose` — HTTP body close check
- `noctx` — context.Context usage
- `goconst` — Repeated string constants
- `gosec` — Security issues
- `errorlint` — Error wrapping best practices
- `tparallel` — Test parallelization
- `unparam` — Unused parameters

### JavaScript Code Style

| Rule | Value | Enforced By |
|:-----|:------|:------------|
| Indentation | 2 spaces | `.editorconfig` |
| Quotes | Single (project standard) | None (convention) |
| Semicolons | Always | Convention |
| Strict mode | `'use strict'` at module level | Convention |
| Modules | ES6+ (`import`/`export`) | `web/package.json` |
| Framework | None — pure vanilla JS | Project policy |

### File Organization

- **Go**: One file per major type; tests in `_test.go` files
- **JS**: Controllers pattern — separate files for distinct responsibilities (media, signaling, peers, UI)

---

## Testing Strategy

### Go Unit Tests

```bash
go test -race -count=1 ./...
```

- **Race detector enabled** — catches concurrency bugs
- **Count=1** — disables test caching for CI consistency
- Tests use mock `websocket.Conn` for isolation
- Coverage includes: origin validation, room limits, message forwarding, client lifecycle

### Frontend Unit Tests (Vitest)

```bash
cd web && npm test
```

- **Environment**: JSDOM
- **Pattern**: `tests/**/*.test.js`
- Fast feedback for utility functions and state logic

### E2E Tests (Playwright)

```bash
# Requires server running on :8080
cd e2e && npx playwright test
```

- **Browser**: Chromium (headless in CI)
- **Strategy**: Two-page tests (room joining, signaling)
- **Timeout**: 30 seconds per test

### CI Pipeline

GitHub Actions runs on every PR/push to main:

1. **Lint** — `golangci-lint` with all 11 linters
2. **Test (Go 1.22 & 1.23)** — Race detector, coverage upload to Codecov
3. **Frontend Tests** — Vitest
4. **E2E Tests** — Playwright with server
5. **Docker Build** — Multi-stage image verification
6. **Security Scan** — `govulncheck`, Trivy vulnerability scanner, TruffleHog secret detection

---

## Security Considerations

### WebSocket Origin Validation

```go
// Configured via WS_ALLOWED_ORIGINS env var
h := sig.NewHubWithOptions(sig.Options{
    AllowedOrigins:  []string{"https://example.com"},
    AllowAllOrigins: false, // Use only for development
})
```

| Setting | Behavior |
|:--------|:---------|
| `*` | Allow all origins (development only) |
| `localhost` | Allow localhost variants |
| `host1.com,host2.com` | Whitelist specific origins |
| Empty | Allow only localhost |

### Identity Binding

- Each WebSocket connection binds to one client ID on first `join`
- Server overrides `from` and `room` fields in forwarded messages — prevents spoofing
- Identity is immutable: connection cannot change ID or join different room

### Resource Limits

| Limit | Value | Purpose |
|:------|:------|:--------|
| Max rooms | 1000 | Prevent memory exhaustion |
| Max clients/room | 50 | Mesh scalability limit |
| Max room ID length | 64 | Input validation |
| Max client ID length | 64 | Input validation |
| Max message size | 1 MB | DoS protection |
| Rate limit | 30 msg/sec (burst: 50) | Flood protection |
| Send timeout | 2 seconds | Prevent slow client DoS |

### Security Headers

Server sets on all responses:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`

### TURN Server Security

- TURN credentials passed via `RTC_CONFIG_JSON` environment variable
- **Never commit credentials** to repository
- Use `.env` file (gitignored) for local development

---

## Spec-Driven Development (SDD) Workflow

The `/specs` directory is the **Single Source of Truth**. This workflow MUST be followed for all changes.

### Four-Step Workflow

| Step | Action | Description |
|:-----|:-------|:------------|
| **1. Review Specs** | Read `/specs/` | Understand existing definitions before coding |
| **2. Spec-First Update** | Update spec first | For new features or interface changes, update spec before code |
| **3. Implementation** | Write code | Code must 100% comply with spec definitions (no gold-plating) |
| **4. Test Against Spec** | Write tests | Cover all acceptance criteria from spec |

### Spec Directory Structure

| Directory | Purpose | Examples |
|:----------|:--------|:---------|
| `/specs/product/` | Feature definitions, user stories, acceptance criteria | `webrtc-platform.md` |
| `/specs/rfc/` | Architecture RFCs | `0001-signaling-server.md`, `0002-frontend-architecture.md` |
| `/specs/api/` | OpenAPI 3.0 specifications | `signaling.yaml` |
| `/specs/db/` | Storage schema definitions | `schema.md` |
| `/specs/testing/` | BDD test specifications | `testing-spec.feature` |

### When to Update Specs

**Always update specs BEFORE code when**:
- Adding new WebSocket message types
- Changing message schemas
- Adding/modifying HTTP endpoints
- Changing limit constants
- Modifying client/room lifecycle behavior

### Conflict Resolution

If user instructions conflict with existing specs:

1. **STOP coding immediately**
2. Point out the conflict
3. Ask: "Should the spec be updated first?"
4. Wait for confirmation before proceeding

---

## Environment Configuration

### Environment Variables

| Variable | Default | Description |
|:---------|:--------|:------------|
| `ADDR` | `:8080` | HTTP listen address (`host:port`) |
| `WS_ALLOWED_ORIGINS` | `localhost` | Allowed WebSocket origins (comma-separated or `*`) |
| `RTC_CONFIG_JSON` | Public STUN | ICE/TURN configuration as JSON (passed to browser) |

### Config Examples

```bash
# Development
go run ./cmd/server

# Development with custom port
ADDR=:3000 go run ./cmd/server

# Production with TURN
eexport ADDR=:8080
export WS_ALLOWED_ORIGINS=webrtc.example.com
export RTC_CONFIG_JSON='{
  "iceServers": [
    { "urls": ["stun:stun.l.google.com:19302"] },
    { "urls": ["turn:turn.example.com:3478"], "username": "user", "credential": "pass" }
  ]
}'
```

---

## Deployment

### Docker (Production-Ready)

```bash
# Build
docker build -f deploy/docker/Dockerfile -t webrtc:latest .

# Run
docker run -p 8080:8080 -e WS_ALLOWED_ORIGINS=example.com webrtc:latest
```

**Dockerfile Features**:
- Multi-stage build (Go build → minimal Alpine runtime)
- Non-root user (`nonroot`)
- Health check endpoint (`/healthz`)
- Single static binary with embedded frontend

### Docker Compose (Full Stack)

```bash
cd deploy/docker
export DOMAIN=your-domain.com
docker compose up -d
```

**Services**:
- `webrtc` — Application server
- `caddy` — HTTPS reverse proxy + automatic TLS
- `coturn` — TURN server for NAT traversal

### Platform-Specific

| Platform | Config Location |
|:---------|:----------------|
| Fly.io | `deploy/fly.io/` |
| Kubernetes | `deploy/k8s/` |

---

## Debugging and Troubleshooting

### Server Debugging

```bash
# Structured logs — look for these prefixes:
# - "signal:" — WebSocket/signaling events
# - "server:" — HTTP server events

# Enable verbose logging (if implemented)
go run ./cmd/server 2>&1 | grep -E "(signal:|server:)"
```

### Client Debugging

Browser console (frontend logs):
- Connection state changes
- WebRTC negotiation steps
- Error details

### Common Issues

| Symptom | Cause | Fix |
|:--------|:------|:----|
| "WebSocket connection failed" | Wrong origin | Check `WS_ALLOWED_ORIGINS` |
| "room_limit_reached" | Too many rooms | Restart server or increase `MaxRooms` |
| "room_full" | >50 clients | Use smaller room or implement SFU |
| No video/audio | NAT/firewall | Configure TURN server |
| Black screen | Permissions | Check browser media permissions |

---

## Key Files Reference

| Purpose | Path |
|:--------|:-----|
| Server entry | `cmd/server/main.go` |
| Hub logic | `internal/signal/hub.go` |
| Message types | `internal/signal/message.go` |
| Hub tests | `internal/signal/hub_test.go` |
| App initialization | `web/src/core/app.js` |
| Config & constants | `web/src/config.js` |
| Signaling controller | `web/src/controllers/signaling.js` |
| Peer management | `web/src/controllers/peers.js` |
| Media handling | `web/src/controllers/media.js` |
| Main HTML | `web/index.html` |
| OpenAPI spec | `specs/api/signaling.yaml` |
| RFCs | `specs/rfc/` |

---

## Commit Convention

Use [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix | Usage |
|:-------|:------|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `docs:` | Documentation update |
| `refactor:` | Code refactoring |
| `test:` | Adding/updating tests |
| `chore:` | Build/tooling changes |

Examples:
```
feat: add screen sharing support
fix: resolve ICE candidate ordering issue
docs: update deployment guide for TURN
refactor: simplify Hub message routing
test: add edge cases for room limits
chore: update golangci-lint config
```

---

## Quick Reference

### One-Liners

```bash
# Run everything before commit
go build ./... && go test -race -count=1 ./... && golangci-lint run && go vet ./...

# Start dev server with hot reload
air

# Run only hub tests
go test -race -run TestHub ./internal/signal/

# Docker quick start
docker compose -f deploy/docker/docker-compose.yml up -d
```

### Architecture Decisions (RFCs)

| RFC | Topic | Location |
|:----|:------|:---------|
| RFC-0001 | Signaling Server Architecture | `specs/rfc/0001-signaling-server.md` |
| RFC-0002 | Frontend Architecture | `specs/rfc/0002-frontend-architecture.md` |

---

## Related Documents

- **[CLAUDE.md](CLAUDE.md)** — Claude Code specific shortcuts
- **[CONTRIBUTING.md](CONTRIBUTING.md)** — Human contributor guidelines
- **[specs/README.md](specs/README.md)** — Spec directory guide
- **[ROADMAP.md](ROADMAP.md)** — Development roadmap and milestones
- **[docs/guide.md](docs/guide.md)** — Architecture deep-dive
- **[docs/deployment.md](docs/deployment.md)** — Production deployment guide

---

**Last Updated**: 2026-04-17  
**Maintainer**: LessUp Team
