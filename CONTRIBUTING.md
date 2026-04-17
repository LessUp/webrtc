---
layout: default
title: Contributing — WebRTC
description: WebRTC project contribution guidelines, code standards, and spec-driven workflow
---

[← Back to Home]({{ site.baseurl }}/)

# Contributing

Thank you for your interest in contributing! This project follows **Spec-Driven Development (SDD)**. The `/specs` directory is the Single Source of Truth.

---

## Table of Contents

- [Spec-Driven Development Workflow](#spec-driven-development-workflow)
- [How to Participate in Spec Writing](#how-to-participate-in-spec-writing)
- [Development Workflow](#development-workflow)
- [Development Environment](#development-environment)
- [Testing & Quality](#testing--quality)
- [Code Standards](#code-standards)
- [Commit Convention](#commit-convention)

---

## Spec-Driven Development Workflow

This project uses the `/specs` directory as the Single Source of Truth:

| Directory | Purpose |
|:----------|:--------|
| `/specs/product/` | Product feature definitions and acceptance criteria |
| `/specs/rfc/` | Technical design documents and architecture decisions |
| `/specs/api/` | API interface definitions (OpenAPI signaling spec) |
| `/specs/db/` | Storage schema specifications |
| `/specs/testing/` | BDD test specifications |

### Before Writing Code

1. **Read the relevant spec** in `/specs/` (product specs, RFCs, API definitions)
2. **If the feature doesn't exist in specs**, propose a spec update first
3. **Wait for spec approval** before implementing

### The Four-Step Workflow

| Step | Action | Description |
|:-----|:-------|:------------|
| **1. Review Specs** | Read `/specs/` | Understand existing definitions before coding |
| **2. Spec-First Update** | Update spec first | For new features or interface changes, update spec before code |
| **3. Implementation** | Write code | Code must 100% comply with spec definitions |
| **4. Test Against Spec** | Write tests | Cover all acceptance criteria from spec |

**See [AGENTS.md](../AGENTS.md) for the complete AI/human workflow.**

---

## How to Participate in Spec Writing

### Proposing a New Feature

1. **Create a Product Spec** in `/specs/product/` with:
   - Feature description
   - User stories
   - Acceptance criteria
   - State diagrams (if applicable)

2. **Create an RFC** in `/specs/rfc/` with:
   - Technical approach
   - Architecture decisions
   - Trade-offs considered
   - Security implications

3. **Update API Spec** in `/specs/api/` if the feature adds/modifies:
   - WebSocket message types
   - HTTP endpoints
   - Data structures

### Proposing a Bug Fix

1. **Reference the relevant spec** that defines expected behavior
2. **Identify the gap** between spec and implementation
3. **Decide**: Should the spec change, or should the code?

### Spec Review Process

1. Open a Pull Request with spec changes
2. Maintainers review for:
   - Completeness
   - Consistency with existing specs
   - Technical feasibility
3. Once approved, implementation can begin

---

## Development Workflow

### 1. Fork & Branch

```bash
# Fork the repository on GitHub
git clone https://github.com/YOUR_USERNAME/webrtc.git
cd webrtc
git checkout -b feature/your-feature
```

### 2. Follow SDD

1. Read relevant specs in `/specs/`
2. Update specs if needed (spec-first!)
3. Implement code following spec definitions
4. Write tests based on acceptance criteria

### 3. Commit & Push

```bash
git add .
git commit -m "feat: add your feature"
git push origin feature/your-feature
```

### 4. Create Pull Request

- Reference any spec changes in your PR description
- Ensure all CI checks pass
- Link to relevant issues

---

## Development Environment

### Prerequisites

| Requirement | Version |
|:------------|:--------|
| Go | 1.22+ |
| Browser | Chrome 90+ / Firefox 88+ / Safari 14+ |
| golangci-lint | Latest (optional, for local lint) |

### Start Development Server

```bash
go mod tidy
go run ./cmd/server
# Visit http://localhost:8080
```

---

## Testing & Quality

Before submitting, ensure all checks pass:

```bash
# Build
go build ./...

# Unit tests (with race detector on Linux/macOS)
go test -race -count=1 ./...

# Static analysis
go vet ./...

# Lint (requires golangci-lint)
golangci-lint run
```

CI automatically runs:
- golangci-lint (11 linters)
- Multi-version Go tests
- staticcheck

---

## Code Standards

### Go Code

- Follow `gofmt` formatting
- Pass `go vet` checks
- Comply with `.golangci.yml` lint rules
- Use tabs for indentation
- US English spelling

### Frontend Code

- 2-space indentation (see `.editorconfig`)
- Vanilla JavaScript only (no frameworks)
- ES6+ features allowed
- `'use strict'` at module level

### General

- Keep implementations simple
- No gold-plating (only implement what's in the spec)
- Document public APIs

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

### Examples

```
feat: add screen sharing support
fix: resolve ICE candidate ordering issue
docs: update deployment guide for TURN
refactor: simplify Hub message routing
test: add edge cases for room limits
chore: update golangci-lint config
```

---

## Need Help?

- **Questions?** [Open a Discussion](https://github.com/LessUp/webrtc/discussions)
- **Found a bug?** [Open an Issue](https://github.com/LessUp/webrtc/issues)
- **Want to understand the architecture?** Read the [RFCs](../specs/rfc/)
