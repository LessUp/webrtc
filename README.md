# WebRTC

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
![Go](https://img.shields.io/badge/Go-1.22+-00ADD8?logo=go&logoColor=white)
![WebRTC](https://img.shields.io/badge/WebRTC-Enabled-333333?logo=webrtc&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)

English | [简体中文](README.zh-CN.md)

A minimal WebRTC demo project built with Go, providing a WebSocket signaling server and browser-based demo for peer-to-peer audio/video communication.

## Features

- **WebSocket Signaling** — Gorilla WebSocket for Offer/Answer/ICE Candidate relay within rooms
- **Browser Frontend** — One-click audio/video capture and peer-to-peer calling
- **Go Modules** — Easy dependency management and deployment
- **Extensible** — Ready for TURN/SFU/recording integration

## Quick Start

```bash
git clone https://github.com/LessUp/WebRTC.git
cd WebRTC
go mod tidy
go run ./cmd/server
```

Visit http://localhost:8080, open two tabs, enter the same room name, copy one's ID to the other, and click Call.

## Configuration

- `ADDR`: Listen address (default `:8080`)
- `WS_ALLOWED_ORIGINS`: Comma-separated allowed origins (default: localhost only)

## Project Structure

```
WebRTC/
├── cmd/server/        # HTTP + WebSocket entry
├── internal/signal/   # Signaling (room management, message relay)
├── web/               # Browser UI (HTML + JS + CSS)
├── docs/              # Technical guides
├── Dockerfile         # Multi-stage Docker build
└── go.mod
```

## Documentation

- [Technical Guide](docs/guide.md) — Architecture, frontend, media, recording
- [Signaling Deep Dive](docs/signaling.md) — Signaling & room management details

## Roadmap

- [x] Room member list & auto-call prompt
- [ ] TURN support (coturn)
- [ ] Multi-party calls (Mesh / SFU)
- [ ] Recording & RTMP relay
- [x] Docker image & cloud deployment

## License

[MIT](LICENSE)
