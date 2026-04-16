---
layout: default
title: API 参考 — WebRTC
description: API 参考、配置选项和使用指南
---

[← 返回首页]({{ site.baseurl }}/) | [文档索引](README.zh-CN.md)

# API 参考

配置、端点和程序化使用的完整参考。

---

## 目录

- [配置说明](#配置说明)
- [环境变量](#环境变量)
- [HTTP 端点](#http-端点)
- [WebSocket 协议](#websocket-协议)
- [JavaScript API](#javascript-api)
- [限制与性能](#限制与性能)

---

## 配置说明

### 服务器配置

通过环境变量提供配置：

```bash
# 基础配置
export ADDR=:8080
export WS_ALLOWED_ORIGINS=localhost,yourdomain.com
export RTC_CONFIG_JSON='{"iceServers":[{"urls":"stun:stun.l.google.com:19302"}]}'
```

### ICE/TURN 配置

`RTC_CONFIG_JSON` 变量接受符合 [RTCIceServer](https://developer.mozilla.org/en-US/docs/Web/API/RTCIceServer) 格式的 JSON 对象：

```json
{
  "iceServers": [
    {
      "urls": ["stun:stun.l.google.com:19302"]
    },
    {
      "urls": ["turn:turn.example.com:3478"],
      "username": "user",
      "credential": "pass"
    }
  ],
  "iceTransportPolicy": "all",
  "bundlePolicy": "balanced"
}
```

---

## 环境变量

| 变量 | 类型 | 默认值 | 说明 |
|:-----|:-----|:-------|:-----|
| `ADDR` | string | `:8080` | HTTP 服务器监听地址 |
| `WS_ALLOWED_ORIGINS` | string | `*` | 逗号分隔的允许来源。`*` 表示允许所有 |
| `RTC_CONFIG_JSON` | JSON | 公共 STUN | ICE/TURN 服务器配置 |

### ADDR

指定 HTTP 服务器的网络地址。

```bash
# IPv4 所有接口
ADDR=0.0.0.0:8080

# IPv6
ADDR=[::]:8080

# Unix 套接字（高级）
ADDR=unix:/var/run/webrtc.sock
```

### WS_ALLOWED_ORIGINS

控制 WebSocket 来源验证。

```bash
# 单来源
WS_ALLOWED_ORIGINS=example.com

# 多来源
WS_ALLOWED_ORIGINS=localhost,example.com,app.example.com

# 允许所有（仅开发环境）
WS_ALLOWED_ORIGINS=*
```

### RTC_CONFIG_JSON

配置 WebRTC ICE/TURN 服务器。

```bash
# 仅公共 STUN（默认）
export RTC_CONFIG_JSON='{"iceServers":[{"urls":"stun:stun.l.google.com:19302"}]}'

# 带 TURN 服务器
export RTC_CONFIG_JSON='{
  "iceServers": [
    {"urls": "stun:stun.l.google.com:19302"},
    {
      "urls": "turn:turn.example.com:3478",
      "username": "webrtc",
      "credential": "secret"
    }
  ]
}'
```

---

## HTTP 端点

### 静态文件

| 方法 | 路径 | 说明 |
|:-----|:-----|:-----|
| `GET` | `/` | 主应用 (index.html) |
| `GET` | `/styles.css` | 样式表 |
| `GET` | `/app.js` | 主 JavaScript 包 |
| `GET` | `/app.*.js` | 模块化 JavaScript 文件 |

### API 端点

| 方法 | 路径 | 说明 |
|:-----|:-----|:-----|
| `GET` | `/healthz` | 健康检查端点 |
| `GET` | `/ws` | WebSocket 升级端点 |

### 健康检查

```bash
curl http://localhost:8080/healthz
```

**响应**: `ok` (HTTP 200)

用于负载均衡器和监控系统。

### WebSocket

```javascript
const ws = new WebSocket('ws://localhost:8080/ws');
```

消息格式请参阅 [信令协议](signaling.zh-CN.md)。

---

## WebSocket 协议

### 连接

```javascript
const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);

ws.onopen = () => {
  // 连接已建立
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  // 处理消息
};

ws.onclose = () => {
  // 连接已关闭
};

ws.onerror = (error) => {
  // 处理错误
};
```

### 消息类型

完整的消息规范请参阅 [信令协议](signaling.zh-CN.md)。

**控制消息**：
- `join` / `joined` — 房间成员资格
- `leave` — 离开房间
- `room_members` — 成员列表广播
- `ping` / `pong` — 心跳保活

**WebRTC 消息**：
- `offer` — SDP offer
- `answer` — SDP answer
- `candidate` — ICE candidate
- `hangup` — 结束通话

**错误消息**：
- `error` — 带错误码的协议错误

---

## JavaScript API

### 全局状态

前端暴露全局 `state` 对象：

```javascript
// 只读检查
console.log(state.myId);        // 你的客户端 ID
console.log(state.roomId);      // 当前房间
console.log(state.roomState);   // 'idle' | 'connecting' | 'joined' | 'calling'
console.log(state.peers);       // PeerConnection Map
```

### 函数

#### 连接

```javascript
// 加入房间
connect(roomId, myId);

// 离开当前房间
disconnect();
```

#### 通话

```javascript
// 呼叫对等端
callPeer(peerId);

// 挂断对等端
hangupPeer(peerId);

// 挂断所有
hangupAll();
```

#### 媒体控制

```javascript
// 切换静音
toggleMute();

// 切换摄像头
toggleCamera();

// 开始屏幕共享
startScreenShare();

// 停止屏幕共享
stopScreenShare();
```

#### 录制

```javascript
// 开始录制
startRecording();

// 停止录制（触发下载）
stopRecording();
```

#### 聊天

```javascript
// 发送聊天消息给所有已连接对等端
sendChat(text);
```

### 事件

挂接到应用事件：

```javascript
// 监听状态变化（示例模式）
const originalSetState = setRoomState;
setRoomState = function(newState) {
  console.log('状态变化:', newState);
  originalSetState(newState);
};
```

---

## 限制与性能

### 服务器限制

| 限制 | 值 | 可配置 |
|:-----|:---|:-------|
| 最大房间数 | 1000 | 否 |
| 每房间最大客户端 | 50 | 否 |
| 房间 ID 最大长度 | 64 字符 | 否 |
| 客户端 ID 最大长度 | 64 字符 | 否 |
| 消息缓冲区大小 | 64 | 否 |
| 发送超时 | 2 秒 | 否 |
| 最大消息大小 | 1 MB | 否 |

### 性能特征

| 指标 | 预期值 |
|:-----|:-------|
| 连接建立 | < 100ms（本地）|
| 消息转发延迟 | < 10ms（同数据中心）|
| 并发房间数 | 1000 |
| 总并发客户端 | 50,000 (1000 × 50) |
| 每客户端内存 | ~50 KB |
| CPU 使用（空闲）| 最小 |
| CPU 使用（活跃）| 低（主要是 I/O）|

### 浏览器限制

| 浏览器 | 最大并发对等端 | 说明 |
|:-------|:---------------|:-----|
| Chrome | ~50 | 硬件相关 |
| Firefox | ~50 | 硬件相关 |
| Safari | ~20 | 更保守 |

**建议**：对于超过 10 人的房间，考虑使用 SFU 架构替代 Mesh。

---

## 错误码

协议错误码请参阅 [信令协议](signaling.zh-CN.md#错误处理)。

### HTTP 状态码

| 状态 | 含义 |
|:-----|:-----|
| 200 | 成功 |
| 400 | 错误请求（WebSocket）|
| 403 | 禁止访问（来源不允许）|
| 426 | 需要升级（需要 WebSocket）|
| 500 | 服务器内部错误 |

---

## TypeScript 定义

TypeScript 项目使用：

```typescript
// types/webrtc.d.ts

interface Message {
  type: string;
  room?: string;
  from?: string;
  to?: string;
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
  members?: string[];
  code?: string;
  error?: string;
}

interface Peer {
  id: string;
  pc: RTCPeerConnection;
  polite: boolean;
  makingOffer: boolean;
  ignoreOffer: boolean;
  pendingCandidates: RTCIceCandidateInit[];
  dc?: RTCDataChannel;
}

interface AppState {
  myId: string;
  ws: WebSocket | null;
  roomId: string;
  roomState: 'idle' | 'connecting' | 'joined' | 'reconnecting' | 'calling';
  localStream: MediaStream | null;
  screenStream: MediaStream | null;
  usingScreen: boolean;
  muted: boolean;
  cameraOff: boolean;
  peers: Map<string, Peer>;
  recorder: MediaRecorder | null;
  recordedChunks: Blob[];
}
```

---

## 相关文档

- [信令协议](signaling.zh-CN.md) — 完整协议规范
- [技术指南](guide.zh-CN.md) — 架构和实现
- [部署指南](deployment.zh-CN.md) — 生产部署
