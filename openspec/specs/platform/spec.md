# Platform Specification

## Purpose

LessUp WebRTC is a production-ready learning platform demonstrating real-time audio/video communication with progressive complexity from basic peer-to-peer calls to advanced multi-party Mesh architecture.

## Requirements

### Requirement: WebSocket Signaling

The system SHALL provide WebSocket-based signaling for peer discovery and SDP/ICE exchange.

#### Scenario: Peer discovery via room

- **WHEN** a client connects to WebSocket and sends a "join" message
- **THEN** the system SHALL add the client to the specified room
- **AND** broadcast the updated member list to all room members

#### Scenario: SDP exchange relay

- **WHEN** a client sends an "offer" or "answer" message
- **THEN** the system SHALL relay the message to the specified target peer
- **AND** override the "from" field with the sender's bound identity

#### Scenario: ICE candidate relay

- **WHEN** a client sends a "candidate" message
- **THEN** the system SHALL relay the ICE candidate to the specified target peer

### Requirement: Multi-party Mesh Communication

The system SHALL support multi-party Mesh topology for group calls.

#### Scenario: Room capacity limit

- **WHEN** a room has 50 participants
- **AND** a new client attempts to join
- **THEN** the system SHALL reject with "room_full" error

#### Scenario: Maximum concurrent rooms

- **WHEN** the server has 1000 active rooms
- **AND** a new room creation is attempted
- **THEN** the system SHALL reject with "room_limit_reached" error

#### Scenario: Automatic room cleanup

- **WHEN** the last client leaves a room
- **THEN** the system SHALL delete the room from memory

### Requirement: Media Controls

The system SHALL support real-time media control during calls.

#### Scenario: Audio mute/unmute

- **WHEN** a user toggles mute
- **THEN** the audio track SHALL be enabled/disabled
- **AND** UI reflects the current state

#### Scenario: Camera on/off

- **WHEN** a user toggles camera
- **THEN** the video track SHALL be enabled/disabled
- **AND** UI reflects the current state

#### Scenario: Screen sharing

- **WHEN** a user starts screen share
- **THEN** the system SHALL use getDisplayMedia API
- **AND** replace or augment the video track

#### Scenario: Local recording

- **WHEN** a user starts recording
- **THEN** the system SHALL use MediaRecorder API
- **AND** produce downloadable WebM file on stop

### Requirement: DataChannel Chat

The system SHALL support peer-to-peer text messaging via WebRTC DataChannel.

#### Scenario: Send message

- **WHEN** a user sends a chat message
- **THEN** the message SHALL be transmitted via DataChannel
- **AND** displayed in the chat UI

#### Scenario: Receive message

- **WHEN** a peer sends a message via DataChannel
- **THEN** the message SHALL be displayed in the chat UI

### Requirement: Security

The system SHALL enforce security measures for signaling connections.

#### Scenario: Origin validation

- **WHEN** a WebSocket connection is initiated
- **THEN** the system SHALL validate the Origin header against WS_ALLOWED_ORIGINS
- **AND** reject with HTTP 403 if origin is not allowed

#### Scenario: Identity binding

- **WHEN** a client sends first "join" message
- **THEN** the system SHALL bind the client ID to the WebSocket connection
- **AND** reject subsequent attempts to change identity

#### Scenario: Message field override

- **WHEN** the server relays a message
- **THEN** the "from" field SHALL be overridden with the sender's bound ID
- **AND** the "room" field SHALL be overridden with the sender's bound room

---

## Non-Functional Requirements

| Requirement | Target |
|:------------|:-------|
| Message latency | < 50ms |
| Concurrent connections | 100+ |
| Concurrent rooms | 1000 |
| Clients per room | 50 |
| Browser support | Chrome 90+, Firefox 88+, Safari 14+ |

---

## User Roles

| Role | Capabilities |
|:-----|:-------------|
| **User** | Join room, start/stop calls, control media, chat, record |
| **Admin** | Deploy, configure TURN/ICE servers, set limits |
