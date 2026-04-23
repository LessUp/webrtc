# Frontend Specification

## Purpose

Vanilla JavaScript WebRTC client with modular architecture. No build tools, no frameworks — pure ES6+ modules served directly by the Go HTTP server.

---

## Architecture

### Technology Stack

| Component | Technology |
|:----------|:-----------|
| Language | JavaScript (ES6+) |
| Build | None (no bundler, no transpiler) |
| Styling | CSS3 with responsive design |
| Templating | HTML5 |

### Module Architecture

```
web/
├── index.html              # UI structure
├── src/
│   ├── core/
│   │   └── app.js          # Main entry point, initialization
│   ├── controllers/
│   │   ├── media.js        # Media stream handling
│   │   ├── peers.js        # PeerConnection management
│   │   ├── signaling.js    # WebSocket signaling
│   │   ├── stats.js        # Connection statistics
│   │   └── ui.js           # UI rendering
│   └── config.js           # Configuration and constants
├── styles.css              # Responsive styles
└── tests/                  # Vitest unit tests
```

---

## Requirements

### Requirement: Module Loading

The system SHALL use ES6 modules without build tools.

#### Scenario: Module imports

- **WHEN** index.html loads
- **THEN** scripts SHALL be loaded as ES6 modules
- **AND** no bundler or transpiler SHALL be required

### Requirement: Application Initialization

The system SHALL initialize the application on DOM ready.

#### Scenario: App startup

- **WHEN** DOM is ready
- **THEN** app.js SHALL initialize all controllers
- **AND** bind event handlers to UI elements
- **AND** generate unique client ID

### Requirement: Configuration Management

The system SHALL provide centralized configuration.

#### Scenario: RTC configuration

- **WHEN** app needs ICE servers
- **THEN** config.js SHALL provide default STUN servers
- **AND** merge with user-provided TURN config from RTC_CONFIG_JSON

#### Scenario: Client ID generation

- **WHEN** app initializes
- **THEN** config.js SHALL generate unique client ID
- **AND** store in state.myId

### Requirement: Media Controller

The system SHALL manage media streams via media.js controller.

#### Scenario: Get local media

- **WHEN** ensureLocalMedia() called
- **THEN** SHALL request camera/mic via getUserMedia
- **AND** store stream in state.localStream

#### Scenario: Toggle audio

- **WHEN** mute button clicked
- **THEN** audio track enabled state SHALL toggle
- **AND** UI SHALL reflect new state

#### Scenario: Toggle video

- **WHEN** camera button clicked
- **THEN** video track enabled state SHALL toggle
- **AND** UI SHALL reflect new state

#### Scenario: Screen share

- **WHEN** screen share button clicked
- **THEN** SHALL request display media via getDisplayMedia
- **AND** replace video track in peer connections

#### Scenario: Recording

- **WHEN** record button clicked
- **THEN** SHALL create MediaRecorder with local stream
- **AND** collect chunks into WebM file on stop

### Requirement: Peer Controller

The system SHALL manage RTCPeerConnections via peers.js controller.

#### Scenario: Create peer connection

- **WHEN** ensurePeer(peerId) called
- **THEN** SHALL create new RTCPeerConnection if not exists
- **AND** add local tracks to connection
- **AND** setup DataChannel for chat

#### Scenario: Handle offer

- **WHEN** offer received from signaling
- **THEN** SHALL set remote description
- **AND** create and send answer

#### Scenario: Handle answer

- **WHEN** answer received from signaling
- **THEN** SHALL set remote description

#### Scenario: Handle ICE candidate

- **WHEN** candidate received from signaling
- **THEN** SHALL add ICE candidate to peer connection

#### Scenario: Close peer

- **WHEN** closePeer(peerId) called
- **THEN** SHALL close RTCPeerConnection
- **AND** remove from state.peers map

### Requirement: Signaling Controller

The system SHALL manage WebSocket connection via signaling.js controller.

#### Scenario: Connect to server

- **WHEN** connectWS() called
- **THEN** SHALL create WebSocket connection to /ws
- **AND** setup message handlers

#### Scenario: Send join

- **WHEN** connection established
- **THEN** SHALL send join message with room ID and client ID

#### Scenario: Handle incoming message

- **WHEN** message received on WebSocket
- **THEN** SHALL dispatch to appropriate handler by type
- **AND** update state accordingly

### Requirement: UI Controller

The system SHALL manage DOM updates via ui.js controller.

#### Scenario: Render member list

- **WHEN** room_members message received
- **THEN** SHALL render member list with call buttons
- **AND** exclude self from list

#### Scenario: Create remote video tile

- **WHEN** new peer joins
- **THEN** SHALL create video element for peer
- **AND** attach peer's media stream

#### Scenario: Remove remote video tile

- **WHEN** peer leaves
- **THEN** SHALL remove video element from DOM

#### Scenario: Update control states

- **WHEN** media state changes
- **THEN** SHALL update button states (active/inactive)

---

## State Management

Global `state` object:

```javascript
state = {
    myId: string,              // Unique client ID
    ws: WebSocket | null,      // WebSocket connection
    roomId: string,            // Current room name
    roomState: string,         // 'idle' | 'connecting' | 'joined' | 'reconnecting' | 'calling'
    localStream: MediaStream,  // Local media
    screenStream: MediaStream, // Screen share stream
    usingScreen: boolean,      // Currently screen sharing
    muted: boolean,            // Audio muted
    cameraOff: boolean,        // Video disabled
    peers: Map<string, Peer>,  // Peer connections
    recorder: MediaRecorder,   // Active recorder
    recordedChunks: Blob[],    // Recording data
}
```

---

## Event Handling

| Event | Trigger | Action |
|:------|:--------|:-------|
| `join.click` | Room input filled | `connectWS()` |
| `call.click` | Peer selected | `startCall(peerId)` |
| `hangup.click` | Active call | `closePeer()` or `closeAllPeers()` |
| `mute.click` | Local stream | Toggle audio track |
| `camera.click` | Local stream | Toggle video track |
| `screen.click` | In room | Toggle screen share |

---

## Browser Support

| Browser | Minimum Version |
|:--------|:----------------|
| Chrome | 90+ |
| Firefox | 88+ |
| Safari | 14+ |
