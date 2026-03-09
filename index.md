---
layout: default
title: WebRTC
---

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/LessUp/webrtc/blob/main/LICENSE)
![Go](https://img.shields.io/badge/Go-1.22+-00ADD8?logo=go&logoColor=white)
![WebRTC](https://img.shields.io/badge/WebRTC-Enabled-333333?logo=webrtc&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)

基于 Go 的 WebRTC 示例项目，提供完整的 WebSocket 信令服务与浏览器端 Demo。从一对一通话到多人 Mesh 房间，覆盖 WebRTC 核心能力的学习与实践。

---

## 已实现功能

| 阶段 | 能力 | 状态 |
|------|------|:----:|
| **阶段 1** | 一对一通话、状态展示、错误处理、心跳保活 | ✅ |
| **阶段 2** | 静音/摄像头开关、屏幕共享、DataChannel 文本聊天、本地录制 | ✅ |
| **阶段 3** | 房间成员列表、自动呼叫提示、小规模 Mesh 多人通话 | ✅ |
| **阶段 4** | Docker 多阶段构建与部署 | ✅ |
| **计划中** | TURN 支持（coturn）、HTTPS/WSS 反向代理 | 🔜 |

## 架构总览

```
┌─────────────────────────────────────────────────┐
│  浏览器 A                                        │
│  ┌────────┐    ┌──────────┐    ┌──────────────┐ │
│  │ HTML UI│───→│  app.js  │───→│ getUserMedia │ │
│  └────────┘    └────┬─────┘    └──────┬───────┘ │
│                     │                 │          │
└─────────────────────┼─────────────────┼──────────┘
                      │ WebSocket       │ WebRTC P2P
               ┌──────▼──────┐         │
               │  Go 后端     │         │
               │ ┌──────────┐│         │
               │ │Signal Hub││         │
               │ │ (房间管理) ││         │
               │ └──────────┘│         │
               └──────┬──────┘         │
                      │ WebSocket      │
┌─────────────────────┼────────────────┼───────────┐
│  浏览器 B           │                │           │
│  ┌────────┐    ┌────▼─────┐    ┌─────▼────────┐ │
│  │ HTML UI│───→│  app.js  │───→│ getUserMedia │ │
│  └────────┘    └──────────┘    └──────────────┘ │
└──────────────────────────────────────────────────┘
```

**信令流程**: Browser → WebSocket `/ws` → Signal Hub（Offer / Answer / ICE Candidate 转发）→ WebSocket → Browser  
**媒体流程**: Browser ←→ WebRTC P2P 音视频 / DataChannel ←→ Browser

## 快速开始

```bash
# 克隆
git clone https://github.com/LessUp/webrtc.git
cd webrtc

# （可选）国内代理
go env -w GOPROXY=https://goproxy.cn,direct

# 启动
go mod tidy
go run ./cmd/server
# 浏览器访问 http://localhost:8080
```

### Docker

```bash
docker build -t webrtc .
docker run --rm -p 8080:8080 webrtc
```

### 本地测试步骤

1. 打开两个浏览器窗口，访问 `http://localhost:8080`
2. 输入相同房间名并 Join
3. 复制一方 Your ID 到另一方 Remote ID，点击 Call
4. 允许摄像头/麦克风权限，即可看到远端视频

## 核心特性

- **WebSocket 信令** — Gorilla WebSocket 实现房间内 Offer/Answer/ICE Candidate 转发，支持心跳保活
- **媒体控制** — 静音/取消静音、摄像头开关、屏幕共享（`getDisplayMedia`）
- **DataChannel** — 点对点文本聊天，无需服务器中转
- **本地录制** — MediaRecorder 录制音视频流，导出 `.webm` 下载
- **多人 Mesh** — 房间成员列表广播，多 PeerConnection 管理，网格视频布局
- **Docker** — 多阶段 Dockerfile，Go 编译 + 静态前端打包

## 配置

| 环境变量 | 说明 | 默认值 |
|---------|------|--------|
| `ADDR` | HTTP 监听地址 | `:8080` |
| `WS_ALLOWED_ORIGINS` | WebSocket 允许来源（逗号分隔） | `localhost` |

## 项目结构

```
webrtc/
├── cmd/server/         # HTTP + WebSocket 入口
├── internal/signal/    # 信令逻辑（房间、消息转发）
├── web/
│   ├── index.html      # 浏览器 UI
│   ├── app.js          # WebRTC & 信令逻辑
│   └── styles.css      # 样式
├── docs/
│   ├── guide.md        # 项目技术说明
│   └── signaling.md    # 信令协议详解
├── changelog/          # 变更日志
└── Dockerfile          # 多阶段构建
```

## 技术栈

| 类别 | 技术 |
|------|------|
| 后端 | Go 1.22+ |
| 信令 | Gorilla WebSocket |
| 前端 | HTML + Vanilla JS |
| 媒体 | WebRTC (getUserMedia, RTCPeerConnection, DataChannel, MediaRecorder) |
| 容器 | Docker (multi-stage) |
| CI | GitHub Actions |

---

## 文档

- [完整 README](README.md)
- [使用指南](docs/guide.md) — 架构、前端、媒体、录制
- [信令协议](docs/signaling.md) — 信令与房间管理深入讲解
- [开发路线图](ROADMAP.md)
- [贡献指南](CONTRIBUTING.md)
