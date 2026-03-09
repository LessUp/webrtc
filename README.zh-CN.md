# WebRTC

[English](README.md) | 简体中文 | [📖 在线文档](https://lessup.github.io/webrtc/)

[![Go CI](https://github.com/LessUp/webrtc/actions/workflows/ci.yml/badge.svg)](https://github.com/LessUp/webrtc/actions/workflows/ci.yml)
[![Pages](https://github.com/LessUp/webrtc/actions/workflows/pages.yml/badge.svg)](https://lessup.github.io/webrtc/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
![Go](https://img.shields.io/badge/Go-1.22+-00ADD8?logo=go&logoColor=white)
![WebRTC](https://img.shields.io/badge/WebRTC-Enabled-333333?logo=webrtc&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)

基于 Go 的最小可用 WebRTC 示例项目，提供 WebSocket 信令服务器与浏览器端 Demo。从一对一通话到多人 Mesh 房间，覆盖 WebRTC 核心能力的学习与实践。

## 特性

| 特性 | 说明 |
|:-----|:-----|
| **WebSocket 信令** | Gorilla WebSocket 实现房间内 Offer/Answer/ICE Candidate 转发，支持心跳保活 |
| **媒体控制** | 静音/取消静音、摄像头开关、屏幕共享（`getDisplayMedia`） |
| **DataChannel** | 点对点文本聊天，无需服务器中转 |
| **本地录制** | MediaRecorder 录制音视频流，导出 `.webm` 下载 |
| **多人 Mesh** | 房间成员列表广播，多 PeerConnection 管理，网格视频布局 |
| **安全防护** | Origin 校验白名单、房间/人数上限、自动断线重连 |
| **Docker 部署** | 多阶段 Dockerfile，Go 编译 + 静态前端打包，镜像体积最小化 |

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

## 快速开始

### 前置要求

- Go 1.22+
- 浏览器：Chrome / Edge / Firefox 最新版

### 本地运行

```bash
git clone https://github.com/LessUp/webrtc.git
cd webrtc

# （可选）国内代理
go env -w GOPROXY=https://goproxy.cn,direct

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

> 提示：若在同一台机器打开两个窗口但无法互通，请先关闭 `HTTPS-Only` 模式或在隐身窗口测试。

## 配置

| 环境变量 | 说明 | 默认值 |
|:---------|:-----|:-------|
| `ADDR` | HTTP 服务监听地址 | `:8080` |
| `WS_ALLOWED_ORIGINS` | WebSocket 允许来源，逗号分隔；设为 `*` 允许所有来源 | `localhost` |

设置示例（PowerShell）：

```powershell
$env:WS_ALLOWED_ORIGINS="https://example.com,https://foo.bar"
go run ./cmd/server
```

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
│   ├── ci.yml           # Go 构建 + 测试 + lint
│   └── pages.yml        # GitHub Pages 部署
├── changelog/           # 变更日志
├── Dockerfile           # 多阶段构建
├── .golangci.yml        # Linter 配置
└── go.mod               # Go 模块定义
```

## 技术栈

| 类别 | 技术 |
|:-----|:-----|
| **后端** | Go 1.22+、net/http、Gorilla WebSocket |
| **前端** | HTML5 + Vanilla JavaScript + CSS3 |
| **媒体** | WebRTC（getUserMedia、RTCPeerConnection、DataChannel、MediaRecorder） |
| **容器** | Docker（multi-stage build） |
| **CI/CD** | GitHub Actions（golangci-lint + 多版本测试 + GitHub Pages 部署） |

## 文档

- [技术指南](docs/guide.md) — 项目整体架构、前端实现、媒体控制、录制等技术详解
- [信令协议](docs/signaling.md) — 信令与房间管理的深入讲解
- [开发路线图](ROADMAP.md) — 各阶段开发计划与进度追踪
- [贡献指南](CONTRIBUTING.md) — 开发流程、代码规范、提交信息格式

## 路线图

- [x] 一对一通话、状态展示、错误处理、心跳保活
- [x] 静音/摄像头/屏幕共享、DataChannel 聊天、本地录制
- [x] 房间成员列表、自动呼叫提示、多人 Mesh 通话
- [x] Docker 多阶段构建与部署
- [ ] TURN 支持（coturn）
- [ ] HTTPS/WSS 反向代理
- [ ] 多人通话 SFU 框架

欢迎提交 Issue 与 PR 参与共建。

## License

[MIT](LICENSE)
