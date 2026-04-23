# Signaling Specification

## Purpose

WebSocket-based signaling server for WebRTC peer connection establishment. Built with Go 1.22+ and gorilla/websocket for handling room management, message routing, and client lifecycle.

---

## Architecture

### Technology Stack

| Component | Technology |
|:----------|:-----------|
| Language | Go 1.22+ |
| WebSocket | `github.com/gorilla/websocket` v1.5.3 |
| HTTP Server | `net/http` (standard library) |
| Build Tool | Make, Air (live reload) |

### Core Components

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

---

## Requirements

### Requirement: WebSocket Connection

The system SHALL accept WebSocket connections at the `/ws` endpoint.

#### Scenario: Successful connection

- **WHEN** client connects with valid origin
- **THEN** connection SHALL be upgraded to WebSocket
- **AND** client SHALL be registered in Hub

#### Scenario: Invalid origin rejection

- **WHEN** client connects with origin not in allowed list
- **THEN** connection SHALL be rejected with HTTP 403

### Requirement: Hub Room Management

The system SHALL manage rooms and clients via a central Hub.

#### Scenario: Room creation

- **WHEN** first client joins a room
- **THEN** room SHALL be created in Hub.rooms map

#### Scenario: Room deletion

- **WHEN** last client leaves a room
- **THEN** room SHALL be deleted from Hub.rooms map

#### Scenario: Client registration

- **WHEN** WebSocket connection established
- **THEN** client SHALL be added to Hub.clients set

#### Scenario: Client unregistration

- **WHEN** WebSocket connection closed
- **THEN** client SHALL be removed from Hub.clients set
- **AND** client SHALL be removed from its room

### Requirement: Message Routing

The system SHALL route signaling messages between clients.

#### Scenario: Join message

- **WHEN** client sends `{"type": "join", "room": "X", "from": "Y"}`
- **THEN** system SHALL bind client identity (id=Y, room=X)
- **AND** send `{"type": "joined"}` to client
- **AND** broadcast `{"type": "room_members", "members": [...]}` to room

#### Scenario: Offer/Answer relay

- **WHEN** client sends `{"type": "offer"/"answer", "to": "Z", ...}`
- **THEN** system SHALL relay message to client Z
- **AND** override "from" field with sender's bound ID

#### Scenario: ICE candidate relay

- **WHEN** client sends `{"type": "candidate", "to": "Z", ...}`
- **THEN** system SHALL relay candidate to client Z

#### Scenario: Broadcast message

- **WHEN** client sends message without "to" field
- **THEN** system SHALL broadcast to all room members except sender

### Requirement: Identity Binding

The system SHALL enforce identity binding per WebSocket connection.

#### Scenario: First join binds identity

- **WHEN** client sends first "join" message
- **THEN** client ID and room SHALL be bound to connection
- **AND** subsequent join attempts SHALL be rejected with "already_joined"

#### Scenario: Duplicate ID rejection

- **WHEN** client attempts to join with ID already in room
- **THEN** system SHALL reject with "duplicate_id" error

#### Scenario: Identity locked

- **WHEN** client attempts to change ID or room after binding
- **THEN** system SHALL reject with "identity_locked" error

### Requirement: Resource Limits

The system SHALL enforce resource limits.

#### Scenario: Room full

- **WHEN** room has 50 clients
- **AND** new client attempts to join
- **THEN** system SHALL reject with "room_full" error

#### Scenario: Room limit reached

- **WHEN** server has 1000 rooms
- **AND** new room creation attempted
- **THEN** system SHALL reject with "room_limit_reached" error

#### Scenario: Message size limit

- **WHEN** client sends message larger than 1MB
- **THEN** connection SHALL be closed

### Requirement: Cleanup Sequence

The system SHALL follow strict cleanup order to avoid races.

#### Scenario: Client disconnect cleanup

- **WHEN** client WebSocket closes
- **THEN** system SHALL execute in order:
  1. `removeClient` — Remove from room, broadcast member list
  2. `unregisterClient` — Remove from Hub's client set
  3. `client.close()` — Close WebSocket connection

---

## Data Structures

### Hub State

```go
type Hub struct {
    mu               sync.RWMutex
    rooms            map[string]map[string]*Client  // room -> (clientID -> Client)
    clients          map[*Client]struct{}            // all connected clients
    upg              websocket.Upgrader
    allowedOrigins   []string
    allowAllOrigins  bool
    closed           bool
    nextConnID       atomic.Uint64
}
```

### Client

```go
type Client struct {
    mu        sync.RWMutex
    id        string           // Client-supplied unique ID
    room      string           // Room name
    connID    uint64           // Server-assigned connection ID
    conn      *websocket.Conn
    send      chan Message     // Outbound message buffer
    closed    chan struct{}
    closeOnce sync.Once
}
```

### Message

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

---

## Configuration

| Variable | Default | Purpose |
|:---------|:--------|:--------|
| `ADDR` | `:8080` | HTTP listen address |
| `WS_ALLOWED_ORIGINS` | `localhost` | Comma-separated origins; `*` for all |
| `RTC_CONFIG_JSON` | public STUN | JSON ICE/TURN config passed to browser |

---

## Security Headers

Server sets on all responses:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
