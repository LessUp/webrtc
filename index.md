---
layout: default
title: WebRTC — 实时音视频通话示例
description: 基于 Go + WebRTC 的实时音视频示例项目，覆盖信令、媒体控制、多人 Mesh 通话、Docker 部署
---

<div align="center">

<h1>🎥 WebRTC</h1>

<p><strong>基于 Go 的 WebRTC 实时音视频示例项目</strong></p>

<p>
从一对一通话到多人 Mesh 房间，覆盖 WebRTC 核心能力的学习与实践
</p>

<p>
<a href="https://github.com/LessUp/webrtc/actions/workflows/go.yml"><img src="https://github.com/LessUp/webrtc/actions/workflows/go.yml/badge.svg" alt="Go CI"></a>
<a href="https://github.com/LessUp/webrtc/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT"></a>
<img src="https://img.shields.io/badge/Go-1.22+-00ADD8?logo=go&logoColor=white" alt="Go">
<img src="https://img.shields.io/badge/WebRTC-Enabled-333333?logo=webrtc&logoColor=white" alt="WebRTC">
<img src="https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white" alt="Docker">
</p>

<p>
<a href="https://github.com/LessUp/webrtc">GitHub 仓库</a> ·
<a href="#快速开始">快速开始</a> ·
<a href="docs/guide">技术指南</a> ·
<a href="docs/signaling">信令协议</a>
</p>

</div>

---

## 项目简介

**WebRTC** 是一个面向学习的最小可用 WebRTC 示例项目。后端使用 Go 编写 WebSocket 信令服务器，前端使用纯 HTML + JavaScript 实现浏览器端音视频通话。项目覆盖了 WebRTC 从基础到进阶的核心能力，适合作为实时音视频应用的入门模板。

## 功能全景

| 阶段 | 能力 | 状态 |
|:-----|:-----|:----:|
| **阶段 1 — 基础通话** | 一对一通话、连接状态展示、错误处理、心跳保活 | ✅ 已完成 |
| **阶段 2 — 媒体控制** | 静音/摄像头开关、屏幕共享、DataChannel 文本聊天、本地录制 | ✅ 已完成 |
| **阶段 3 — 多人房间** | 房间成员列表、自动呼叫提示、小规模 Mesh 多人通话 | ✅ 已完成 |
| **阶段 4 — 容器部署** | Docker 多阶段构建、环境变量配置 | ✅ 已完成 |
| **计划中** | TURN 支持（coturn）、HTTPS/WSS 反向代理 | 🔜 规划中 |

## 架构总览

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

- **信令流程** — Browser → WebSocket `/ws` → Signal Hub（Offer/Answer/ICE Candidate 转发）→ Browser
- **媒体流程** — Browser ←→ WebRTC P2P 音视频 / DataChannel ←→ Browser

## 核心特性

| 特性 | 说明 |
|:-----|:-----|
| **WebSocket 信令** | Gorilla WebSocket 实现房间内 Offer/Answer/ICE Candidate 转发，支持心跳保活 |
| **媒体控制** | 静音/取消静音、摄像头开关、屏幕共享（`getDisplayMedia`） |
| **DataChannel** | 点对点文本聊天，无需服务器中转 |
| **本地录制** | MediaRecorder 录制音视频流，导出 `.webm` 下载 |
| **多人 Mesh** | 房间成员列表广播，多 PeerConnection 管理，网格视频布局 |
| **安全防护** | Origin 校验白名单、房间/人数上限、自动断线重连 |
| **Docker 部署** | 多阶段 Dockerfile，Go 编译 + 静态前端打包，镜像体积最小化 |

## 快速开始

### 本地运行

```bash
# 克隆仓库
git clone https://github.com/LessUp/webrtc.git
cd webrtc

# （可选）国内代理
go env -w GOPROXY=https://goproxy.cn,direct

# 启动服务
go mod tidy
go run ./cmd/server
# 浏览器访问 http://localhost:8080
```

