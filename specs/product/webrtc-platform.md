# WebRTC Platform - Product Specification

## Overview

A production-ready WebRTC learning platform demonstrating real-time audio/video communication with progressive complexity from basic peer-to-peer calls to advanced multi-party Mesh architecture.

## Core Features

### 1. WebSocket Signaling
- Room-based peer discovery and management
- SDP offer/answer exchange via server relay
- ICE candidate relay
- Heartbeat mechanism (ping/pong)

### 2. Multi-party Mesh Communication
- Up to 50 participants per room
- Up to 1000 concurrent rooms
- Automatic peer connection management
- Grid video layout for multiple participants

### 3. Media Controls
- Mute/unmute audio
- Camera toggle on/off
- Screen sharing (getDisplayMedia)
- Local video recording with MediaRecorder (WebM export)

### 4. DataChannel Chat
- Peer-to-peer text messaging without server relay
- Real-time message delivery

### 5. Security
- Origin validation (WS_ALLOWED_ORIGINS)
- Identity binding (one ID per WebSocket)
- Resource limits enforcement

## User Roles

| Role | Capabilities |
|:-----|:-------------|
| **User** | Join room, start/stop calls, control media, chat, record |
| **Admin** | Deploy, configure TURN/ICE servers, set limits |

## Acceptance Criteria

### Room Management
- [x] User can join a room with unique ID
- [x] Room member list updates on join/leave
- [x] Room auto-deleted when empty
- [x] Max 50 clients per room enforced
- [x] Max 1000 concurrent rooms enforced

### Call Establishment
- [x] Users can initiate 1-on-1 calls
- [x] Users can join multi-party Mesh calls
- [x] SDP exchange completes successfully
- [x] ICE candidates relayed correctly
- [x] Media streams established

### Media Controls
- [x] Mute/unmute toggles audio track
- [x] Camera on/off toggles video track
- [x] Screen share replaces/augments video
- [x] Recording produces downloadable WebM file

### DataChannel
- [x] Text messages sent peer-to-peer
- [x] Messages displayed in chat UI

### Security
- [x] Invalid origin rejected (HTTP 403)
- [x] Duplicate client ID rejected
- [x] Room/client limits enforced

## State Machine

```
idle ──[connect]──▶ connecting ──[join]──▶ joined
  ▲                                           │
  │                                    [call start]
  │                                           ▼
  └──[disconnect]── reconnecting ◀──[disconnect]── calling
```

## Non-Functional Requirements

| Requirement | Target |
|:------------|:-------|
| Message latency | < 50ms |
| Concurrent connections | 100+ |
| Concurrent rooms | 1000 |
| Clients per room | 50 |
| Browser support | Chrome 90+, Firefox 88+, Safari 14+ |
