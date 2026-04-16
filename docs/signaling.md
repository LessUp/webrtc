---
layout: default
title: Signaling Protocol — WebRTC
description: WebSocket signaling protocol specification and message reference
---

[← Back to Home]({{ site.baseurl }}/) | [Documentation Index](README.md)

# Signaling Protocol

This document provides the complete specification for the WebSocket signaling protocol used in the WebRTC project.

---

## Table of Contents

- [Overview](#overview)
- [Message Format](#message-format)
- [Message Types](#message-types)
- [Hub Architecture](#hub-architecture)
- [Connection Lifecycle](#connection-lifecycle)
- [Room Operations](#room-operations)
- [Message Routing](#message-routing)
- [Error Handling](#error-handling)
- [Limits](#limits)
- [Sequence Diagrams](#sequence-diagrams)

---

## Overview

WebRTC handles peer-to-peer media and data transport but doesn't define how peers discover each other or exchange connection information.

Before establishing a WebRTC connection, peers must exchange:

| Information | Purpose |
|:------------|:--------|
| Room membership | Who is in the room |
| SDP (Session Description) | Media capabilities, codecs |
| ICE Candidates | Network reachability addresses |

**Protocol Stack**:
- **Transport**: WebSocket (ws:// or wss://)
- **Format**: JSON messages
- **Server**: Go Hub with room management
- **Security**: Origin validation, identity binding

---

## Message Format

### Message Structure

```go
type Message struct {
    Type      string          `json:"type"`
    Room      string          `json:"room"`
    From      string          `json:"from"`
    To        string          `json:"to,omitempty"`
    SDP       json.RawMessage `json:"sdp,omitempty"`
    Candidate json.RawMessage `json:"candidate,omitempty"`
    Members   []string        `json:"members,omitempty"`
    Code      string          `json:"code,omitempty"`
    Error     string          `json:"error,omitempty"`
}
```

### Field Descriptions

| Field | Type | Required | Description |
|:------|:-----|:---------|:------------|
| `type` | string | Yes | Message type identifier |
| `room` | string | Context | Room name (required for room operations) |
| `from` | string | Context | Sender client ID (server sets after join) |
| `to` | string | No | Target client ID (for direct messages) |
| `sdp` | object | Context | SDP offer/answer object |
| `candidate` | object | Context | ICE candidate object |
| `members` | array | Context | Room member ID list |
| `code` | string | Error | Error code |
| `error` | string | Error | Error message |

---

## Message Types

### Control Messages

#### `join` — Client → Server

Join a room with specified ID.

```json
{
  "type": "join",
  "room": "my-room",
  "from": "alice"
}
```

**Validation**:
- ID length: 1-64 characters
- Room name length: 1-64 characters
- ID must be unique within room
- Room limit: max 1000 rooms
- Client limit: max 50 per room

#### `joined` — Server → Client

Confirmation of successful room join.

```json
{
  "type": "joined",
  "room": "my-room",
  "from": "alice"
}
```

#### `leave` — Client → Server

Leave current room.

```json
{
  "type": "leave",
  "room": "my-room",
  "from": "alice"
}
```

#### `room_members` — Server → Clients

Broadcast when room membership changes.

```json
{
  "type": "room_members",
  "room": "my-room",
  "members": ["alice", "bob", "charlie"]
}
```

### WebRTC Signaling Messages

#### `offer` — Client ↔ Client

SDP offer for initiating connection.

```json
{
  "type": "offer",
  "room": "my-room",
  "from": "alice",
  "to": "bob",
  "sdp": {
    "type": "offer",
    "sdp": "v=0\r\no=- 1234567890 2 IN IP4 127.0.0.1\r\n..."
  }
}
```

#### `answer` — Client ↔ Client

SDP answer in response to offer.

```json
{
  "type": "answer",
  "room": "my-room",
  "from": "bob",
  "to": "alice",
  "sdp": {
    "type": "answer",
    "sdp": "v=0\r\no=- 0987654321 2 IN IP4 127.0.0.1\r\n..."
  }
}
```

#### `candidate` — Client ↔ Client

ICE candidate for NAT traversal.

```json
{
  "type": "candidate",
  "room": "my-room",
  "from": "alice",
  "to": "bob",
  "candidate": {
    "candidate": "candidate:1234567890 1 udp 2122260223 192.168.1.100 54321 typ host",
    "sdpMid": "0",
    "sdpMLineIndex": 0
  }
}
```

#### `hangup` — Client ↔ Client

Signal to end a call.

```json
{
  "type": "hangup",
  "room": "my-room",
  "from": "alice",
  "to": "bob"
}
```

### Health Check Messages

#### `ping` / `pong` — Client ↔ Server

Heartbeat for connection health.

```json
{ "type": "ping" }
{ "type": "pong" }
```

### Error Messages

#### `error` — Server → Client

Protocol error response.

```json
{
  "type": "error",
  "code": "duplicate_id",
  "error": "client id already exists in room"
}
```

---

## Hub Architecture

### Data Structures

```go
type Hub struct {
    mu               sync.RWMutex
    rooms            map[string]map[string]*Client
    clients          map[*Client]struct{}
    upg              websocket.Upgrader
    allowedOrigins   []string
    allowAllOrigins  bool
    closed           bool
    nextConnID       atomic.Uint64
}

type Client struct {
    mu        sync.RWMutex
    id        string
    room      string
    connID    uint64
    conn      *websocket.Conn
    send      chan Message
    closed    chan struct{}
    closeOnce sync.Once
}
```

### Room Model

```
rooms = {
  "room1": {
    "alice": *Client{ id: "alice", room: "room1", ... },
    "bob":   *Client{ id: "bob",   room: "room1", ... }
  },
  "room2": {
    "charlie": *Client{ id: "charlie", room: "room2", ... }
  }
}
```

---

## Connection Lifecycle

### WebSocket Handler

```go
func (h *Hub) HandleWS(w http.ResponseWriter, r *http.Request) {
    // 1. Upgrade HTTP to WebSocket
    conn, err := h.upg.Upgrade(w, r, nil)
    if err != nil {
        log.Printf("signal: ws upgrade failed: %v", err)
        return
    }

    // 2. Create client
    client := &Client{
        connID: h.nextConnID.Add(1),
        conn:   conn,
        send:   make(chan Message, SendBufferSize),
        closed: make(chan struct{}),
    }
    h.registerClient(client)

    // 3. Start write goroutine
    go client.writePump()

    // 4. Read loop
    for {
        var msg Message
        if err := conn.ReadJSON(&msg); err != nil {
            break
        }
        h.handleMessage(client, msg)
    }

    // 5. Cleanup (explicit order)
    h.removeClient(client)
    h.unregisterClient(client)
    client.close()
}
```

### Cleanup Sequence

The cleanup follows strict order to avoid races:

1. **`removeClient`** — Remove from room, broadcast member list
2. **`unregisterClient`** — Remove from Hub's client set
3. **`client.close()`** — Close WebSocket connection

---

## Room Operations

### Join Room

```go
func (h *Hub) handleJoin(c *Client, msg Message) error {
    id := normalizeClientID(msg.From, MaxClientIDLength)
    room := normalizeRoomName(msg.Room, MaxRoomIDLength)

    // Validation...

    c.setIdentity(id, room)

    if err := h.addClient(c); err != nil {
        return err
    }

    // Send confirmation
    c.enqueue(Message{Type: "joined", Room: room, From: id})

    // Broadcast member list
    h.broadcastMembers(room)
    return nil
}
```

### Leave Room

```go
func (h *Hub) removeClient(c *Client) {
    id, room := c.identity()
    if room == "" || id == "" {
        return
    }

    h.mu.Lock()
    defer h.mu.Unlock()

    if m, ok := h.rooms[room]; ok {
        delete(m, id)
        if len(m) == 0 {
            delete(h.rooms, room)
        } else {
            h.broadcastMembers(room)
        }
    }

    c.setRoom("")
}
```

---

## Message Routing

### Forward Function

```go
func (h *Hub) forward(sender *Client, msg Message) error {
    id, room := sender.identity()

    h.mu.RLock()
    m, ok := h.rooms[room]
    if !ok {
        h.mu.RUnlock()
        return errors.New("room missing")
    }

    dst, ok := m[msg.To]
    h.mu.RUnlock()

    if !ok {
        return errors.New("target not found")
    }

    // Server overrides these fields for security
    msg.Room = room
    msg.From = id

    return dst.enqueue(msg)
}
```

### Security Note

The server **always overrides** `from` and `room` fields to prevent spoofing:

```go
msg.Room = room  // Server's record of sender's room
msg.From = id    // Server's record of sender's ID
```

---

## Error Handling

### Protocol Error Codes

| Code | Description | HTTP Equivalent |
|:-----|:------------|:----------------|
| `invalid_id` | Client ID format invalid | 400 |
| `invalid_room` | Room name format invalid | 400 |
| `identity_locked` | Connection already has an identity | 409 |
| `already_joined` | Already in a different room | 409 |
| `duplicate_id` | Client ID already exists in room | 409 |
| `room_full` | Room has reached max clients | 503 |
| `room_limit_reached` | Server has reached max rooms | 503 |
| `not_joined` | Must join room first | 403 |
| `invalid_target` | Target client ID invalid | 400 |
| `target_not_found` | Target not in room | 404 |

### Error Response Format

```json
{
  "type": "error",
  "code": "duplicate_id",
  "error": "client id already exists in room"
}
```

---

## Limits

| Constant | Value | Description |
|:---------|:------|:------------|
| `MaxRooms` | 1000 | Maximum concurrent rooms |
| `MaxClientsPerRoom` | 50 | Maximum clients per room |
| `MaxRoomIDLength` | 64 | Maximum room name length |
| `MaxClientIDLength` | 64 | Maximum client ID length |
| `SendBufferSize` | 64 | Message buffer per client |
| `SendTimeout` | 2s | Timeout for sending to buffer |
| `MaxMessageSize` | 1MB | Maximum WebSocket message size |

---

## Sequence Diagrams

### Join Flow

```
Client                 Server                  Room Members
   │                      │                         │
   │──── join ───────────▶│                         │
   │                      │── addClient ───────────▶│
   │◀─── joined ──────────│                         │
   │                      │── room_members ────────▶│
   │                      │                         │
```

### Call Flow

```
Client A               Server                  Client B
   │                      │                        │
   │──── offer ──────────▶│──── offer ────────────▶│
   │                      │                        │
   │◀─── answer ──────────│◀─── answer ───────────│
   │                      │                        │
   │◀─── candidate ───────│◀─── candidate ────────│
   │──── candidate ──────▶│──── candidate ───────▶│
   │                      │                        │
   │◀═════════════════════╪════ WebRTC P2P ═══════▶│
```

### Multi-party Join

```
Alice                  Server                  Bob                    Carol
  │                      │                       │                      │
  │──── join ───────────▶│                       │                      │
  │◀─── joined ──────────│                       │                      │
  │                      │                       │                      │
  │                      │◀──────────────────────│──── join ───────────▶│
  │                      │──── room_members ────▶│◀─── joined ──────────│
  │◀─────────────────────│──── room_members ────▶│──── room_members ───▶│
  │                      │                       │                      │
```

---

## Frontend Integration

### Connection Example

```javascript
function connectWS() {
    const proto = location.protocol === 'https:' ? 'wss://' : 'ws://';
    ws = new WebSocket(proto + location.host + '/ws');

    ws.onopen = () => {
        ws.send(JSON.stringify({
            type: 'join',
            room: roomId,
            from: myId
        }));
    };

    ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        handleMessage(msg);
    };
}
```

### Message Handler Example

```javascript
function handleMessage(msg) {
    switch (msg.type) {
        case 'joined':
            state.roomState = 'joined';
            break;
        case 'room_members':
            renderMembers(msg.members);
            break;
        case 'offer':
        case 'answer':
            applyDescription(msg.from, msg.sdp);
            break;
        case 'candidate':
            handleCandidate(msg.from, msg.candidate);
            break;
        case 'hangup':
            closePeer(msg.from);
            break;
        case 'error':
            setError(msg.error);
            break;
    }
}
```

---

## Related Documentation

- [Technical Guide](guide.md) — Architecture overview
- [API Reference](api.md) — Configuration and usage
- [Deployment Guide](deployment.md) — Production setup
