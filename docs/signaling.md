# 信令与房间管理详解（signaling.md）

本篇文档专门深入讲解本 WebRTC Demo 中的**信令与房间管理**实现，帮助你从源码层面理解：

- WebSocket 连接是如何建立和管理的；
- 信令消息的结构和类型；
- Hub/Client 如何管理房间与成员；
- 一对一通话时 offer/answer/candidate 是如何转发的；
- 房间成员列表是如何广播给前端的。

> 对照阅读建议：
> - 后端：`internal/signal/hub.go`、`internal/signal/message.go`
> - 前端：`web/app.js` 中的 WebSocket 部分

---

## 1. 信令在 WebRTC 中的作用

WebRTC 负责**媒体和数据通道的端到端传输**，但它本身并不定义“如何把两个浏览器配对起来”。

在浏览器建立 WebRTC 连接之前，需要交换一些“信令”信息：

- 谁在什么房间（`join/leave`）；
- 双方的 SDP（`offer/answer`）；
- ICE 候选（`candidate`）；
- 其它辅助信息（比如房间成员列表 `room_members`）。

本项目选择：

- 使用 **WebSocket** 作为信令通道；
- 由 Go 后端维护一个简单的 **Hub**，负责房间与成员管理、消息转发和广播；
- 前端只需按约定的 JSON 格式发送/接收消息即可。

---

## 2. 消息结构：`Message`

文件：`internal/signal/message.go`

```go
package signal

import "encoding/json"

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

字段含义：

- `Type`：消息类型（字符串），例如：
  - `"join"`：加入房间请求（从前端发给服务端）；
  - `"leave"`：离开房间请求（当前 Demo 中暂时很少手动用到）；
  - `"offer"` / `"answer"`：SDP 交换；
  - `"candidate"`：ICE 候选；
  - `"room_members"`：服务端广播的当前房间成员列表（从服务端发给前端）。
- `Room`：房间名，字符串。
- `From`：发送方 ID（前端生成的 `myId`）。
- `To`：接收方 ID，仅点对点消息（`offer/answer/candidate`）需要。
- `SDP`：SDP 内容，使用 `json.RawMessage` 承载浏览器产生的原始 SDP 对象。
- `Candidate`：ICE 候选，同样用 `json.RawMessage` 存储浏览器给出的对象。
- `Members`：当 `Type == "room_members"` 时，表示当前房间内的成员 ID 列表。

这种设计的特点：

- 一个 `Message` 结构可以覆盖所有信令类型，结构简单；
- 使用 `json.RawMessage` 避免在 Go 中深度解析 SDP/ICE，只做**透明转发**。

---

## 3. Hub 与 Client：房间数据结构

文件：`internal/signal/hub.go`

```go
type Hub struct {
    mu    sync.RWMutex
    rooms map[string]map[string]*Client
    upg   websocket.Upgrader

	allowedOrigins  []string
	allowAllOrigins bool
}

