# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Philosophy

This project follows **Spec-Driven Development (SDD)**. The `/specs` directory is the Single Source of Truth. **Always review specs before writing or modifying code.** See [AGENTS.md](AGENTS.md) for the detailed workflow.

## Project Overview

Go 1.22+ WebSocket signaling server for WebRTC P2P audio/video communication.

| Component | Location |
|:----------|:---------|
| Backend | `cmd/server/main.go` + `internal/signal/` |
| Frontend | `web/` (vanilla JS, no bundler, no framework) |
| Specs | `specs/` (Single Source of Truth) |
| Docs | `docs/` (User guides, bilingual EN/ZH) |

## Specs Directory Structure

| Directory | Purpose |
|:----------|:--------|
| `/specs/product/` | Product features and acceptance criteria |
| `/specs/rfc/` | Technical design documents (architecture, RFCs) |
| `/specs/api/` | API definitions (OpenAPI signaling spec) |
| `/specs/db/` | Storage schema specifications |
| `/specs/testing/` | BDD test specifications |

## Commands

| Task | Command |
|:-----|:--------|
| **Build** | `go build ./...` |
| **Test** | `go test -race -count=1 ./...` |
| **Lint** | `golangci-lint run` |
| **Run server** | `go run ./cmd/server` |
| **Single test** | `go test -race -run TestName ./internal/signal/` |

## Code Style

| Language | Rules |
|:---------|:------|
| **Go** | Tabs, `gofmt`, no dot imports, US English spelling |
| **JS/CSS/HTML** | 2-space indent (see `.editorconfig`) |

## Commits

Use [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`.

## Environment Variables

| Variable | Default | Purpose |
|:---------|:--------|:--------|
| `ADDR` | `:8080` | HTTP listen address |
| `WS_ALLOWED_ORIGINS` | `localhost` | Comma-separated origins; `*` for all |
| `RTC_CONFIG_JSON` | public STUN | JSON ICE/TURN config passed to browser |
