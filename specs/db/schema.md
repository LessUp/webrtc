# Database/Storage Schema

## Overview

This project does not use a traditional database. All state is held in-memory within the Go signaling server.

## In-Memory Data Structures

### Hub State

```go
// Hub manages all rooms and clients
type Hub struct {
    rooms   map[string]map[string]*Client  // room -> (clientID -> Client)
    clients map[*Client]struct{}            // all connected clients
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
    id     string  // Client-supplied unique ID
    room   string  // Room name
    connID uint64  // Server-assigned connection ID
}
```

## State Persistence

**None**. All state is ephemeral:

- Rooms are deleted when empty
- Client state is lost on disconnect
- No history or message persistence
- No user accounts or profiles

## Future Considerations

If persistence becomes a requirement:

| Data | Storage Suggestion | Purpose |
|:-----|:-------------------|:--------|
| Room history | Redis/PostgreSQL | Analytics, audit |
| User accounts | PostgreSQL | Authentication, profiles |
| Chat messages | PostgreSQL/MongoDB | Message history |
| Recording metadata | PostgreSQL | File metadata, sharing |
| TURN credentials | Redis (short TTL) | Dynamic TURN allocation |
