---
layout: docs
title: Signaling Protocol — WebRTC
description: Signaling behavior and server-side guarantees for LessUp WebRTC.
---

# Signaling Protocol

The signaling layer uses a single WebSocket endpoint: `GET /ws`.

## Core message types

| Type | Direction | Purpose |
|:-----|:----------|:--------|
| `join` | client → server | bind client identity and room |
| `joined` | server → client | join acknowledgement |
| `room_members` | server → room | member list updates |
| `offer` / `answer` | peer ↔ peer via server | SDP relay |
| `candidate` | peer ↔ peer via server | ICE relay |
| `hangup` | peer ↔ peer via server | end call |
| `ping` / `pong` | client ↔ server | keepalive |
| `error` | server → client | structured failure |

## Server guarantees

The Go hub enforces:

- one identity per WebSocket connection
- room and client ID validation
- origin validation
- room size and room count limits
- sender-controlled fields being overwritten on relay (`from`, `room`)

## Key limits

| Limit | Value |
|:------|:------|
| max rooms | 1000 |
| max clients per room | 50 |
| max message size | 1 MiB |
| max client / room ID length | 64 |
| send timeout | 2 seconds |

## Typical join flow

```text
Client A -> join(room, from)
Server   -> joined
Server   -> room_members

Client B -> join(room, from)
Server   -> joined
Server   -> room_members (A, B)
```

## Where the protocol lives

- runtime implementation: `internal/signal/`
- normative requirement specs: [OpenSpec Hub](specs)
- message envelope: `internal/signal/message.go`
