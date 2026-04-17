<div align="center">

# 📹 WebRTC

**Production-Ready WebRTC Learning Platform**

[![Go CI](https://github.com/LessUp/webrtc/actions/workflows/ci.yml/badge.svg)](https://github.com/LessUp/webrtc/actions/workflows/ci.yml)
[![Pages](https://github.com/LessUp/webrtc/actions/workflows/pages.yml/badge.svg)](https://lessup.github.io/webrtc/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Go Version](https://img.shields.io/badge/Go-1.22+-00ADD8?logo=go&logoColor=white)](https://golang.org/)
[![WebRTC](https://img.shields.io/badge/WebRTC-Enabled-333333?logo=webrtc&logoColor=white)](https://webrtc.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)

[English](README.md) | [简体中文](README.zh-CN.md) | [📖 Online Docs](https://lessup.github.io/webrtc/)

</div>

<p align="center">
  From basic peer-to-peer calls to advanced multi-party Mesh architecture. <br>
  A learning-oriented, security-first WebRTC implementation in Go.
</p>

<p align="center">
  <a href="specs/product/webrtc-platform.md">📋 Product Spec</a> ·
  <a href="specs/rfc/0001-signaling-server.md">🏗️ RFCs</a> ·
  <a href="specs/api/signaling.yaml">📡 API Spec</a> · 
  <a href="CHANGELOG.md">📝 Changelog</a> ·
  <a href="ROADMAP.md">🗺️ Roadmap</a>
</p>

---

## Table of Contents

- [✨ Features](#-features)
- [🚀 Quick Start](#-quick-start)
- [🏗️ Architecture](#️-architecture)
- [📚 Documentation](#-documentation)
- [⚙️ Configuration](#️-configuration)
- [🚀 Deployment](#-deployment)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

---

## ✨ Features

<table>
<tr>
<td width="50%">

### Core Capabilities
- **🌐 WebSocket Signaling** — Gorilla WebSocket with heartbeat & room management
- **👥 Multi-party Mesh** — Up to 50 participants per room
- **💬 DataChannel Chat** — P2P messaging without server relay
- **🎥 Media Controls** — Mute/unmute, camera toggle, screen sharing
- **📹 Local Recording** — Browser-side MediaRecorder with WebM export

</td>
<td width="50%">

### Production Ready
- **🔒 Security-First** — Origin validation, identity binding, rate limiting
- **📦 Zero-Dependency Frontend** — Pure vanilla JavaScript
- **🐳 Docker Ready** — Multi-stage builds for minimal image size
- **🧪 Well Tested** — Unit tests, e2e tests with Playwright
- **📝 Bilingual Docs** — Complete EN/ZH documentation

</td>
</tr>
</table>

---

## 🚀 Quick Start

### Prerequisites

- [Go 1.22+](https://golang.org/dl/)
- Modern browser (Chrome 90+, Firefox 88+, Safari 14+)
- [Docker](https://www.docker.com/) (optional)

### Option 1: Run Locally (Fastest)

```bash
# Clone and run
git clone https://github.com/LessUp/webrtc.git
cd webrtc
go mod tidy
go run ./cmd/server

# Open http://localhost:8080
```

### Option 2: Docker

```bash
docker build -t webrtc .
docker run --rm -p 8080:8080 webrtc
```

### Option 3: Docker Compose (Production)

```bash
export DOMAIN=your-domain.com
docker compose up -d
```

Visit `https://your-domain.com` with automatic HTTPS via Caddy.

### Usage

1. Open two browser windows to `http://localhost:8080`
2. Enter the **same room name** and click **Join**
3. Select a peer from the member list and click **Call**
4. Allow camera/microphone permissions ✅
5. Enjoy video calls, screen sharing, and text chat!

<details>
<summary>💡 Need help with NAT traversal?</summary>

For connections across different networks, configure a TURN server:

```bash
export RTC_CONFIG_JSON='{
  "iceServers": [
    { "urls": ["stun:stun.l.google.com:19302"] },
    { "urls": ["turn:your-turn.com:3478"], "username": "user", "credential": "pass" }
  ]
}'
```

See [Deployment Guide](docs/deployment.md) for TURN setup.
</details>

---

## 🏗️ Architecture

This project follows **Spec-Driven Development (SDD)** — all implementation is driven by specifications.

### System Overview

```
┌────────────────────────────────────────────────────────────┐
│  Browser A                                                  │
│  ┌────────┐    ┌──────────┐    ┌────────────────────┐     │
│  │HTML UI │──→ │  app.js  │──→ │   getUserMedia     │     │
│  └────────┘    └────┬─────┘    └─────────┬──────────┘     │
└─────────────────────┼────────────────────┼────────────────┘
                      │ WebSocket          │ WebRTC P2P
               ┌──────▼──────┐             │
               │  Go Server   │             │
               │ ┌─────────┐ │             │
               │ │Hub/Room │ │             │
               │ │Manager  │ │             │
               │ └─────────┘ │             │
               └──────┬──────┘             │
                      │ WebSocket          │
┌─────────────────────┼────────────────────┼────────────────┐
│  Browser B          │                    │                │
│  ┌────────┐    ┌────▼──────┐    ┌───────▼────────────┐   │
│  │HTML UI │──→ │  app.js   │──→ │   getUserMedia     │   │
│  └────────┘    └───────────┘    └────────────────────┘   │
└────────────────────────────────────────────────────────────┘
```

| Flow | Technology | Description |
|:-----|:-----------|:------------|
| **Signaling** | WebSocket `/ws` | Offer/Answer/ICE relay via Go Hub |
| **Media** | WebRTC P2P | Audio/video streams (direct browser-to-browser) |
| **DataChannel** | WebRTC P2P | Text chat (direct browser-to-browser) |

### Project Structure

```
webrtc/
├── cmd/server/              # HTTP + WebSocket entry point
├── internal/signal/         # Signaling logic
│   ├── hub.go               # Room management, message relay
│   ├── hub_test.go          # Unit tests
│   └── message.go           # Message types
├── web/                     # Frontend (vanilla JS)
│   ├── src/
│   │   ├── core/            # App initialization
│   │   └── controllers/     # UI, media, signaling, peers
│   ├── index.html
│   └── styles.css
├── docs/                    # Documentation (EN/ZH)
├── specs/                   # Specifications (SDD)
│   ├── product/             # Feature specs
│   ├── rfc/                 # Architecture RFCs
│   ├── api/                 # OpenAPI specs
│   ├── db/                  # Schema definitions
│   └── testing/             # BDD test specs
└── deploy/                  # Deployment configs
```

### Specifications

| Document | Purpose |
|:---------|:--------|
| **[Product Spec](specs/product/webrtc-platform.md)** | Feature definitions, user stories, acceptance criteria |
| **[RFC-0001](specs/rfc/0001-signaling-server.md)** | Signaling server architecture decisions |
| **[RFC-0002](specs/rfc/0002-frontend-architecture.md)** | Frontend module design and state management |
| **[API Spec](specs/api/signaling.yaml)** | OpenAPI 3.0 signaling protocol specification |
| **[DB Schema](specs/db/schema.md)** | In-memory data structure definitions |
| **[Testing Spec](specs/testing/testing-spec.feature)** | BDD acceptance criteria |

---

## 📚 Documentation

### 📖 Guides

| Document | Description |
|:---------|:------------|
| **[Guide](docs/guide.md)** | Architecture deep-dive, implementation walkthrough |
| **[Signaling Protocol](docs/signaling.md)** | WebSocket message formats and flow |
| **[Deployment](docs/deployment.md)** | Docker, HTTPS, TURN server setup |
| **[API Reference](docs/api.md)** | Environment variables and configuration |
| **[Troubleshooting](docs/troubleshooting.md)** | Common issues and solutions |

### 🌐 Online Documentation

**https://lessup.github.io/webrtc/**

Complete documentation with search, navigation, and bilingual support.

---

## ⚙️ Configuration

### Environment Variables

| Variable | Default | Description |
|:---------|:--------|:------------|
| `ADDR` | `:8080` | HTTP listen address |
| `WS_ALLOWED_ORIGINS` | `*` | Allowed origins (comma-separated, `*` for all) |
| `RTC_CONFIG_JSON` | Public STUN | ICE/TURN config (JSON) passed to browser |

### ICE/TURN Configuration Example

```bash
export RTC_CONFIG_JSON='{
  "iceServers": [
    { "urls": ["stun:stun.l.google.com:19302"] },
    { 
      "urls": ["turn:turn.yourdomain.com:3478"],
      "username": "your_username",
      "credential": "your_password"
    }
  ]
}'
```

---

## 🚀 Deployment

### Production Checklist

- [ ] Set `WS_ALLOWED_ORIGINS` to your domain (security)
- [ ] Configure TURN server for NAT traversal
- [ ] Enable HTTPS (Caddy auto-handles this)
- [ ] Set up monitoring and log rotation

### Docker Compose (Recommended)

```yaml
# docker-compose.yml
services:
  webrtc:
    build: .
    environment:
      - WS_ALLOWED_ORIGINS=yourdomain.com
      - RTC_CONFIG_JSON={"iceServers":[...]}
  
  caddy:
    image: caddy:2-alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./deploy/web/Caddyfile:/etc/caddy/Caddyfile
  
  coturn:
    image: coturn/coturn:latest
    network_mode: host
```

See **[Deployment Guide](docs/deployment.md)** for detailed instructions.

---

## 🤝 Contributing

We welcome contributions! This project follows **Spec-Driven Development (SDD)**:

1. 📝 Read the relevant specs in `/specs` first
2. 💡 Propose spec changes if needed
3. 💻 Implement according to specs
4. ✅ Test against acceptance criteria

### Quick Links

- **[AGENTS.md](AGENTS.md)** — AI agent workflow guidelines
- **[Contributing Guide](CONTRIBUTING.md)** — Setup, coding standards, PR process
- **[Roadmap](ROADMAP.md)** — Future plans and features
- **[Changelog](CHANGELOG.md)** — Version history

### Development

```bash
# Setup
go mod tidy

# Run tests
go test -race ./...

# Run linter
golangci-lint run

# Start with hot reload
air
```

---

## 🛡️ Security

- ✅ Origin whitelist validation
- ✅ Server-verified client identities
- ✅ Connection limits (50/room, 1000 rooms max)
- ✅ Input validation and sanitization

See [Security Policy](.github/SECURITY.md) for reporting vulnerabilities.

---

## 📊 Project Stats

| Metric | Value |
|:-------|:------|
| **Language** | Go / JavaScript |
| **Lines of Code** | ~3,000 Go + ~2,000 JS |
| **Test Coverage** | Core modules tested |
| **License** | MIT |

---

## 📄 License

[MIT License](LICENSE) © [LessUp](https://github.com/LessUp)

---

<div align="center">

**[⭐ Star this repo](https://github.com/LessUp/webrtc/stargazers)** if you find it helpful!

Made with ❤️ by [LessUp](https://github.com/LessUp)

[![GitHub Stars](https://img.shields.io/github/stars/LessUp/webrtc?style=social)](https://github.com/LessUp/webrtc/stargazers)

</div>
