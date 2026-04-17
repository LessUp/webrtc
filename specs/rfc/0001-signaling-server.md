# RFC-0001: Signaling Server Architecture

| Metadata | Value |
|:---------|:------|
| **Status** | Accepted |
| **Created** | 2025-02-13 |
| **Updated** | 2026-04-17 |
| **Author** | LessUp Team |
| **Category** | Architecture |

## Context

WebRTC requires a signaling server to facilitate peer discovery and SDP/ICE exchange before P2P connections can be established. This RFC defines the architecture for the WebSocket-based signaling server.

## Decision

### Technology Stack

- **Language**: Go 1.22+
- **WebSocket Library**: `github.com/gorilla/websocket`
- **HTTP Server**: `net/http` (standard library)

### Architecture

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

### Core Components

#### Hub (`internal/signal/hub`)

Manages rooms and clients, routes messages.

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
```

**Responsibilities**:
- Room lifecycle management
- Client registration
- Message routing between peers
- Origin validation
- Broadcast room membership changes

#### Client (`internal/signal/Client`)

Represents a single WebSocket connection.

```go
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

**Responsibilities**:
- WebSocket read/write operations
- Identity binding (ID + room)
- Message buffering (send channel)
- Graceful shutdown

#### Message (`internal/signal/Message`)

JSON signaling protocol message type.

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

### Message Flow

#### Join Flow

```
Client                 Server                  Room Members
   │                      │                         │
   │──── join ───────────▶│                         │
   │                      │── addClient ───────────▶│
   │◀─── joined ──────────│                         │
   │                      │── room_members ────────▶│
   │                      │                         │
```

#### Call Flow

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

### Security Design

1. **Origin Validation**: `WS_ALLOWED_ORIGINS` environment variable whitelist
2. **Identity Binding**: One client ID per WebSocket connection, set on first `join`
3. **Field Override**: Server always overrides `from` and `room` fields in forwarded messages to prevent spoofing
4. **Resource Limits**:
   - `MaxRooms = 1000`
   - `MaxClientsPerRoom = 50`
   - `MaxMessageSize = 1MB`

### Cleanup Sequence

Strict order to avoid races:

1. `removeClient` — Remove from room, broadcast member list
2. `unregisterClient` — Remove from Hub's client set
3. `client.close()` — Close WebSocket connection

### Consequences

**Positive**:
- Simple, minimal architecture
- Easy to understand and extend
- Low memory footprint (~50KB per client)

**Trade-offs**:
- Mesh architecture limits scalability (~50 peers)
- No SFU/MCU for large rooms (future enhancement)
- In-memory state (no persistence, not HA)

## Related Documents

- [RFC-0002: Frontend Architecture](0002-frontend-architecture.md)
- [Product Specification](../product/webrtc-platform.md)
- [API Specification](../api/signaling.yaml)
