---
layout: docs
title: 技术指南 — WebRTC
description: LessUp WebRTC 的架构与代码地图。
lang: zh-CN
---

# 技术指南

这页主要说明当前代码结构、运行时链路，以及 Go 信令服务和浏览器客户端之间的边界。

## 代码地图

```text
cmd/server/main.go          HTTP 入口与静态文件服务
internal/signal/hub.go      signaling hub、房间、限制、清理
internal/signal/message.go  消息封装
web/src/core/app.js         浏览器端总入口
web/src/controllers/        media / peers / signaling / stats / UI
web/src/config.js           默认配置与能力检测
```

## 请求链路

1. 浏览器从 `/` 加载静态资源
2. `web/src/core/app.js` 组装各个控制器
3. 客户端打开 `ws://host/ws` 或 `wss://host/ws`
4. Go Hub 负责转发 `join`、`offer`、`answer`、`candidate` 以及成员更新
5. 协商完成后，媒体流与聊天都走浏览器点对点

## 服务端职责

`cmd/server/main.go` 负责四件事：

- 提供静态前端
- 通过 `GET /config.js` 注入运行时 RTC 配置
- 通过 `GET /healthz` 提供健康检查
- 通过 `GET /ws` 提供信令 WebSocket

`internal/signal/` 中的 Hub 则负责：

- 房间创建与清理
- 客户端身份绑定
- 来源校验
- 消息校验与路由
- 发送超时与速率限制

## 前端职责

前端按职责拆分，保持可读性：

| 模块 | 作用 |
|:-----|:-----|
| `core/app.js` | 总装配入口 |
| `controllers/media.js` | 本地媒体、共享屏幕、录制 |
| `controllers/peers.js` | `RTCPeerConnection` 生命周期与聊天 |
| `controllers/signaling.js` | WebSocket 加入、离开、重连流程 |
| `controllers/stats.js` | 连接统计 |
| `controllers/ui.js` | DOM 更新与按钮状态 |
| `config.js` | 客户端 ID、能力检测、RTC 默认值 |

## 开发命令

```bash
go run ./cmd/server
make check
cd web && npm test
cd e2e && npm test
```

## 下一步阅读

- [信令协议](signaling.zh-CN)
- [API 参考](api.zh-CN)
- [OpenSpec 导航](specs.zh-CN)
