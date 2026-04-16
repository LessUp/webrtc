# WebRTC

<p align="center">
  <a href="https://github.com/LessUp/webrtc/actions/workflows/ci.yml">
    <img src="https://github.com/LessUp/webrtc/actions/workflows/ci.yml/badge.svg" alt="Go CI">
  </a>
  <a href="https://lessup.github.io/webrtc/">
    <img src="https://github.com/LessUp/webrtc/actions/workflows/pages.yml/badge.svg" alt="Pages">
  </a>
  <a href="LICENSE">
    <img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT">
  </a>
  <img src="https://img.shields.io/badge/Go-1.22+-00ADD8?logo=go&logoColor=white" alt="Go">
  <img src="https://img.shields.io/badge/WebRTC-Enabled-333333?logo=webrtc&logoColor=white" alt="WebRTC">
  <img src="https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white" alt="Docker">
</p>

<p align="center">
  English | <a href="README.zh-CN.md">简体中文</a> | <a href="https://lessup.github.io/webrtc/">📖 Online Docs</a>
</p>

<p align="center">
  A production-ready WebRTC learning platform — from basic peer-to-peer calls to advanced multi-party Mesh architecture.
</p>

---

## Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [Why This Project?](#why-this-project)
- [Architecture](#architecture)
- [Documentation](#documentation)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## Features

| Feature | Description |
|:--------|:------------|
| **🌐 WebSocket Signaling** | Gorilla WebSocket with heartbeat, room management, and message relay |
| **👥 Multi-party Mesh** | Up to 50 participants per room with automatic peer management |
| **💬 DataChannel Chat** | Peer-to-peer text messaging without server relay |
| **🎥 Media Controls** | Mute/unmute, camera toggle, screen sharing |
| **📹 Local Recording** | Browser-side MediaRecorder with WebM export |
| **🔒 Security** | Origin validation, identity binding, rate limiting |
| **🐳 Docker Ready** | Multi-stage builds with HTTPS/TURN support |

---

## Quick Start

### Prerequisites

- Go 1.22+
- Modern browser (Chrome 90+, Firefox 88+, Safari 14+)
- Docker (optional)

### Run Locally

```bash
git clone https://github.com/LessUp/webrtc.git
cd webrtc
go mod tidy
go run ./cmd/server
```

Open http://localhost:8080 and start calling!

### Run with Docker

```bash
docker build -t webrtc .
docker run --rm -p 8080:8080 webrtc
```

### Run with Docker Compose (Production)

```bash
export DOMAIN=your-domain.com
docker compose up -d
```

Visit `https://your-domain.com` with automatic HTTPS.

---

## Why This Project?

- **🎓 Learning-Oriented** — Progressive complexity from 1-on-1 to multi-party
- **🔐 Security-First** — Origin validation, identity binding, connection limits
- **📦 Zero-Dependency Frontend** — Pure vanilla JavaScript, no frameworks
- **🚀 Docker-Ready** — Multi-stage builds for minimal image size
- **📝 Well-Documented** — Bilingual docs (EN/ZH), architecture diagrams, troubleshooting guides

---

## Architecture

### Module Structure

```
webrtc/
├── cmd/server/              # HTTP + WebSocket entry point
├── internal/signal/         # Signaling logic
│   ├── hub.go               # Room management, message relay
│   ├── hub_test.go          # Unit tests
│   └── message.go           # Message type definitions
├── web/                     # Frontend (vanilla JS)
│   ├── index.html           # UI
│   ├── app.js               # Main entry
│   ├── app.*.js             # Modular components
│   └── styles.css           # Responsive styles
├── docs/                    # Documentation (EN/ZH)
├── changelog/               # Version history
└── .github/workflows/       # CI/CD
```

### System Architecture

```
┌──────────────────────────────────────────────────────┐
│  Browser A                                           │
│  ┌──────────┐    ┌──────────┐    ┌────────────────┐ │
│  │  HTML UI  │──→│  app.js  │──→│  getUserMedia   │ │
│  └──────────┘    └────┬─────┘    └──────┬─────────┘ │
└───────────────────────┼─────────────────┼───────────┘
                        │ WebSocket       │ WebRTC P2P
                 ┌──────▼──────┐          │
                 │  Go Server   │          │
                 │ ┌──────────┐│          │
                 │ │Signal Hub││          │
                 │ └──────────┘│          │
                 └──────┬──────┘          │
                        │ WebSocket       │
┌───────────────────────┼─────────────────┼───────────┐
│  Browser B            │                 │           │
│  ┌──────────┐    ┌────▼─────┐    ┌──────▼─────────┐│
│  │  HTML UI  │──→│  app.js  │──→│  getUserMedia   ││
│  └──────────┘    └──────────┘    └────────────────┘│
└─────────────────────────────────────────────────────┘
```

| Flow | Path | Description |
|:-----|:-----|:------------|
| **Signaling** | Browser ↔ WebSocket `/ws` ↔ Hub | Offer/Answer/ICE relay |
| **Media** | Browser ↔ WebRTC P2P ↔ Browser | Audio/video streams |
| **DataChannel** | Browser ↔ WebRTC P2P ↔ Browser | Text chat |

---

## Documentation

Complete documentation available in English and 简体中文:

| Document | Description |
|:---------|:------------|
| **📘 [Guide](docs/guide.md)** | Architecture, implementation details |
| **🚀 [Deployment](docs/deployment.md)** | Docker, HTTPS, TURN setup |
| **📡 [Signaling](docs/signaling.md)** | WebSocket protocol specification |
| **🔧 [API Reference](docs/api.md)** | Configuration, environment variables |
| **🔍 [Troubleshooting](docs/troubleshooting.md)** | Common issues and solutions |

📖 **Online Docs**: https://lessup.github.io/webrtc/

---

## Configuration

### Environment Variables

| Variable | Default | Description |
|:---------|:--------|:------------|
| `ADDR` | `:8080` | HTTP listen address |
| `WS_ALLOWED_ORIGINS` | `*` | Comma-separated origins; `*` for all |
| `RTC_CONFIG_JSON` | Public STUN | JSON ICE/TURN config passed to browser |

### Custom ICE/TURN Configuration

```bash
export RTC_CONFIG_JSON='{
  "iceServers": [
    { "urls": ["stun:stun.l.google.com:19302"] },
    { "urls": ["turn:turn.example.com:3478"], "username": "user", "credential": "pass" }
  ]
}'
```

---

## Deployment

### Production Checklist

- [ ] Set `WS_ALLOWED_ORIGINS` to your domain
- [ ] Configure TURN server for NAT traversal
- [ ] Enable HTTPS (Caddy handles this automatically)
- [ ] Set up monitoring and logging

### Docker Compose (Recommended)

```yaml
# docker-compose.yml
services:
  webrtc:
    build: .
    environment:
      - WS_ALLOWED_ORIGINS=yourdomain.com
      - RTC_CONFIG_JSON={"iceServers":[{"urls":"turn:yourdomain.com:3478"...}]}
  
  caddy:
    image: caddy:2-alpine
    ports:
      - "80:80"
      - "443:443"
  
  coturn:
    image: coturn/coturn:latest
    network_mode: host
```

See [Deployment Guide](docs/deployment.md) for detailed instructions.

---

## Contributing

We welcome contributions! Please see:

- [Contributing Guidelines](CONTRIBUTING.md) — Setup and workflow
- [Roadmap](ROADMAP.md) — Future plans
- [Changelog](CHANGELOG.md) — Version history

### Development Setup

```bash
# Install dependencies
go mod tidy

# Run tests
go test -race ./...

# Run linter
golangci-lint run

# Start with hot reload
air
```

---

## Tech Stack

| Category | Technology |
|:---------|:-----------|
| **Backend** | Go 1.22+, net/http, Gorilla WebSocket |
| **Frontend** | HTML5 + Vanilla JavaScript + CSS3 |
| **Media** | WebRTC APIs (getUserMedia, RTCPeerConnection, DataChannel) |
| **Container** | Docker (multi-stage) |
| **CI/CD** | GitHub Actions |

---

## Security

- Origin whitelist validation
- Server-verified client identities  
- Connection limits (50 clients/room, 1000 rooms)
- Input validation and sanitization
- See [Security Policy](.github/SECURITY.md)

---

## License

[MIT License](LICENSE) © [LessUp](https://github.com/LessUp)

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/LessUp">LessUp</a>
</p>

<p align="center">
  <a href="https://github.com/LessUp/webrtc/stargazers">
    <img src="https://img.shields.io/github/stars/LessUp/webrtc?style=social" alt="GitHub Stars">
  </a>
</p>
