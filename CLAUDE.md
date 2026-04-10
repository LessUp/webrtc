# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Go 1.22+ WebSocket signaling server for WebRTC P2P audio/video. Backend: `cmd/server/main.go` + `internal/signal/`. Frontend: vanilla JS in `web/` (no bundler, no framework).

## Commands

- **Build**: `go build ./...`
- **Test**: `go test -race -count=1 ./...`
- **Lint**: `golangci-lint run` (config: `.golangci.yml`, 11 linters including staticcheck, revive, gocritic)
- **Run server**: `go run ./cmd/server` (listens on `:8080`)
- **Single test**: `go test -race -run TestName ./internal/signal/`

## Code Style

- Go: tabs, `gofmt`. JS/CSS/HTML: 2-space indent (see `.editorconfig`).
- US English spelling (enforced by misspell linter).
- No dot imports, no blank imports (enforced by revive).

## Commits

Use [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`.

## Environment Variables

| Variable | Default | Purpose |
|:---------|:--------|:--------|
| `ADDR` | `:8080` | HTTP listen address |
| `WS_ALLOWED_ORIGINS` | `localhost` | Comma-separated origins; `*` for all |
| `RTC_CONFIG_JSON` | public STUN | JSON ICE/TURN config passed to browser |
