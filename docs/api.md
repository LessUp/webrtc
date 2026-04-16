---
layout: default
title: API Reference — WebRTC
description: API reference, configuration options, and usage guide
---

[← Back to Home]({{ site.baseurl }}/) | [Documentation Index](README.md)

# API Reference

Complete reference for configuration, endpoints, and programmatic usage.

---

## Table of Contents

- [Configuration](#configuration)
- [Environment Variables](#environment-variables)
- [HTTP Endpoints](#http-endpoints)
- [WebSocket Protocol](#websocket-protocol)
- [JavaScript API](#javascript-api)
- [Limits and Performance](#limits-and-performance)

---

## Configuration

### Server Configuration

Configuration is provided via environment variables:

```bash
# Basic configuration
export ADDR=:8080
export WS_ALLOWED_ORIGINS=localhost,yourdomain.com
export RTC_CONFIG_JSON='{"iceServers":[{"urls":"stun:stun.l.google.com:19302"}]}'
```

### ICE/TURN Configuration

The `RTC_CONFIG_JSON` variable accepts a JSON object matching the [RTCIceServer](https://developer.mozilla.org/en-US/docs/Web/API/RTCIceServer) format:

```json
{
  "iceServers": [
    {
      "urls": ["stun:stun.l.google.com:19302"]
    },
    {
      "urls": ["turn:turn.example.com:3478"],
      "username": "user",
      "credential": "pass"
    }
  ],
  "iceTransportPolicy": "all",
  "bundlePolicy": "balanced"
}
```

---

## Environment Variables

| Variable | Type | Default | Description |
|:---------|:-----|:--------|:------------|
| `ADDR` | string | `:8080` | HTTP server listen address |
| `WS_ALLOWED_ORIGINS` | string | `*` | Comma-separated allowed origins. Use `*` for all |
| `RTC_CONFIG_JSON` | JSON | Public STUN | ICE/TURN server configuration |

### ADDR

Specifies the network address for the HTTP server.

```bash
# IPv4 on all interfaces
ADDR=0.0.0.0:8080

# IPv6
ADDR=[::]:8080

# Unix socket (advanced)
ADDR=unix:/var/run/webrtc.sock
```

### WS_ALLOWED_ORIGINS

Controls WebSocket origin validation.

```bash
# Single origin
WS_ALLOWED_ORIGINS=example.com

# Multiple origins
WS_ALLOWED_ORIGINS=localhost,example.com,app.example.com

# Allow all (development only)
WS_ALLOWED_ORIGINS=*
```

### RTC_CONFIG_JSON

Configures WebRTC ICE/TURN servers.

```bash
# Public STUN only (default)
export RTC_CONFIG_JSON='{"iceServers":[{"urls":"stun:stun.l.google.com:19302"}]}'

# With TURN server
export RTC_CONFIG_JSON='{
  "iceServers": [
    {"urls": "stun:stun.l.google.com:19302"},
    {
      "urls": "turn:turn.example.com:3478",
      "username": "webrtc",
      "credential": "secret"
    }
  ]
}'
```

---

## HTTP Endpoints

### Static Files

| Method | Path | Description |
|:-------|:-----|:------------|
| `GET` | `/` | Main application (index.html) |
| `GET` | `/styles.css` | Stylesheet |
| `GET` | `/app.js` | Main JavaScript bundle |
| `GET` | `/app.*.js` | Modular JavaScript files |

### API Endpoints

| Method | Path | Description |
|:-------|:-----|:------------|
| `GET` | `/healthz` | Health check endpoint |
| `GET` | `/ws` | WebSocket upgrade endpoint |

### Health Check

```bash
curl http://localhost:8080/healthz
```

**Response**: `ok` (HTTP 200)

Used by load balancers and monitoring systems.

### WebSocket

```javascript
const ws = new WebSocket('ws://localhost:8080/ws');
```

See [Signaling Protocol](signaling.md) for message format.

---

## WebSocket Protocol

### Connection

```javascript
const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);

ws.onopen = () => {
  // Connection established
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  // Handle message
};

ws.onclose = () => {
  // Connection closed
};

ws.onerror = (error) => {
  // Handle error
};
```

### Message Types

See [Signaling Protocol](signaling.md) for complete message specification.

**Control Messages**:
- `join` / `joined` — Room membership
- `leave` — Exit room
- `room_members` — Member list broadcast
- `ping` / `pong` — Heartbeat

**WebRTC Messages**:
- `offer` — SDP offer
- `answer` — SDP answer
- `candidate` — ICE candidate
- `hangup` — End call

**Error Messages**:
- `error` — Protocol error with code

---

## JavaScript API

### Global State

The frontend exposes a global `state` object:

```javascript
// Read-only inspection
console.log(state.myId);        // Your client ID
console.log(state.roomId);      // Current room
console.log(state.roomState);   // 'idle' | 'connecting' | 'joined' | 'calling'
console.log(state.peers);       // Map of peer connections
```

### Functions

#### Connection

```javascript
// Join a room
connect(roomId, myId);

// Leave current room
disconnect();
```

#### Calling

```javascript
// Call a peer
callPeer(peerId);

// Hang up on a peer
hangupPeer(peerId);

// Hang up all peers
hangupAll();
```

#### Media Controls

```javascript
// Toggle mute
toggleMute();

// Toggle camera
toggleCamera();

// Start screen share
startScreenShare();

// Stop screen share
stopScreenShare();
```

#### Recording

```javascript
// Start recording
startRecording();

// Stop recording (triggers download)
stopRecording();
```

#### Chat

```javascript
// Send chat message to all connected peers
sendChat(text);
```

### Events

Hook into application events:

```javascript
// Listen for state changes (example pattern)
const originalSetState = setRoomState;
setRoomState = function(newState) {
  console.log('State changed:', newState);
  originalSetState(newState);
};
```

---

## Limits and Performance

### Server Limits

| Limit | Value | Configurable |
|:------|:------|:-------------|
| Max rooms | 1000 | No |
| Max clients per room | 50 | No |
| Max room ID length | 64 chars | No |
| Max client ID length | 64 chars | No |
| Message buffer size | 64 | No |
| Send timeout | 2 seconds | No |
| Max message size | 1 MB | No |

### Performance Characteristics

| Metric | Expected Value |
|:-------|:---------------|
| Connection setup | < 100ms (local) |
| Message relay latency | < 10ms (same DC) |
| Concurrent rooms | 1000 |
| Total concurrent clients | 50,000 (1000 × 50) |
| Memory per client | ~50 KB |
| CPU usage (idle) | Minimal |
| CPU usage (active) | Low (mostly I/O) |

### Browser Limits

| Browser | Max Concurrent Peers | Notes |
|:--------|:---------------------|:------|
| Chrome | ~50 | Hardware dependent |
| Firefox | ~50 | Hardware dependent |
| Safari | ~20 | More conservative |

**Recommendation**: For rooms > 10 participants, consider SFU architecture instead of Mesh.

---

## Error Codes

See [Signaling Protocol](signaling.md#error-handling) for protocol error codes.

### HTTP Status Codes

| Status | Meaning |
|:-------|:--------|
| 200 | Success |
| 400 | Bad request (WebSocket) |
| 403 | Forbidden (origin not allowed) |
| 426 | Upgrade Required (WebSocket expected) |
| 500 | Internal server error |

---

## TypeScript Definitions

For TypeScript projects:

```typescript
// types/webrtc.d.ts

interface Message {
  type: string;
  room?: string;
  from?: string;
  to?: string;
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
  members?: string[];
  code?: string;
  error?: string;
}

interface Peer {
  id: string;
  pc: RTCPeerConnection;
  polite: boolean;
  makingOffer: boolean;
  ignoreOffer: boolean;
  pendingCandidates: RTCIceCandidateInit[];
  dc?: RTCDataChannel;
}

interface AppState {
  myId: string;
  ws: WebSocket | null;
  roomId: string;
  roomState: 'idle' | 'connecting' | 'joined' | 'reconnecting' | 'calling';
  localStream: MediaStream | null;
  screenStream: MediaStream | null;
  usingScreen: boolean;
  muted: boolean;
  cameraOff: boolean;
  peers: Map<string, Peer>;
  recorder: MediaRecorder | null;
  recordedChunks: Blob[];
}
```

---

## Related Documentation

- [Signaling Protocol](signaling.md) — Complete protocol specification
- [Technical Guide](guide.md) — Architecture and implementation
- [Deployment Guide](deployment.md) — Production setup
