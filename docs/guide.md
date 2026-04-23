---
layout: docs
title: Technical Guide — WebRTC
description: Architecture and code map for the LessUp WebRTC project.
---

# Technical Guide

This page describes the current code layout, runtime flow, and the boundaries between the Go signaling server and the browser client.

## Code map

```text
cmd/server/main.go          HTTP entrypoint and static file serving
internal/signal/hub.go      signaling hub, rooms, limits, cleanup
internal/signal/message.go  message envelope
web/src/core/app.js         browser app assembly
web/src/controllers/        media, peers, signaling, stats, UI
web/src/config.js           client defaults and capability checks
```

## Request flow

1. the browser loads static assets from `/`
2. `web/src/core/app.js` assembles the controllers
3. the client opens `ws://host/ws` or `wss://host/ws`
4. the Go hub relays `join`, `offer`, `answer`, `candidate`, and membership updates
5. media and chat move peer-to-peer after negotiation

## Server responsibilities

`cmd/server/main.go` serves four main concerns:

- static frontend files
- `GET /config.js` for runtime RTC config injection
- `GET /healthz` for health checks
- `GET /ws` for signaling

The hub in `internal/signal/` owns:

- room creation and cleanup
- client identity binding
- origin checks
- message validation and routing
- send timeouts and rate limits

## Frontend responsibilities

The frontend is intentionally split by responsibility:

| Module | Responsibility |
|:-------|:---------------|
| `core/app.js` | wires everything together |
| `controllers/media.js` | local media, screen share, recording |
| `controllers/peers.js` | `RTCPeerConnection` lifecycle and chat |
| `controllers/signaling.js` | WebSocket join/leave/reconnect flow |
| `controllers/stats.js` | connection stats |
| `controllers/ui.js` | DOM updates and control state |
| `config.js` | client ID, capability checks, RTC defaults |

## Development commands

```bash
go run ./cmd/server
make check
cd web && npm test
cd e2e && npm test
```

## Where to look next

- [Signaling Protocol](signaling)
- [API Reference](api)
- [OpenSpec Hub](specs)
