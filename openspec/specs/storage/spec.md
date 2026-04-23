# Storage Specification

## Purpose

Define the in-memory data structures for the signaling server. This project does not use a traditional database — all state is held in memory within the Go server.

---

## Requirements

### Requirement: In-Memory State

The system SHALL maintain all state in memory without persistence.

#### Scenario: No database

- **WHEN** server starts
- **THEN** no database connection SHALL be required
- **AND** all state SHALL be initialized empty

#### Scenario: State lost on restart

- **WHEN** server restarts
- **THEN** all room and client state SHALL be lost
- **AND** clients SHALL reconnect

### Requirement: Hub Data Structure

The system SHALL use a Hub struct to manage global state.

#### Scenario: Hub initialization

- **WHEN** server starts
- **THEN** Hub SHALL be initialized with:
  - `rooms`: empty map of room -> clients
  - `clients`: empty set of connected clients
  - `upg`: WebSocket upgrader
  - `allowedOrigins`: from config

### Requirement: Room Structure

The system SHALL organize clients by room.

#### Scenario: Room as map

- **WHEN** room exists
- **THEN** room SHALL be `map[string]*Client` (clientID -> Client)

#### Scenario: Room creation

- **WHEN** first client joins a room
- **THEN** room map SHALL be created in Hub.rooms

#### Scenario: Room deletion

- **WHEN** last client leaves a room
- **THEN** room map SHALL be deleted from Hub.rooms

### Requirement: Client Identity

The system SHALL store client identity per connection.

#### Scenario: Client fields

- **WHEN** client connected
- **THEN** Client struct SHALL contain:
  - `id`: client-supplied unique ID
  - `room`: room name
  - `connID`: server-assigned connection ID
  - `conn`: WebSocket connection
  - `send`: outbound message channel

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

### Room Model

```
rooms = {
  "room1": {
    "alice": *Client{ id: "alice", room: "room1", conn: ... },
    "bob":   *Client{ id: "bob",   room: "room1", conn: ... }
  },
  "room2": {
    "charlie": *Client{ id: "charlie", room: "room2", conn: ... }
  }
}
```

### Client Identity

```go
type Client struct {
    mu        sync.RWMutex
    id        string  // Client-supplied unique ID
    room      string  // Room name
    connID    uint64  // Server-assigned connection ID
    conn      *websocket.Conn
    send      chan Message
    closed    chan struct{}
    closeOnce sync.Once
}
```

---

## State Persistence

**None**. All state is ephemeral:

| Behavior | Description |
|:---------|:------------|
| Rooms deleted when empty | No zombie rooms |
| Client state lost on disconnect | Must rejoin |
| No message history | Real-time only |
| No user accounts | Anonymous |

---

## Future Considerations

If persistence becomes a requirement:

| Data | Storage Suggestion | Purpose |
|:-----|:-------------------|:--------|
| Room history | Redis/PostgreSQL | Analytics, audit |
| User accounts | PostgreSQL | Authentication, profiles |
| Chat messages | PostgreSQL/MongoDB | Message history |
| Recording metadata | PostgreSQL | File metadata, sharing |
| TURN credentials | Redis (short TTL) | Dynamic TURN allocation |

---

## Concurrency

### Thread Safety

- Hub uses `sync.RWMutex` for room/client access
- Client uses `sync.RWMutex` for identity access
- `closeOnce` ensures single close

### Cleanup Sequence

Strict order to avoid races:

1. `removeClient` — Remove from room, broadcast member list
2. `unregisterClient` — Remove from Hub's client set
3. `client.close()` — Close WebSocket connection
