# AGENTS.md

This file provides guidance to AI coding agents (Claude Code, Cursor, GitHub Copilot, etc.) when working with code in this repository.

---

## Project Philosophy: Spec-Driven Development (SDD)

This project strictly follows the **Spec-Driven Development (SDD)** paradigm. The `/specs` directory is the **Single Source of Truth**. All code implementations must comply with these specifications.

---

## Directory Context

| Directory | Purpose |
|:----------|:--------|
| `/specs/product/` | Product feature definitions and acceptance criteria |
| `/specs/rfc/` | Technical design documents and architecture decisions (RFCs) |
| `/specs/api/` | API interface definitions (OpenAPI, signaling protocol) |
| `/specs/db/` | Database/storage schema specifications |
| `/specs/testing/` | BDD test case specifications and acceptance criteria |
| `/docs/` | User guides, tutorials, deployment documentation |

---

## AI Agent Workflow Instructions

When you (the AI) are asked to develop a new feature, modify an existing feature, or fix a bug, **you MUST strictly follow this workflow. Do NOT skip any steps**:

### Step 1: Review Specs (审查与分析)

- Before writing any code, **first read the relevant documents** in `/specs` (product specs, RFCs, API definitions).
- If the user's request conflicts with existing specs, **STOP coding immediately** and point out the conflict. Ask the user whether the spec should be updated first.
- 如果用户指令与现有 Spec 冲突，**请立即停止编码**，并指出冲突点，询问用户是否需要先更新 Spec。

### Step 2: Spec-First Update (规范优先)

- If this is a new feature, or if it changes existing interfaces/database structures, **you MUST first propose modifying or creating the corresponding spec document** (e.g., `openapi.yaml` or an RFC document).
- Wait for user confirmation of the spec changes before entering the coding phase.
- 如果这是一个新功能，或者需要改变现有的接口/数据库结构，**必须首先提议修改或创建相应的 Spec 文档**。等待用户确认 Spec 的修改后，才能进入代码编写阶段。

### Step 3: Implementation (代码实现)

- When writing code, you **MUST 100% comply** with the definitions in the specs (including variable names, API paths, data types, status codes, etc.).
- Do NOT add features not defined in the specs (No Gold-Plating).
- 编写代码时，必须 100% 遵守 Spec 中的定义（包括变量命名、API 路径、数据类型、状态码等）。不要在代码中擅自添加 Spec 中未定义的功能。

### Step 4: Test Against Spec (测试验证)

- Write unit tests and integration tests based on the acceptance criteria in `/specs`.
- Ensure test cases cover all boundary conditions described in the specs.
- 根据 `/specs` 中的验收标准（Acceptance Criteria）编写单元测试和集成测试。确保测试用例覆盖了 Spec 中描述的所有边界情况。

---

## Code Generation Rules

### API Changes
- Any externally exposed API changes **MUST** sync with `/specs/api/signaling.yaml`.
- 任何对外部暴露的 API 变更，必须同步修改 `/specs/api/signaling.yaml`。

### Architecture Decisions
- If uncertain about technical details, consult `/specs/rfc/` — do NOT invent design patterns on your own.
- 如果遇到不确定的技术细节，请查阅 `/specs/rfc/` 下的架构约定，不要自行捏造设计模式。

### Go Code Style
- Use tabs, format with `gofmt`.
- No dot imports, no blank imports (enforced by revive linter).
- US English spelling (enforced by misspell linter).
- Go 代码：使用 tab 缩进，`gofmt` 格式化，禁止 dot imports，使用美式英语拼写。

### JavaScript Code Style
- 2-space indent (see `.editorconfig`).
- ES6+ features, `'use strict'` at module level.
- Vanilla JS only — no frameworks or bundlers.
- JavaScript 代码：2 空格缩进，使用 ES6+ 特性，纯原生 JavaScript。

---

## Quick Reference

### Build & Test Commands

```bash
# Build
go build ./...

# Test with race detector
go test -race -count=1 ./...

# Lint (11 linters including staticcheck, revive, gocritic)
golangci-lint run

# Run single test
go test -race -run TestName ./internal/signal/

# Run server
go run ./cmd/server
```

### Key Paths

| Path | Description |
|:-----|:------------|
| `cmd/server/main.go` | Server entry point |
| `internal/signal/` | Signaling logic (Hub, Client, Message) |
| `web/` | Frontend (vanilla JS modules) |
| `specs/` | Single Source of Truth |
| `docs/` | User documentation |

### Environment Variables

| Variable | Default | Purpose |
|:---------|:--------|:--------|
| `ADDR` | `:8080` | HTTP listen address |
| `WS_ALLOWED_ORIGINS` | `localhost` | Comma-separated origins; `*` for all |
| `RTC_CONFIG_JSON` | public STUN | JSON ICE/TURN config passed to browser |

---

## Commit Convention

Use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` — New feature
- `fix:` — Bug fix
- `docs:` — Documentation update
- `refactor:` — Code refactoring
- `test:` — Adding or updating tests
- `chore:` — Build/tooling changes

---

## Why This Workflow?

| Benefit | Description |
|:--------|:------------|
| **Prevents AI Hallucination** | AI tends to "freestyle" without context. Forcing Step 1 (read specs) anchors its thinking scope. |
| **Ensures Document-Code Sync** | Declaring "update spec before code" guarantees documentation and code never diverge. |
| **Improves PR Quality** | Implementations align with business logic because AI follows acceptance criteria defined in specs. |

---

## Related Documents

- **[CLAUDE.md](CLAUDE.md)** — Claude Code specific instructions (shorter, command-focused)
- **[CONTRIBUTING.md](CONTRIBUTING.md)** — Human contribution guidelines
- **[specs/README.md](specs/README.md)** — Specifications index
