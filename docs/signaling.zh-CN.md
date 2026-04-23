---
layout: docs
title: 信令协议 — WebRTC
description: LessUp WebRTC 的信令行为与服务端约束。
lang: zh-CN
---

# 信令协议

信令层只使用一个 WebSocket 入口：`GET /ws`。

## 核心消息类型

| 类型 | 方向 | 作用 |
|:-----|:-----|:-----|
| `join` | 客户端 → 服务端 | 绑定客户端身份与房间 |
| `joined` | 服务端 → 客户端 | 加入确认 |
| `room_members` | 服务端 → 房间 | 广播成员列表 |
| `offer` / `answer` | 通过服务端在对端之间转发 | SDP 协商 |
| `candidate` | 通过服务端在对端之间转发 | ICE 候选 |
| `hangup` | 通过服务端在对端之间转发 | 结束通话 |
| `ping` / `pong` | 客户端 ↔ 服务端 | 保活 |
| `error` | 服务端 → 客户端 | 结构化错误 |

## 服务端保证

Go Hub 会强制执行：

- 一个 WebSocket 连接只绑定一个身份
- 房间名和客户端 ID 合法性校验
- 来源校验
- 房间数量和成员数量限制
- 转发时覆盖由发送方控制的字段（`from`、`room`）

## 关键限制

| 限制项 | 数值 |
|:-------|:-----|
| 最大房间数 | 1000 |
| 单房间最大成员数 | 50 |
| 最大消息大小 | 1 MiB |
| 房间名 / 客户端 ID 最大长度 | 64 |
| 发送超时 | 2 秒 |

## 典型加入流程

```text
客户端 A -> join(room, from)
服务端   -> joined
服务端   -> room_members

客户端 B -> join(room, from)
服务端   -> joined
服务端   -> room_members (A, B)
```

## 协议的落点

- 运行时代码：`internal/signal/`
- 规范要求：见 [OpenSpec 导航](specs.zh-CN)
- 消息结构：`internal/signal/message.go`
