---
layout: default
title: 信令协议 — WebRTC
description: WebSocket 信令协议规范和消息参考
---

[← 返回首页]({{ site.baseurl }}/) | [文档索引](README.zh-CN.md)

# 信令协议

本文档提供 WebRTC 项目使用的 WebSocket 信令协议的完整规范。

---

## 目录

- [概述](#概述)
- [消息格式](#消息格式)
- [消息类型](#消息类型)
- [Hub 架构](#hub-架构)
- [连接生命周期](#连接生命周期)
- [房间操作](#房间操作)
- [消息路由](#消息路由)
- [错误处理](#错误处理)
- [限制](#限制)
- [时序图](#时序图)

---

## 概述

WebRTC 处理点对点媒体和数据传输，但不定义对等端如何发现对方或交换连接信息。

在建立 WebRTC 连接之前，对等端必须交换：

| 信息 | 作用 |
|:-----|:-----|
| 房间成员 | 谁在房间里 |
| SDP（会话描述）| 媒体能力、编解码器 |
| ICE Candidates | 网络可达地址 |

**协议栈**：
- **传输**: WebSocket (ws:// 或 wss://)
- **格式**: JSON 消息
- **服务器**: Go Hub 房间管理
- **安全**: 来源验证、身份绑定

---

## 消息格式

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
    Code      string          `json:"code,omitempty"`
    Error     string          `json:"error,omitempty"`
}
```

### 字段说明

| 字段 | 类型 | 必需 | 说明 |
|:-----|:-----|:-----|:-----|
| `type` | string | 是 | 消息类型标识 |
| `room` | string | 上下文 | 房间名（房间操作必需）|
| `from` | string | 上下文 | 发送者客户端 ID（加入后服务器设置）|
| `to` | string | 否 | 目标客户端 ID（私信）|
| `sdp` | object | 上下文 | SDP offer/answer 对象 |
| `candidate` | object | 上下文 | ICE candidate 对象 |
| `members` | array | 上下文 | 房间成员 ID 列表 |
| `code` | string | 错误 | 错误码 |
| `error` | string | 错误 | 错误消息 |

---

## 消息类型

### 控制消息

#### `join` — 客户端 → 服务器

加入指定 ID 的房间。

```json
{
  "type": "join",
  "room": "my-room",
  "from": "alice"
}
```

**验证规则**：
- ID 长度: 1-64 字符
- 房间名长度: 1-64 字符
- ID 必须在房间内唯一
- 房间限制: 最多 1000 个
- 客户端限制: 每房间最多 50 个

#### `joined` — 服务器 → 客户端

成功加入房间的确认。

```json
{
  "type": "joined",
  "room": "my-room",
  "from": "alice"
}
```

#### `leave` — 客户端 → 服务器

离开当前房间。

```json
{
  "type": "leave",
  "room": "my-room",
  "from": "alice"
}
```

#### `room_members` — 服务器 → 客户端

房间成员变化时广播。

```json
{
  "type": "room_members",
  "room": "my-room",
  "members": ["alice", "bob", "charlie"]
}
```

### WebRTC 信令消息

#### `offer` — 客户端 ↔ 客户端

SDP offer，用于发起连接。

```json
{
  "type": "offer",
  "room": "my-room",
  "from": "alice",
  "to": "bob",
  "sdp": {
    "type": "offer",
    "sdp": "v=0\r\no=- 1234567890 2 IN IP4 127.0.0.1\r\n..."
  }
}
```

#### `answer` — 客户端 ↔ 客户端

SDP answer，响应 offer。

```json
{
  "type": "answer",
  "room": "my-room",
  "from": "bob",
  "to": "alice",
  "sdp": {
    "type": "answer",
    "sdp": "v=0\r\no=- 0987654321 2 IN IP4 127.0.0.1\r\n..."
  }
}
```

#### `candidate` — 客户端 ↔ 客户端

ICE candidate，用于 NAT 穿透。

```json
{
  "type": "candidate",
  "room": "my-room",
  "from": "alice",
  "to": "bob",
  "candidate": {
    "candidate": "candidate:1234567890 1 udp 2122260223 192.168.1.100 54321 typ host",
    "sdpMid": "0",
    "sdpMLineIndex": 0
  }
}
```

#### `hangup` — 客户端 ↔ 客户端

挂断信号。

```json
{
  "type": "hangup",
  "room": "my-room",
  "from": "alice",
  "to": "bob"
}
```

### 健康检查消息

#### `ping` / `pong` — 客户端 ↔ 服务器

心跳保活。

```json
{ "type": "ping" }
{ "type": "pong" }
```

### 错误消息

#### `error` — 服务器 → 客户端

协议错误响应。

```json
{
  "type": "error",
  "code": "duplicate_id",
  "error": "client id already exists in room"
}
```

---

## Hub 架构

### 数据结构

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

### 房间模型

```
rooms = {
  "room1": {
    "alice": *Client{ id: "alice", room: "room1", ... },
    "bob":   *Client{ id: "bob",   room: "room1", ... }
  },
  "room2": {
    "charlie": *Client{ id: "charlie", room: "room2", ... }
  }
}
```

---

## 连接生命周期

### WebSocket 处理器

```go
func (h *Hub) HandleWS(w http.ResponseWriter, r *http.Request) {
    // 1. HTTP 升级到 WebSocket
    conn, err := h.upg.Upgrade(w, r, nil)
    if err != nil {
        log.Printf("signal: ws upgrade failed: %v", err)
        return
    }

    // 2. 创建客户端
    client := &Client{
        connID: h.nextConnID.Add(1),
        conn:   conn,
        send:   make(chan Message, SendBufferSize),
        closed: make(chan struct{}),
    }
    h.registerClient(client)

    // 3. 启动写 goroutine
    go client.writePump()

    // 4. 读循环
    for {
        var msg Message
        if err := conn.ReadJSON(&msg); err != nil {
            break
        }
        h.handleMessage(client, msg)
    }

    // 5. 清理（严格顺序）
    h.removeClient(client)
    h.unregisterClient(client)
    client.close()
}
```

### 清理顺序

清理遵循严格顺序以避免竞态：

1. **`removeClient`** — 从房间移除，广播成员列表
2. **`unregisterClient`** — 从 Hub 的客户端集合移除
3. **`client.close()`** — 关闭 WebSocket 连接

---

## 房间操作

### 加入房间

```go
func (h *Hub) handleJoin(c *Client, msg Message) error {
    id := normalizeClientID(msg.From, MaxClientIDLength)
    room := normalizeRoomName(msg.Room, MaxRoomIDLength)

    // 验证...

    c.setIdentity(id, room)

    if err := h.addClient(c); err != nil {
        return err
    }

    // 发送确认
    c.enqueue(Message{Type: "joined", Room: room, From: id})

    // 广播成员列表
    h.broadcastMembers(room)
    return nil
}
```

### 离开房间

```go
func (h *Hub) removeClient(c *Client) {
    id, room := c.identity()
    if room == "" || id == "" {
        return
    }

    h.mu.Lock()
    defer h.mu.Unlock()

    if m, ok := h.rooms[room]; ok {
        delete(m, id)
        if len(m) == 0 {
            delete(h.rooms, room)
        } else {
            h.broadcastMembers(room)
        }
    }

    c.setRoom("")
}
```

---

## 消息路由

### 转发函数

```go
func (h *Hub) forward(sender *Client, msg Message) error {
    id, room := sender.identity()

    h.mu.RLock()
    m, ok := h.rooms[room]
    if !ok {
        h.mu.RUnlock()
        return errors.New("room missing")
    }

    dst, ok := m[msg.To]
    h.mu.RUnlock()

    if !ok {
        return errors.New("target not found")
    }

    // 服务器覆盖这些字段以确保安全
    msg.Room = room
    msg.From = id

    return dst.enqueue(msg)
}
```

### 安全说明

服务器**始终覆盖** `from` 和 `room` 字段以防止伪造：

```go
msg.Room = room  // 服务器记录的发送者房间
msg.From = id    // 服务器记录的发送者 ID
```

---

## 错误处理

### 协议错误码

| 错误码 | 说明 | HTTP 等效 |
|:-------|:-----|:----------|
| `invalid_id` | 客户端 ID 格式无效 | 400 |
| `invalid_room` | 房间名格式无效 | 400 |
| `identity_locked` | 连接已有身份 | 409 |
| `already_joined` | 已在其他房间 | 409 |
| `duplicate_id` | 房间内客户端 ID 已存在 | 409 |
| `room_full` | 房间达到最大客户端数 | 503 |
| `room_limit_reached` | 服务器达到最大房间数 | 503 |
| `not_joined` | 必须先加入房间 | 403 |
| `invalid_target` | 目标客户端 ID 无效 | 400 |
| `target_not_found` | 目标不在房间 | 404 |

### 错误响应格式

```json
{
  "type": "error",
  "code": "duplicate_id",
  "error": "client id already exists in room"
}
```

---

## 限制

| 常量 | 值 | 说明 |
|:-----|:---|:-----|
| `MaxRooms` | 1000 | 最大并发房间数 |
| `MaxClientsPerRoom` | 50 | 每房间最大客户端数 |
| `MaxRoomIDLength` | 64 | 房间名最大长度 |
| `MaxClientIDLength` | 64 | 客户端 ID 最大长度 |
| `SendBufferSize` | 64 | 每客户端消息缓冲区 |
| `SendTimeout` | 2s | 发送缓冲区超时 |
| `MaxMessageSize` | 1MB | 最大 WebSocket 消息大小 |

---

## 时序图

### 加入流程

```
客户端                  服务器                   房间成员
   │                      │                        │
   │──── join ───────────▶│                        │
   │                      │── addClient ──────────▶│
   │◀─── joined ──────────│                        │
   │                      │── room_members ───────▶│
   │                      │                        │
```

### 通话流程

```
客户端 A               服务器                  客户端 B
   │                      │                       │
   │──── offer ──────────▶│──── offer ───────────▶│
   │                      │                       │
   │◀─── answer ──────────│◀─── answer ──────────│
   │                      │                       │
   │◀─── candidate ───────│◀─── candidate ───────│
   │──── candidate ──────▶│──── candidate ──────▶│
   │                      │                       │
   │◀═════════════════════╪════ WebRTC P2P ══════▶│
```

### 多人加入

```
Alice                  服务器                  Bob                    Carol
  │                      │                       │                      │
  │──── join ───────────▶│                       │                      │
  │◀─── joined ──────────│                       │                      │
  │                      │                       │                      │
  │                      │◀──────────────────────│──── join ───────────▶│
  │                      │──── room_members ────▶│◀─── joined ──────────│
  │◀─────────────────────│──── room_members ────▶│──── room_members ───▶│
  │                      │                       │                      │
```

---

## 前端集成

### 连接示例

```javascript
function connectWS() {
    const proto = location.protocol === 'https:' ? 'wss://' : 'ws://';
    ws = new WebSocket(proto + location.host + '/ws');

    ws.onopen = () => {
        ws.send(JSON.stringify({
            type: 'join',
            room: roomId,
            from: myId
        }));
    };

    ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        handleMessage(msg);
    };
}
```

### 消息处理示例

```javascript
function handleMessage(msg) {
    switch (msg.type) {
        case 'joined':
            state.roomState = 'joined';
            break;
        case 'room_members':
            renderMembers(msg.members);
            break;
        case 'offer':
        case 'answer':
            applyDescription(msg.from, msg.sdp);
            break;
        case 'candidate':
            handleCandidate(msg.from, msg.candidate);
            break;
        case 'hangup':
            closePeer(msg.from);
            break;
        case 'error':
            setError(msg.error);
            break;
    }
}
```

---

## 相关文档

- [技术指南](guide.zh-CN.md) — 架构概览
- [API 参考](api.zh-CN.md) — 配置和使用
- [部署指南](deployment.zh-CN.md) — 生产部署
