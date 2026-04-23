# API Specification

## Purpose

WebSocket-based signaling API for WebRTC peer connection establishment. Defines message types, protocols, and error handling for the signaling server.

---

## Reference

The OpenAPI 3.0 specification is maintained separately at:
- **OpenAPI YAML**: `openspec/specs/api/signaling.yaml`
- **This document**: Behavioral requirements and usage guidelines

---

## Endpoints

### HTTP Endpoints

| Endpoint | Method | Description |
|:---------|:-------|:------------|
| `/` | GET | Main application (index.html) |
| `/healthz` | GET | Health check (returns "ok") |
| `/ws` | GET | WebSocket upgrade endpoint |

### WebSocket Endpoint

Connect to `ws://host/ws` for signaling. All messages are JSON.

---

## Requirements

### Requirement: Message Format

All messages SHALL be valid JSON with a `type` field.

#### Scenario: Valid message

- **WHEN** client sends `{"type": "join", ...}`
- **THEN** server SHALL parse and process the message

#### Scenario: Invalid JSON

- **WHEN** client sends invalid JSON
- **THEN** connection SHALL be closed

#### Scenario: Missing type

- **WHEN** client sends message without `type` field
- **THEN** server SHALL ignore the message

### Requirement: Message Types

The system SHALL support standard message types for signaling.

#### Scenario: Message type validation

- **WHEN** client sends message with valid type
- **THEN** server SHALL process according to message type rules

### Requirement: Join Protocol

The system SHALL implement room join protocol.

#### Scenario: Successful join

- **WHEN** client sends `{"type": "join", "room": "room1", "from": "alice"}`
- **THEN** server SHALL respond with `{"type": "joined", "room": "room1", "from": "alice"}`
- **AND** broadcast `{"type": "room_members", "members": ["alice", ...]}` to room

#### Scenario: Duplicate ID

- **WHEN** client joins with ID already in room
- **THEN** server SHALL respond with `{"type": "error", "code": "duplicate_id", "error": "..."}`

#### Scenario: Room full

- **WHEN** room has 50 clients
- **THEN** server SHALL respond with `{"type": "error", "code": "room_full", "error": "..."}`

### Requirement: SDP Exchange

The system SHALL relay SDP offers and answers.

#### Scenario: Send offer

- **WHEN** client sends `{"type": "offer", "to": "bob", "sdp": {...}}`
- **THEN** server SHALL relay to bob with `from` set to sender's ID

#### Scenario: Send answer

- **WHEN** client sends `{"type": "answer", "to": "alice", "sdp": {...}}`
- **THEN** server SHALL relay to alice with `from` set to sender's ID

### Requirement: ICE Candidate Relay

The system SHALL relay ICE candidates.

#### Scenario: Send candidate

- **WHEN** client sends `{"type": "candidate", "to": "bob", "candidate": {...}}`
- **THEN** server SHALL relay to bob with `from` set to sender's ID

### Requirement: Heartbeat

The system SHALL support WebSocket keepalive.

#### Scenario: Ping/pong

- **WHEN** client sends `{"type": "ping"}`
- **THEN** server SHALL respond with `{"type": "pong"}`

### Requirement: Error Handling

The system SHALL return structured error messages.

#### Scenario: Error format

- **WHEN** an error occurs
- **THEN** server SHALL send `{"type": "error", "code": "...", "error": "..."}`

#### Scenario: Error codes

| Code | Description |
|:-----|:------------|
| `invalid_id` | Client ID format invalid |
| `invalid_room` | Room ID format invalid |
| `identity_locked` | Cannot change identity after binding |
| `already_joined` | Already joined a room |
| `duplicate_id` | ID already in use in room |
| `room_full` | Room has 50 clients |
| `room_limit_reached` | Server has 1000 rooms |
| `not_joined` | Must join room first |
| `invalid_target` | Target not specified |
| `target_not_found` | Target not in room |

---

## Message Types Reference

| Type | Direction | Purpose |
|:-----|:----------|:--------|
| `join` | Client → Server | Join a room |
| `joined` | Server → Client | Join confirmation |
| `leave` | Client → Server | Leave room |
| `offer` | Bidirectional | SDP offer |
| `answer` | Bidirectional | SDP answer |
| `candidate` | Bidirectional | ICE candidate |
| `hangup` | Bidirectional | End call |
| `room_members` | Server → Client | Member list update |
| `ping` | Client → Server | Heartbeat request |
| `pong` | Server → Client | Heartbeat response |
| `error` | Server → Client | Error notification |

---

## Resource Limits

| Limit | Value |
|:------|:------|
| Max rooms | 1000 |
| Max clients/room | 50 |
| Max room ID length | 64 chars |
| Max client ID length | 64 chars |
| Max message size | 1 MB |
| Send buffer size | 64 messages |
| Send timeout | 2 seconds |

---

## Message Examples

### Join Room
```json
// Client sends
{"type": "join", "room": "my-room", "from": "alice"}

// Server responds
{"type": "joined", "room": "my-room", "from": "alice"}

// Server broadcasts to room
{"type": "room_members", "members": ["alice", "bob"]}
```

### Initiate Call
```json
// Alice sends offer
{"type": "offer", "to": "bob", "sdp": {...}}

// Bob receives (server relays)
{"type": "offer", "from": "alice", "sdp": {...}}

// Bob sends answer
{"type": "answer", "to": "alice", "sdp": {...}}

// Alice receives (server relays)
{"type": "answer", "from": "bob", "sdp": {...}}
```

### ICE Candidate
```json
{"type": "candidate", "to": "bob", "candidate": {...}}
```

### Error
```json
{"type": "error", "code": "room_full", "error": "Room has reached maximum capacity"}
```
