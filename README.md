# WebRTC

[![Go CI](https://github.com/LessUp/webrtc/actions/workflows/ci.yml/badge.svg)](https://github.com/LessUp/webrtc/actions/workflows/ci.yml)
[![Pages](https://github.com/LessUp/webrtc/actions/workflows/pages.yml/badge.svg)](https://lessup.github.io/webrtc/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
![Go](https://img.shields.io/badge/Go-1.22+-00ADD8?logo=go&logoColor=white)
![WebRTC](https://img.shields.io/badge/WebRTC-Enabled-333333?logo=webrtc&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)

English | [简体中文](README.zh-CN.md) | [📖 Online Docs](https://lessup.github.io/webrtc/)

> **A production-ready WebRTC learning platform** — From basic peer-to-peer calls to advanced multi-party Mesh architecture, this project provides a complete, well-documented implementation for understanding WebRTC fundamentals through hands-on practice.

**Why This Project?**
- 🎯 **Learning-Oriented**: Progressive complexity from 1-on-1 to multi-party calls
- 🔒 **Security-First**: Origin validation, identity binding, connection limits
- 📦 **Zero-Dependency Frontend**: Pure vanilla JavaScript, no frameworks required
- 🐳 **Docker-Ready**: Multi-stage builds for minimal image size
- 📚 **Comprehensive Docs**: Architecture diagrams, protocol specs, and troubleshooting guides

## ✨ Key Features

### Core Capabilities
| Feature | Description | Status |
|:--------|:------------|:-------|
| **WebSocket Signaling** | Gorilla WebSocket for Offer/Answer/ICE Candidate relay with heartbeat, join acknowledgement, and explicit hangup | ✅ Production |
| **Media Controls** | Mute/unmute, camera on/off, screen sharing (`getDisplayMedia`) | ✅ Production |
| **DataChannel** | Peer-to-peer text chat without server relay | ✅ Production |
| **Local Recording** | MediaRecorder captures audio/video streams, exports `.webm` for download | ✅ Production |
| **Multi-party Mesh** | Room member list broadcast, multi-PeerConnection management, grid video layout | ✅ Production |

### Security & Reliability
| Feature | Description | Status |
|:--------|:------------|:-------|
| **Origin Validation** | Whitelist-based CORS protection for WebSocket connections | ✅ Production |
| **Identity Binding** | WebSocket connections bound to single client ID and room membership | ✅ Production |
| **Connection Limits** | Room/client limits, duplicate ID rejection, auto-reconnection | ✅ Production |
| **Perfect Negotiation** | Collision handling and explicit hangup signaling for stable Mesh calls | ✅ Production |

### DevOps & Deployment
| Feature | Description | Status |
|:--------|:------------|:-------|
| **Docker** | Multi-stage Dockerfile, Go compilation + static frontend packaging | ✅ Production |
| **CI/CD** | GitHub Actions with golangci-lint, multi-version testing, Pages deployment | ✅ Production |
| **Health Checks** | `/healthz` endpoint for container orchestration | ✅ Production |

## 🏗️ Architecture Overview

### System Architecture

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

### Data Flow

| Flow Type | Path | Description |
|:-----------|:-----|:------------|
| **Signaling** | Browser → WebSocket `/ws` → Signal Hub → Browser | Offer/Answer/ICE Candidate relay |
| **Media** | Browser ←→ WebRTC P2P ←→ Browser | Audio/Video streams |
| **DataChannel** | Browser ←→ WebRTC P2P ←→ Browser | Text chat, file transfer |

## 🚀 Quick Start

### Prerequisites

- **Go**: 1.22 or later
- **Browser**: Chrome / Edge / Firefox (latest version)
- **Docker** (optional): For containerized deployment

### Option 1: Native Go Runtime

```bash
# Clone the repository
git clone https://github.com/LessUp/webrtc.git
cd webrtc

# Install dependencies
go mod tidy

# Start the server
go run ./cmd/server

# Server will be available at http://localhost:8080
```

### Option 2: Docker Deployment

```bash
# Build the Docker image
docker build -t webrtc .

# Run the container
docker run --rm -p 8080:8080 webrtc

# Access the application at http://localhost:8080
```

### Testing the Application

1. Open two browser tabs at `http://localhost:8080`
2. In both tabs, enter the same **room name** and click **Join**
3. In one tab, click the other user's ID from the member list
4. Click **Call** to initiate the connection
5. Grant camera/microphone permissions when prompted
6. You should now see the remote video stream

> **Note**: If testing on the same machine, you may need to disable "HTTPS-Only" mode or use incognito windows.

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Default | Example |
|:---------|:------------|:--------|:--------|
| `ADDR` | HTTP server listen address | `:8080` | `:8080`, `0.0.0.0:8080` |
| `WS_ALLOWED_ORIGINS` | Comma-separated allowed origins for WebSocket connections | `localhost` | `localhost,example.com` or `*` |
| `RTC_CONFIG_JSON` | Custom ICE/TURN configuration as JSON | Built-in public STUN | See example below |

### Custom ICE/TURN Configuration

Set the `RTC_CONFIG_JSON` environment variable to configure custom STUN/TURN servers:

```bash
export RTC_CONFIG_JSON='{
  "iceServers": [
    { "urls": ["stun:stun.l.google.com:19302"] },
    {
      "urls": ["turn:turn.example.com:3478"],
      "username": "demo-user",
      "credential": "demo-password"
    }
  ]
}'
```

### Health Check

The server provides a health check endpoint for container orchestration:

```bash
curl http://localhost:8080/healthz
# Returns: OK
```

## 📁 Project Structure

```
webrtc/
├── cmd/server/              # HTTP + WebSocket entry point
│   └── main.go              # Server startup, graceful shutdown, origin config
├── internal/signal/         # Signaling logic
│   ├── hub.go               # Room management, message relay, client lifecycle
│   ├── hub_test.go          # Unit tests
│   └── message.go           # Message type definitions
├── web/                     # Browser frontend
│   ├── index.html           # UI
│   ├── app.js               # WebRTC & signaling logic (Mesh multi-party)
│   └── styles.css           # Responsive styles (light/dark theme)
├── docs/                    # Technical documentation
│   ├── guide.md             # Architecture, frontend, media, recording
│   └── signaling.md         # Signaling protocol deep dive
├── .github/workflows/       # CI/CD pipelines
│   ├── ci.yml               # Go build + test + lint
│   └── pages.yml            # GitHub Pages deployment
├── changelog/               # Change logs
├── Dockerfile               # Multi-stage build
├── .golangci.yml            # Linter configuration
└── go.mod                   # Go module definition
```

## 🛠️ Tech Stack

| Category | Technology | Purpose |
|:---------|:-----------|:--------|
| **Backend** | Go 1.22+, net/http, Gorilla WebSocket | Signaling server, WebSocket handling |
| **Frontend** | HTML5 + Vanilla JavaScript + CSS3 | Zero-dependency browser UI |
| **Media** | WebRTC APIs | getUserMedia, RTCPeerConnection, DataChannel, MediaRecorder |
| **Container** | Docker (multi-stage) | Minimal image size, easy deployment |
| **CI/CD** | GitHub Actions | golangci-lint, multi-version testing, Pages deployment |

## 📚 Documentation

| Document | Description |
|:---------|:------------|
| [Technical Guide](docs/guide.md) | Architecture, frontend implementation, media controls, recording |
| [Signaling Deep Dive](docs/signaling.md) | Signaling protocol, room management, message flow |
| [Roadmap](ROADMAP.md) | Development plan, progress tracking, future features |
| [Contributing](CONTRIBUTING.md) | Development workflow, code standards, PR guidelines |

## 🔒 Security Features

This project implements several security best practices:

- **Identity Binding**: Each WebSocket connection is bound to a single client ID and room membership
- **Duplicate Rejection**: Duplicate client IDs in the same room are rejected
- **Connection Limits**: Room and client limits prevent resource exhaustion
- **Origin Validation**: Whitelist-based CORS protection for WebSocket connections
- **Perfect Negotiation**: Collision handling and explicit hangup signaling for stable Mesh calls
- **WebSocket Hardening**: Read limits, deadlines, pong handling, server-driven ping frames

## 🗺️ Roadmap

### Completed ✅
- [x] 1-on-1 call with status display, error handling, heartbeat
- [x] Mute/camera/screen sharing, DataChannel chat, local recording
- [x] Room member list, auto-call prompt, multi-party Mesh
- [x] Docker multi-stage build & deployment

### In Progress 🚧
- [ ] TURN support (coturn)
- [ ] HTTPS/WSS reverse proxy

### Future 🔮
- [ ] Multi-party calls via SFU
- [ ] End-to-end encryption
- [ ] Mobile app support

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for:
- Development workflow
- Code standards
- Commit message format
- Pull request process

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

**Made with ❤️ by the LessUp Team**