type Client struct {
    id   string
    room string
    conn *websocket.Conn
    send chan Message
}
```

### 3.1 Hub 的职责

- 维护一个 `rooms` 哈希表：

  ```go
  rooms: map[roomName]map[clientID]*Client
  ```

- 按房间组织客户端：
  - `rooms["room1"]["userA"] = *Client`
  - `rooms["room1"]["userB"] = *Client`
- 处理下列操作：
  - WebSocket 连接升级与关闭；
  - 收到 `join/leave/offer/answer/candidate` 消息并处理；
  - 对 `offer/answer/candidate` 按 `Room + To` 进行转发；
  - 在房间成员变化时，广播 `room_members` 消息。

### 3.2 Client 的职责

- 记录单个 WebSocket 连接的上下文：
  - 自己的 ID：`id`
  - 所在的房间名：`room`
  - WebSocket 连接对象：`conn`
  - 用于发送消息的缓冲通道：`send chan Message`

- Hub 通过 `send` 通道异步写消息，`writePump` 协程负责从通道取出消息并写入实际的 WebSocket：

  ```go
  func (h *Hub) writePump(c *Client) {
      for msg := range c.send {
          if err := c.conn.WriteJSON(msg); err != nil {
              c.conn.Close()
              break
          }
      }
  }
  ```

这种“读写分离 + 通道”的做法：

- 读循环在 `HandleWS`；
- 写循环在 `writePump`；
- Hub 自己只操作 `send` 通道，不直接调用 `WriteJSON`，有利于避免并发写 WebSocket 的问题。

---

## 4. WebSocket 连接生命周期：`HandleWS`

核心函数：

```go
func (h *Hub) HandleWS(w http.ResponseWriter, r *http.Request) {
    c, err := h.upg.Upgrade(w, r, nil)
    if err != nil {
        log.Printf("signal: ws upgrade failed from %s path=%s: %v", r.RemoteAddr, r.URL.Path, err)
        return
    }
    log.Printf("signal: ws connected from %s", r.RemoteAddr)
    client := &Client{conn: c, send: make(chan Message, 32)}
    go h.writePump(client)
    defer func() {
        h.removeClient(client)
        close(client.send)
        c.Close()
    }()
    for {
        var msg Message
        if err := c.ReadJSON(&msg); err != nil {
            log.Printf("signal: read message error room=%s id=%s: %v", client.room, client.id, err)
            break
        }
        switch msg.Type {
        case "join":
            client.id = msg.From
            client.room = msg.Room
            h.addClient(client)
        case "leave":
            h.removeClient(client)
        case "offer", "answer", "candidate":
            h.forward(msg)
        default:
            log.Printf("signal: unknown msg type=%s room=%s from=%s", msg.Type, msg.Room, msg.From)
        }
    }
}
```

### 4.1 升级与注册

1. 使用 `Upgrader` 将 HTTP 请求升级为 WebSocket：
   - 失败时记录日志并返回；
   - 成功时打印“ws connected from ...”。
2. 为该连接创建一个 `Client`，带一个缓冲大小为 32 的 `send` 通道。
3. 启动 `writePump` 协程，负责异步写消息。
4. 使用 `defer` 确保函数结束时：
   - 调用 `removeClient` 移除客户端；
   - 关闭 `send` 通道，结束 `writePump` 写协程；
   - 关闭连接 `c.Close()`。

### 4.2 消息读取与分发

- 在 `for` 循环中，通过 `c.ReadJSON(&msg)` 从 WebSocket 读取 JSON 并反序列化为 `Message`。
- 根据 `msg.Type`：
  - `join`：设置 `client.id`/`client.room`，并调用 `addClient`；
  - `leave`：调用 `removeClient`；
  - `offer/answer/candidate`：调用 `forward(msg)`，根据房间和 `To` 转发；
  - 其他：打印未知类型日志。

当 `ReadJSON` 返回错误（连接关闭/协议错误等）：

- 打印日志，包含当前 `room` 和 `id`；
- `break` 异常循环，触发 `defer` 的清理逻辑。

---

## 5. 房间管理：`addClient` 与 `removeClient`

### 5.1 加入房间：`addClient`

```go
func (h *Hub) addClient(c *Client) {
    h.mu.Lock()
    defer h.mu.Unlock()
    if c.room == "" || c.id == "" {
        return
    }
    m, ok := h.rooms[c.room]
    if !ok {
        m = make(map[string]*Client)
        h.rooms[c.room] = m
    }
    m[c.id] = c
    log.Printf("signal: join room=%s id=%s", c.room, c.id)

    members := make([]string, 0, len(m))
    for id := range m {
        members = append(members, id)
    }
    msg := Message{
        Type:    "room_members",
        Room:    c.room,
        Members: members,
    }
    for _, cli := range m {
        if cli != nil && cli.conn != nil {
            select {
            case cli.send <- msg:
            default:
            }
        }
    }
}
```

关键点：

- 使用 `h.mu.Lock()` 保护 `rooms` 的并发访问；
- 没有房间时创建新 map；
- 将客户端存入 `rooms[room][id]`；
- 打印加入日志；
- 枚举该房间所有成员 ID，打包成 `room_members` 消息广播给房间内所有客户端。

### 5.2 离开房间：`removeClient`

```go
func (h *Hub) removeClient(c *Client) {
    h.mu.Lock()
    defer h.mu.Unlock()
    if c.room == "" || c.id == "" {
        return
    }
    if m, ok := h.rooms[c.room]; ok {
        if existing, ok2 := m[c.id]; ok2 {
            delete(m, c.id)
            close(existing.send)
        }
        if len(m) == 0 {
            delete(h.rooms, c.room)
            log.Printf("signal: room %s closed", c.room)
        } else {
            members := make([]string, 0, len(m))
            for id := range m {
                members = append(members, id)
            }
            msg := Message{
                Type:    "room_members",
                Room:    c.room,
                Members: members,
            }
            for _, cli := range m {
                if cli != nil && cli.conn != nil {
                    select {
                    case cli.send <- msg:
                    default:
                    }
                }
            }
        }
    }
}
```

关键点：

- 同样通过互斥锁保护 `rooms`；
- 找到 `rooms[c.room]` 后：
  - 删除对应 `id`，并关闭其 `send` 通道；
  - 若该房间已空，删除房间并打印“room closed”；
  - 若仍有其他成员：重新构建成员列表，广播 `room_members` 给房间内剩余成员。

> 注意：
> - 这里使用 `select { case cli.send <- msg: default: }` 非阻塞发送，避免因为某个客户端处理过慢而卡住整个 Hub。

---

## 6. 消息转发：`forward`

```go
func (h *Hub) forward(msg Message) {
    h.mu.RLock()
    defer h.mu.RUnlock()
    if m, ok := h.rooms[msg.Room]; ok {
        if dst, ok := m[msg.To]; ok && dst != nil && dst.conn != nil {
            select {
            case dst.send <- msg:
            default:
                // drop if buffer full to avoid blocking the hub
            }
        }
    }
}
```

- 使用读锁 `RLock`，因为这里只需要读房间结构；
- 根据 `msg.Room` 找到房间 map，再根据 `msg.To` 找到目标客户端；
- 将整条 `Message` 写入目标客户端的 `send` 通道；
- 如果通道缓冲已满，直接丢弃该消息，以免 Hub 被阻塞（Demo 级实现，生产环境可以考虑更精细的错误处理和重试）。

这种设计使得：

- 服务端不关心 SDP/ICE 的具体内容，只负责**按房间 + To 定向转发**；
- 所有 WebRTC 细节都由浏览器端处理。

---

## 7. 前端如何使用这些信令

文件：`web/app.js` 中，与信令相关的主要逻辑：

### 7.1 建立 WebSocket 并发送 join

```js
function connectWS() {
  if (ws && ws.readyState === WebSocket.OPEN) return
  const proto = location.protocol === 'https:' ? 'wss://' : 'ws://'
  ws = new WebSocket(proto + location.host + '/ws')
  ws.onopen = () => {
    setError('')
    ws.send(JSON.stringify({ type: 'join', room: roomId, from: myId }))
    setState('joined')
  }
  ws.onmessage = async (ev) => {
    const msg = JSON.parse(ev.data)
    // 这里根据 msg.type 处理 offer/answer/candidate/room_members
  }
}
```

- 连接 `/ws` 后立即发送一个 `join` 消息：
  - `room`：房间名；
  - `from`：本端 ID。
- 服务器在 `HandleWS` 中收到 `join`，会调用 `addClient` 并广播房间成员列表。

### 7.2 处理房间成员列表 `room_members`

```js
else if (msg.type === 'room_members') {
  const list = msg.members || []
  renderMembers(list)
}
```

- `renderMembers(list)` 会把成员渲染成一组按钮：
  - 自己的 ID 后面带 `(you)`；
  - 点击其他人的 ID，会把其填入 `Remote ID` 输入框，方便用 `Call` 发起一对一通话。

---

## 8. 小结与建议

- Hub/Client/Message 组合构成了一个**极简的信令服务器**：
  - 房间管理：`rooms[room][id]`；
  - 消息转发：`forward` 按 `Room + To` 匹配目标；
  - 状态广播：`room_members` 让前端实时知道在线成员。
- 前端只需遵守一个简单的 JSON 协议，就能：
  - 加入房间、选择对端 ID；
  - 发送/接收 SDPs 和 ICE 候选；
  - 展示房间成员列表。

接下来你若想在这个基础上继续进阶，可以尝试：

1. 设计一个简单的“房间权限/昵称”机制：
   - 在 `join` 消息中增加昵称字段；
   - 在房间成员列表中显示昵称而不是纯 ID。
2. 实现小规模 Mesh 多人通话：
   - 将 `pc` 变为 `remoteId -> pc` 的映射；
   - 为每个远端创建独立的 `RTCPeerConnection` 和 `<video>`；
   - 使用同样的信令结构转发不同 pair 的 `offer/answer/candidate`。
