# WebRTC

[![Go CI](https://github.com/LessUp/webrtc/actions/workflows/ci.yml/badge.svg)](https://github.com/LessUp/webrtc/actions/workflows/ci.yml)
[![Pages](https://github.com/LessUp/webrtc/actions/workflows/pages.yml/badge.svg)](https://lessup.github.io/webrtc/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
![Go](https://img.shields.io/badge/Go-1.22+-00ADD8?logo=go&logoColor=white)
![WebRTC](https://img.shields.io/badge/WebRTC-Enabled-333333?logo=webrtc&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)

English | [简体中文](README.zh-CN.md) | [📖 Online Docs](https://lessup.github.io/webrtc/)

A minimal WebRTC demo project built with Go, providing a WebSocket signaling server and browser-based demo for peer-to-peer audio/video communication. From 1-on-1 calls to multi-party Mesh rooms, covering core WebRTC capabilities for learning and practice.

## Features

| Feature | Description |
|:--------|:------------|
| **WebSocket Signaling** | Gorilla WebSocket for Offer/Answer/ICE Candidate relay within rooms, with heartbeat keep-alive |
| **Media Controls** | Mute/unmute, camera on/off, screen sharing (`getDisplayMedia`) |
| **DataChannel** | Peer-to-peer text chat without server relay |
| **Local Recording** | MediaRecorder captures audio/video streams, exports `.webm` for download |
| **Multi-party Mesh** | Room member list broadcast, multi-PeerConnection management, grid video layout |
| **Security** | Origin validation whitelist, room/client limits, auto-reconnection |
| **Docker** | Multi-stage Dockerfile, Go compilation + static frontend packaging |

## Architecture

```
┌──────────────────────────────────────────────────────┐
│  Browser A                                            │
│  ┌──────────┐    ┌──────────┐    ┌────────────────┐  │
│  │  HTML UI  │──→│  app.js  │──→│  getUserMedia   │  │
│  └──────────┘    └────┬─────┘    └──────┬─────────┘  │
└───────────────────────┼─────────────────┼────────────┘
                        │ WebSocket       │ WebRTC P2P
                 ┌──────▼──────┐          │
                 │  Go Server   │          │
                 │ ┌──────────┐│          │
                 │ │Signal Hub││          │
                 │ └──────────┘│          │
                 └──────┬──────┘          │
                        │ WebSocket       │
┌───────────────────────┼─────────────────┼────────────┐
│  Browser B            │                 │            │
│  ┌──────────┐    ┌────▼─────┐    ┌──────▼─────────┐ │
│  │  HTML UI  │──→│  app.js  │──→│  getUserMedia   │ │
│  └──────────┘    └──────────┘    └────────────────┘  │
└──────────────────────────────────────────────────────┘
```

- **Signaling**: Browser → WebSocket `/ws` → Signal Hub (Offer/Answer/ICE relay) → Browser
- **Media**: Browser ←→ WebRTC P2P audio/video / DataChannel ←→ Browser

## Quick Start

```bash
git clone https://github.com/LessUp/webrtc.git
cd webrtc
go mod tidy
go run ./cmd/server
```

Open two browser tabs at http://localhost:8080, enter the same room name, click a member's ID, then click **Call**.

### Docker

```bash
docker build -t webrtc .
docker run --rm -p 8080:8080 webrtc
```

## Configuration

| Variable | Description | Default |
|:---------|:------------|:--------|
| `ADDR` | HTTP listen address | `:8080` |
| `WS_ALLOWED_ORIGINS` | Comma-separated allowed origins; set to `*` for all | `localhost` |

## Project Structure

```
webrtc/
├── cmd/server/          # HTTP + WebSocket entry point
│   └── main.go          # Server startup, graceful shutdown, origin config
├── internal/signal/     # Signaling logic
│   ├── hub.go           # Room management, message relay, client lifecycle
│   ├── hub_test.go      # Unit tests
│   └── message.go       # Message type definitions
├── web/                 # Browser frontend
│   ├── index.html       # UI
│   ├── app.js           # WebRTC & signaling logic (Mesh multi-party)
│   └── styles.css       # Responsive styles (light/dark theme)
├── docs/                # Technical documentation
│   ├── guide.md         # Architecture, frontend, media, recording
│   └── signaling.md     # Signaling protocol deep dive
├── .github/workflows/   # CI/CD
│   ├── ci.yml           # Go build + test + lint
│   └── pages.yml        # GitHub Pages deployment
├── changelog/           # Change logs
├── Dockerfile           # Multi-stage build
├── .golangci.yml        # Linter configuration
└── go.mod               # Go module definition
```

## Tech Stack

| Category | Technology |
|:---------|:-----------|
| **Backend** | Go 1.22+, net/http, Gorilla WebSocket |
| **Frontend** | HTML5 + Vanilla JavaScript + CSS3 |
| **Media** | WebRTC (getUserMedia, RTCPeerConnection, DataChannel, MediaRecorder) |
| **Container** | Docker (multi-stage build) |
| **CI/CD** | GitHub Actions (golangci-lint + multi-version test + GitHub Pages) |

## Documentation

- [Technical Guide](docs/guide.md) — Architecture, frontend, media, recording
- [Signaling Deep Dive](docs/signaling.md) — Signaling & room management details
- [Roadmap](ROADMAP.md) — Development plan & progress tracking
- [Contributing](CONTRIBUTING.md) — Development workflow & code standards

## Roadmap

- [x] 1-on-1 call with status display, error handling, heartbeat
- [x] Mute/camera/screen sharing, DataChannel chat, local recording
- [x] Room member list, auto-call prompt, multi-party Mesh
- [x] Docker multi-stage build & deployment
- [ ] TURN support (coturn)
- [ ] HTTPS/WSS reverse proxy
- [ ] Multi-party calls via SFU

## License

[MIT](LICENSE)
