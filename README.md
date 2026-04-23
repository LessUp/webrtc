<div align="center">

# LessUp WebRTC

**A polished WebRTC learning demo with a Go signaling server and a vanilla JavaScript client.**

[![CI](https://github.com/LessUp/webrtc/actions/workflows/ci.yml/badge.svg)](https://github.com/LessUp/webrtc/actions/workflows/ci.yml)
[![Pages](https://github.com/LessUp/webrtc/actions/workflows/pages.yml/badge.svg)](https://lessup.github.io/webrtc/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Go Version](https://img.shields.io/badge/Go-1.22+-00ADD8?logo=go&logoColor=white)](https://go.dev/)

[English](README.md) | [简体中文](README.zh-CN.md) | [Docs Site](https://lessup.github.io/webrtc/) | [OpenSpec Hub](docs/specs.md)

</div>

## Why this project

LessUp WebRTC is designed for people who want a small, readable codebase that still covers the core moving parts of real-time browser communication:

- WebSocket signaling with identity binding and room management
- peer-to-peer media and DataChannel chat
- screen sharing and browser-side recording
- a framework-free frontend served directly by Go
- Docker-ready deployment and a public docs site

## What is implemented

| Area | Status |
|:-----|:-------|
| Signaling server | Go + Gorilla WebSocket |
| Browser client | Vanilla JavaScript ES modules |
| Call model | 1:1 and small-room mesh |
| Media controls | Mute, camera toggle, screen share |
| Recording | Local `MediaRecorder` export |
| Docs and specs | GitHub Pages + OpenSpec |

## Quick start

### Run locally

```bash
git clone https://github.com/LessUp/webrtc.git
cd webrtc
go run ./cmd/server
```

Open `http://localhost:8080`, join the same room in two browser windows, and start a call.

### Run checks

```bash
make check
cd web && npm test
```

### Docker

```bash
docker build -f deploy/docker/Dockerfile -t webrtc .
docker run --rm -p 8080:8080 webrtc
```

## Architecture at a glance

```text
Browser UI
  └─ web/src/core/app.js
     ├─ controllers/media.js
     ├─ controllers/peers.js
     ├─ controllers/signaling.js
     ├─ controllers/stats.js
     └─ controllers/ui.js

Go server
  ├─ cmd/server/main.go
  └─ internal/signal/
```

The server exposes:

- `GET /` — static frontend
- `GET /config.js` — runtime RTC config
- `GET /healthz` — health probe
- `GET /ws` — signaling socket

## Specs and workflow

This repository uses **OpenSpec** as its only planning and requirements system.

- Main specs: [`openspec/specs/`](openspec/specs/)
- Active changes: [`openspec/changes/`](openspec/changes/)
- Public spec guide: [`docs/specs.md`](docs/specs.md)

Typical flow:

1. propose or update an OpenSpec change
2. implement against `proposal.md`, `design.md`, and `tasks.md`
3. validate with repo checks
4. review before merge

## Project structure

```text
cmd/server/              application entrypoint
internal/signal/         signaling hub and tests
web/                     static frontend
docs/                    public documentation
openspec/                specs and change artifacts
deploy/                  Docker, Caddy, and deployment assets
```

## Documentation

- [Docs home](docs/index.md)
- [Technical guide](docs/guide.md)
- [Signaling protocol](docs/signaling.md)
- [Deployment guide](docs/deployment.md)
- [API reference](docs/api.md)
- [Troubleshooting](docs/troubleshooting.md)

## Contributing

Start with [CONTRIBUTING.md](CONTRIBUTING.md) and the active OpenSpec change. This repo prefers focused, low-noise contributions that keep the implementation, docs, and repo metadata aligned.
