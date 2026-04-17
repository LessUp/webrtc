# RFC-0002: Frontend Architecture

| Metadata | Value |
|:---------|:------|
| **Status** | Accepted |
| **Created** | 2025-02-13 |
| **Updated** | 2026-04-17 |
| **Author** | LessUp Team |
| **Category** | Architecture |

## Context

The frontend is a vanilla JavaScript WebRTC client with modular architecture. No build tools, no frameworks — just pure ES6+ modules served directly by the Go HTTP server.

## Decision

### Technology Stack

- **Language**: JavaScript (ES6+)
- **Build**: None (no bundler, no transpiler)
- **Styling**: CSS3 with responsive design
- **Templating**: HTML5

### Module Architecture

```
web/
├── index.html              # UI structure
├── app.js                  # Main entry point, initialization
├── app.config.js           # Configuration and capability detection
├── app.media.js            # Media stream handling
├── app.peers.js            # PeerConnection management
├── app.signaling.js        # WebSocket signaling
├── app.ui.js               # UI rendering
├── app.stats.js            # Connection statistics
└── styles.css              # Responsive styles
```

### Module Responsibilities

#### app.config.js

Configuration and capability detection.

**Exports**:
- `DEFAULT_RTC_CONFIG` — Default ICE server configuration
- `ROOM_STATE_TEXT` — State display text mapping
- `RECONNECT_DELAYS_MS` — Reconnection backoff delays
- `createClientId()` — Generate unique client ID
- `getCapabilities()` — Browser capability detection
- `getRtcConfig()` — Merge user/default ICE config

#### app.media.js

Media stream handling.

**Exports**:
- `ensureLocalMedia()` — Get camera/mic stream (getUserMedia)
- `currentVideoTrack()` — Get active video track
- `syncPeerMedia()` — Update peer connection tracks
- `startScreenShare()` — Begin screen capture (getDisplayMedia)
- `stopScreenShare()` — End screen capture
- `startRecording()` — Begin MediaRecorder
- `stopRecording()` — End recording, trigger download

#### app.peers.js

PeerConnection management for Mesh topology.

**Exports**:
- `ensurePeer(peerId)` — Create/get peer connection
- `applyDescription(peerId, sdp)` — Handle SDP offer/answer
- `handleCandidate(peerId, candidate)` — Handle ICE candidate
- `startCall(peerId)` — Initiate call to peer
- `closePeer(peerId)` — End single connection
- `closeAllPeers()` — End all connections
- `sendChat()` — Send DataChannel message

#### app.signaling.js

WebSocket signaling connection.

**Exports**:
- `connectWS()` — Establish WebSocket connection
- `leaveRoom()` — Clean exit from room

#### app.ui.js

UI rendering and state management.

**Exports**:
- `getElements()` — DOM element cache
- `createUI()` — UI controller factory
  - `setError(msg)` — Display error message
  - `setRoomState(state)` — Update room state display
  - `renderMembers(list)` — Render member list
  - `ensureRemoteTile(peerId)` — Create video tile for peer
  - `removeRemoteTile(peerId)` — Remove peer video tile
  - `updateControls()` — Update button states

#### app.stats.js

Connection statistics monitoring.

**Exports**:
- `createStatsController(state)` — Factory
  - `start()` — Begin stats polling
  - `stop()` — End stats polling

### State Management

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

### Event Handling

| Event | Trigger | Action |
|:------|:--------|:-------|
| `join.click` | Room input filled | `connectWS()` |
| `call.click` | Peer selected | `startCall(peerId)` |
| `hangup.click` | Active call | `closePeer()` or `closeAllPeers()` |
| `mute.click` | Local stream | Toggle audio track |
| `camera.click` | Local stream | Toggle video track |
| `screen.click` | In room | Toggle screen share |

### Consequences

**Positive**:
- Zero dependencies, instant load
- Easy to understand and modify
- No build step required
- Clear module boundaries

**Trade-offs**:
- No TypeScript type safety (mitigated by TypeScript definitions in API docs)
- Manual DOM manipulation (acceptable for this scale)
- No component reuse library

## Related Documents

- [RFC-0001: Signaling Server](0001-signaling-server.md)
- [Product Specification](../product/webrtc-platform.md)
- [API Specification](../api/signaling.yaml)
