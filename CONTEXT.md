# LessUp WebRTC 领域词汇表

本文档定义项目的核心领域概念，用于指导架构讨论和代码命名。

---

## 核心领域

### Room（房间）

一个虚拟的通信空间，客户端加入后可以与其他成员进行 WebRTC 通话。

- 每个房间有唯一的名称（最长 64 字符）
- 房间自动创建（首个客户端加入时）和销毁（最后一个离开时）
- 房间容量上限：50 个客户端
- 系统房间上限：1000 个房间

### Client（客户端）

连接到信令服务器的 WebSocket 连接，代表一个用户的信令身份。

- 客户端 ID：用户提供的唯一标识符（最长 64 字符）
- 连接 ID：服务器分配的内部标识符（用于日志追踪）
- 身份绑定：首次加入房间后，ID 和房间不可更改

### Peer（对等方）

WebRTC 连接的远端参与者，存储在本地状态中。

- 每个 Peer 对应一个 RTCPeerConnection
- 包含连接状态、媒体流、UI 元素引用
- 与特定 Client ID 关联（同一用户可能有多条 Peer 连接）

### Signal（信令）

用于建立 WebRTC 连接的消息交换机制。

- 通过 WebSocket 传输
- 消息类型：join、offer、answer、candidate、hangup
- 信令服务器只转发，不解析 SDP/ICE 内容

### Media Stream（媒体流）

音视频数据的实时流。

- 本地流：来自摄像头/麦克风的采集
- 远端流：从 Peer 接收的流
- 屏幕流：来自屏幕共享的流

### DataChannel（数据通道）

WebRTC 的双向数据传输通道。

- 用于聊天消息传输
- 在发起呼叫时创建
- 支持 open/message/close 事件

---

## 系统边界

### 后端（Go）

| 模块 | 职责 |
|:-----|:-----|
| Signal Hub | 房间管理、消息路由、身份验证 |
| Client | WebSocket 连接生命周期、速率限制 |
| Message | 信令消息结构定义、类型常量 |
| ProtocolError | 协议错误领域模型、错误码定义 |

### 前端（JavaScript）

| 模块 | 职责 |
|:-----|:-----|
| app.js | 应用入口、控制器组装 |
| state/ | 领域状态管理（roomState、mediaState、peersState） |
| signaling.js | WebSocket 连接、消息处理 |
| peers.js | Peer 连接管理、SDP/ICE 协商 |
| chat.js | DataChannel 聊天消息收发 |
| media.js | 媒体流管理、录制 |
| ui.js | DOM 操作、视图渲染 |
| stats.js | WebRTC 统计信息收集 |

---

## 状态机

### 房间状态（roomState）

```
idle → connecting → joined ⇄ reconnecting → idle
```

### Peer 连接状态（connectionState）

```
new → connecting → connected → disconnected → closed/failed
```

---

## 架构概念

### BrowserApi（浏览器 API 抽象层）

浏览器原生 API 的抽象接口，用于解耦控制器与浏览器环境的直接依赖。

- 提供工厂方法：`createWebSocket`、`createPeerConnection`、`getUserMedia`、`getDisplayMedia`
- 生产环境使用真实实现，测试环境注入 mock
- 目的：解锁控制器单元测试能力

### Observable（可观察状态）

状态订阅模式的核心实现，提供 `subscribe` 和 `notify` 方法。

- 被状态模块复用，消除订阅逻辑重复
- 支持重入保护（防止 notify 循环）

### 协议同步验证

自动化脚本检查 YAML、Go、JS 三处协议定义的一致性。

- 检查消息类型 enum 一致性
- 检查错误码 enum 一致性
- 检查字段名一致性
- 集成到 `make check`

---

## 错误码

信令服务器定义的错误码：

| 错误码 | 含义 |
|:-------|:-----|
| `invalid_id` | 客户端 ID 格式无效 |
| `invalid_room` | 房间名格式无效 |
| `invalid_join` | 加入请求缺少必要字段 |
| `duplicate_id` | 房间内 ID 已存在 |
| `room_full` | 房间已满（50 人） |
| `room_limit_reached` | 系统房间上限（1000） |
| `room_missing` | 房间不存在 |
| `already_joined` | 已在房间中 |
| `identity_locked` | 身份已绑定不可更改 |
| `not_joined` | 未加入房间 |
| `invalid_target` | 目标客户端无效 |
| `target_not_found` | 目标客户端不在房间 |
| `membership_lost` | 客户端已从房间移除 |
| `unknown_type` | 消息类型不支持 |
| `rate_limited` | 消息发送过快 |
