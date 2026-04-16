---
layout: default
title: 技术指南 — WebRTC
description: 架构设计、前端实现、媒体控制、DataChannel 和录制功能
---

[← 返回首页]({{ site.baseurl }}/) | [文档索引](README.zh-CN.md)

# 技术指南

本文档详细介绍 WebRTC 演示项目的架构、信令流程和实现细节。

---

## 目录

- [快速开始](#快速开始)
- [架构概览](#架构概览)
- [信令服务器](#信令服务器)
- [前端状态机](#前端状态机)
- [媒体处理](#媒体处理)
- [PeerConnection 管理](#peerconnection-管理)
- [DataChannel 聊天](#datachannel-聊天)
- [本地录制](#本地录制)
- [连接统计](#连接统计)

---

## 快速开始

### 环境要求

- Go 1.22+
- Chrome / Edge / Firefox 最新版
- Docker（可选，用于部署）

### 本地开发

```bash
# 克隆仓库
git clone https://github.com/LessUp/webrtc.git
cd webrtc

# 安装依赖
go mod tidy

# 运行服务器
go run ./cmd/server

# 打开浏览器
open http://localhost:8080
```

### 测试流程

1. 打开两个浏览器标签页，访问 `http://localhost:8080`
2. 在两个标签页中输入相同的**房间名**
3. 在两个标签页中点击 **Join**
4. 点击成员列表中的对方 ID
5. 点击 **Call** 发起连接
6. 授予摄像头/麦克风权限
7. 开始 WebRTC 通话！

---

## 架构概览

### 模块结构

```
webrtc/
├── cmd/server/          # HTTP + WebSocket 入口
├── internal/signal/     # 信令逻辑
│   ├── hub.go           # 房间管理、消息转发
│   ├── hub_test.go      # 单元测试
│   └── message.go       # 消息类型
└── web/                 # 前端（原生 JS）
    ├── index.html       # UI
    ├── app.js           # 主入口
    ├── app.config.js    # 配置、能力检测
    ├── app.media.js     # 媒体处理
    ├── app.peers.js     # PeerConnection 管理
    ├── app.signaling.js # WebSocket 信令
    ├── app.stats.js     # 连接统计
    ├── app.ui.js        # UI 渲染
    └── styles.css       # 响应式样式
```

### 高级交互图

```
┌─────────────────────────────────────────────────────┐
│  浏览器 A                                            │
│  ┌──────────┐    ┌──────────┐    ┌────────────────┐ │
│  │  HTML UI  │──→│  app.js  │──→│  getUserMedia   │ │
│  └──────────┘    └────┬─────┘    └──────┬─────────┘ │
└───────────────────────┼─────────────────┼───────────┘
                        │ WebSocket       │ WebRTC P2P
                 ┌──────▼──────┐          │
                 │  Go 信令服务  │          │
                 │ ┌──────────┐│          │
                 │ │Signal Hub││          │
                 │ │ 房间管理   ││          │
                 │ └──────────┘│          │
                 └──────┬──────┘          │
                        │ WebSocket       │
┌───────────────────────┼─────────────────┼───────────┐
│  浏览器 B             │                 │           │
│  ┌──────────┐    ┌────▼─────┐    ┌──────▼─────────┐│
│  │  HTML UI  │──→│  app.js  │──→│  getUserMedia   ││
│  └──────────┘    └──────────┘    └────────────────┘│
└─────────────────────────────────────────────────────┘
```

### 数据流

| 流向 | 路径 | 协议 | 说明 |
|:-----|:-----|:-----|:-----|
| **信令流** | 浏览器 ↔ 服务器 | WebSocket | Offer/Answer/ICE 转发 |
| **媒体流** | 浏览器 ↔ 浏览器 | WebRTC (SRTP) | 音视频流 |
| **数据通道** | 浏览器 ↔ 浏览器 | WebRTC (SCTP) | 文本聊天 |

---

## 信令服务器

### 消息结构

```go
type Message struct {
    Type      string          `json:"type"`
    Room      string          `json:"room"`
    From      string          `json:"from"`
    To        string          `json:"to,omitempty"`
    SDP       json.RawMessage `json:"sdp,omitempty"`
    Candidate json.RawMessage `json:"candidate,omitempty"`
    Members   []string        `json:"members,omitempty"`
}
```

### 消息类型

| 类型 | 方向 | 说明 |
|:-----|:-----|:-----|
| `join` | 客户端 → 服务器 | 加入房间请求 |
| `joined` | 服务器 → 客户端 | 加入确认 |
| `leave` | 客户端 → 服务器 | 离开房间请求 |
| `offer` | 客户端 ↔ 客户端 | SDP offer |
| `answer` | 客户端 ↔ 客户端 | SDP answer |
| `candidate` | 客户端 ↔ 客户端 | ICE candidate |
| `hangup` | 客户端 ↔ 客户端 | 挂断通话 |
| `room_members` | 服务器 → 客户端 | 成员列表广播 |
| `error` | 服务器 → 客户端 | 协议错误 |
| `ping/pong` | 客户端 ↔ 服务器 | 心跳保活 |

### Hub 数据结构

```go
type Hub struct {
    mu               sync.RWMutex
    rooms            map[string]map[string]*Client  // room → id → Client
    clients          map[*Client]struct{}
    allowedOrigins   []string
    allowAllOrigins  bool
}

type Client struct {
    id        string
    room      string
    connID    uint64
    conn      *websocket.Conn
    send      chan Message
    closed    chan struct{}
}
```

### 信令流程（一对一）

```
浏览器 A              Signal Hub              浏览器 B
    │                      │                       │
    │──── join ────────────▶                       │
    │◀─── joined ───────────                       │
    │                      │                       │
    │                      │◀──── join ────────────│
    │                      │──── joined ──────────▶│
    │◀─────────────────────│─── room_members ─────▶│
    │                      │                       │
    │──── offer (to: B) ───▶──── offer ───────────▶│
    │◀─── answer ───────────◀──── answer (to: A) ──│
    │◀─── candidate ────────◀──── candidate ───────│
    │──── candidate ────────▶──── candidate ──────▶│
    │                      │                       │
    │◀═════════════════════╪═════ WebRTC P2P ═════▶│
```

详细的协议规范请参阅 [信令协议](signaling.zh-CN.md)。

---

## 前端状态机

### 状态定义

| 状态 | 说明 |
|:-----|:-----|
| `idle` | 未连接到任何房间 |
| `connecting` | WebSocket 连接中 |
| `joined` | 已加入房间，可以发起通话 |
| `reconnecting` | WebSocket 重连中 |
| `calling` | 活跃的 PeerConnection |

### 状态转换

```
idle ──[连接]──▶ connecting ──[加入成功]──▶ joined
  ▲                                                  │
  │                                       [发起通话]
  │                                                  ▼
  └──[断开连接]── reconnecting ◀──[断开连接]── calling
```

### 核心状态变量

```javascript
const state = {
  myId: string,           // 本地客户端 ID
  ws: WebSocket,          // WebSocket 连接
  roomId: string,         // 当前房间
  roomState: 'idle',      // 连接状态
  localStream: MediaStream,
  screenStream: MediaStream,
  usingScreen: boolean,
  muted: boolean,
  cameraOff: boolean,
  peers: Map<string, Peer>  // peerId → Peer
};
```

---

## 媒体处理

### 获取本地媒体

```javascript
async function ensureLocalMedia() {
  if (state.localStream) return state.localStream;

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: true
  });

  state.localStream = stream;
  localVideo.srcObject = stream;
  return stream;
}
```

### 静音 / 摄像头开关

```javascript
// 静音/取消静音
function toggleMute() {
  state.muted = !state.muted;
  state.localStream.getAudioTracks().forEach(track => {
    track.enabled = !state.muted;
  });
}

// 摄像头开关
function toggleCamera() {
  state.cameraOff = !state.cameraOff;
  state.localStream.getVideoTracks().forEach(track => {
    track.enabled = !state.cameraOff;
  });
}
```

### 屏幕共享

```javascript
async function startScreenShare() {
  const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
  state.screenStream = stream;
  state.usingScreen = true;

  // 替换所有 PeerConnection 中的视频轨道
  const videoTrack = stream.getVideoTracks()[0];
  for (const peer of state.peers.values()) {
    const sender = peer.pc.getSenders().find(s => s.track?.kind === 'video');
    if (sender) await sender.replaceTrack(videoTrack);
  }

  videoTrack.onended = () => stopScreenShare();
}
```

---

## PeerConnection 管理

### 创建 Peer

```javascript
function ensurePeer(peerId) {
  if (state.peers.has(peerId)) return state.peers.get(peerId);

  const pc = new RTCPeerConnection(rtcConfig);
  const peer = {
    id: peerId,
    pc: pc,
    polite: state.myId.localeCompare(peerId) > 0,
    makingOffer: false,
    ignoreOffer: false,
    pendingCandidates: []
  };

  pc.onicecandidate = e => {
    if (e.candidate) {
      sendSignal({ type: 'candidate', to: peerId, candidate: e.candidate });
    }
  };

  pc.ontrack = e => {
    const video = ensureRemoteTile(peerId);
    video.srcObject = e.streams[0];
  };

  state.peers.set(peerId, peer);
  return peer;
}
```

### 完美协商

项目实现了"完美协商"模式来处理同时发起 offer 的冲突：

```javascript
async function applyDescription(peerId, description) {
  const peer = ensurePeer(peerId);
  const pc = peer.pc;

  // 冲突检测
  const offerCollision = description.type === 'offer' &&
    (peer.makingOffer || pc.signalingState !== 'stable');

  peer.ignoreOffer = !peer.polite && offerCollision;
  if (peer.ignoreOffer) return;

  await pc.setRemoteDescription(description);

  if (description.type === 'offer') {
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    sendSignal({ type: 'answer', to: peerId, sdp: pc.localDescription });
  }

  // 处理待处理的 candidates
  while (peer.pendingCandidates.length) {
    await pc.addIceCandidate(peer.pendingCandidates.shift());
  }
}
```

**礼貌对等端规则**：字典序较大的对等端 ID 是"礼貌"的，在冲突时会让步。

---

## DataChannel 聊天

### 设置

```javascript
function setupDataChannel(peer, channel) {
  peer.dc = channel;

  channel.onopen = () => {
    appendChat(`[系统] 聊天频道已开启: ${peer.id}`);
  };

  channel.onmessage = e => {
    appendChat(`${peer.id}: ${e.data}`);
  };

  channel.onclose = () => {
    appendChat(`[系统] 聊天频道已关闭: ${peer.id}`);
  };
}
```

### 发送消息

```javascript
function sendChat() {
  const text = chatInput.value.trim();
  if (!text) return;

  const channels = [];
  for (const peer of state.peers.values()) {
    if (peer.dc?.readyState === 'open') {
      channels.push(peer.dc);
    }
  }

  if (!channels.length) {
    setError('没有可用的聊天频道');
    return;
  }

  channels.forEach(dc => dc.send(text));
  appendChat(`我: ${text}`);
  chatInput.value = '';
}
```

---

## 本地录制

### 开始录制

```javascript
function startRecording() {
  const stream = getRecordStream(); // 远程 > 屏幕 > 本地
  if (!stream) return;

  state.recordedChunks = [];
  state.recorder = new MediaRecorder(stream);

  state.recorder.ondataavailable = e => {
    if (e.data?.size > 0) state.recordedChunks.push(e.data);
  };

  state.recorder.onstop = () => {
    const blob = new Blob(state.recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `webrtc-录制-${Date.now()}.webm`;
    a.click();
    URL.revokeObjectURL(url);
  };

  state.recorder.start();
}
```

---

## 连接统计

统计控制器每 2 秒轮询一次 `RTCPeerConnection.getStats()`：

| 指标 | 说明 |
|:-----|:-----|
| 视频码率 | 发送视频码率（kbps）|
| 分辨率 | 发送视频分辨率 |
| 音频丢包 | 接收音频丢包率（%）|
| RTT | 往返时延（ms）|
| 编解码器 | 视频编解码器名称（VP8/VP9/H.264）|

---

## 阅读指南

推荐阅读顺序：

1. **本文档** — 概览和架构
2. **[信令协议](signaling.zh-CN.md)** — 信令协议详解
3. **[API 参考](api.zh-CN.md)** — 配置和限制
4. **源代码** — 配合文档阅读：
   - `internal/signal/hub.go` — 后端信令
   - `web/app.*.js` — 前端模块

---

## 相关文档

- [部署指南](deployment.zh-CN.md) — 生产部署
- [故障排查](troubleshooting.zh-CN.md) — 常见问题
- [贡献指南](../CONTRIBUTING.md) — 开发工作流