### Docker 运行

```bash
docker build -t webrtc .
docker run --rm -p 8080:8080 webrtc
```

### 使用步骤

1. 打开两个浏览器窗口，访问 `http://localhost:8080`
2. 输入相同房间名并点击 **Join**
3. 点击左侧成员列表中的对端 ID（或手动输入），然后点击 **Call**
4. 允许摄像头/麦克风权限，即可看到远端视频
5. 通话建立后可进行文本聊天、屏幕共享与本地录制

## 配置

| 环境变量 | 说明 | 默认值 |
|:---------|:-----|:-------|
| `ADDR` | HTTP 服务监听地址 | `:8080` |
| `WS_ALLOWED_ORIGINS` | WebSocket 允许来源，逗号分隔；设为 `*` 允许所有来源 | `localhost` |

## 技术栈

| 类别 | 技术 |
|:-----|:-----|
| **后端** | Go 1.22+、net/http、Gorilla WebSocket |
| **前端** | HTML5 + Vanilla JavaScript + CSS3 |
| **媒体** | WebRTC（getUserMedia、RTCPeerConnection、DataChannel、MediaRecorder） |
| **容器** | Docker（multi-stage build） |
| **CI/CD** | GitHub Actions（Go 多版本测试 + staticcheck + GitHub Pages 部署） |

## 项目结构

```
webrtc/
├── cmd/server/          # HTTP + WebSocket 服务入口
│   └── main.go          # 服务启动、优雅关闭、Origin 配置
├── internal/signal/     # 信令逻辑
│   ├── hub.go           # 房间管理、消息转发、客户端生命周期
│   ├── hub_test.go      # 单元测试
│   └── message.go       # 消息类型定义
├── web/                 # 浏览器前端
│   ├── index.html       # UI 界面
│   ├── app.js           # WebRTC & 信令逻辑（Mesh 多人通话）
│   └── styles.css       # 响应式样式（亮色/暗色主题）
├── docs/                # 技术文档
│   ├── guide.md         # 项目技术说明（架构、前端、媒体、录制）
│   └── signaling.md     # 信令协议与房间管理详解
├── .github/workflows/   # CI/CD
│   ├── go.yml           # Go 构建 + 测试 + 静态分析
│   └── pages.yml        # GitHub Pages 部署
├── changelog/           # 变更日志
├── Dockerfile           # 多阶段构建
└── go.mod               # Go 模块定义
```

## 信令协议

项目使用自定义的 JSON 信令协议，通过 WebSocket 在浏览器与服务器间交换消息：

| 消息类型 | 方向 | 用途 |
|:---------|:-----|:-----|
| `join` | Client → Server | 加入房间 |
| `leave` | Client → Server | 离开房间 |
| `offer` | Client → Server → Client | SDP Offer 转发 |
| `answer` | Client → Server → Client | SDP Answer 转发 |
| `candidate` | Client → Server → Client | ICE Candidate 转发 |
| `room_members` | Server → Clients | 房间成员列表广播 |
| `ping` / `pong` | Client ↔ Server | 心跳保活 |

> 详细协议说明请参阅 [信令协议文档](docs/signaling)

## 文档导航

| 文档 | 说明 |
|:-----|:-----|
| **[技术指南](docs/guide)** | 项目整体架构、前端实现、媒体控制、录制等技术详解 |
| **[信令协议](docs/signaling)** | 信令与房间管理的深入讲解，含时序图与代码示例 |
| **[开发路线图](ROADMAP)** | 各阶段开发计划与进度追踪 |
| **[贡献指南](CONTRIBUTING)** | 开发流程、代码规范、提交信息格式 |
| **[变更日志](changelog/)** | 各版本变更记录 |

## 开源协议

本项目基于 [MIT License](https://github.com/LessUp/webrtc/blob/main/LICENSE) 开源。

---

<div align="center">
<sub>Made with ❤️ by <a href="https://github.com/LessUp">LessUp</a></sub>
</div>
