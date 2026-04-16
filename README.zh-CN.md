# WebRTC

<p align="center">
  <a href="https://github.com/LessUp/webrtc/actions/workflows/ci.yml">
    <img src="https://github.com/LessUp/webrtc/actions/workflows/ci.yml/badge.svg" alt="Go CI">
  </a>
  <a href="https://lessup.github.io/webrtc/">
    <img src="https://github.com/LessUp/webrtc/actions/workflows/pages.yml/badge.svg" alt="Pages">
  </a>
  <a href="LICENSE">
    <img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT">
  </a>
  <img src="https://img.shields.io/badge/Go-1.22+-00ADD8?logo=go&logoColor=white" alt="Go">
  <img src="https://img.shields.io/badge/WebRTC-Enabled-333333?logo=webrtc&logoColor=white" alt="WebRTC">
  <img src="https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white" alt="Docker">
</p>

<p align="center">
  <a href="README.md">English</a> | 简体中文 | <a href="https://lessup.github.io/webrtc/">📖 在线文档</a>
</p>

<p align="center">
  生产级 WebRTC 学习平台 — 从基础点对点通话到高级多人 Mesh 架构。
</p>

---

## 目录

- [功能特性](#功能特性)
- [快速开始](#快速开始)
- [项目亮点](#项目亮点)
- [系统架构](#系统架构)
- [文档导航](#文档导航)
- [配置说明](#配置说明)
- [部署指南](#部署指南)
- [参与贡献](#参与贡献)
- [许可证](#许可证)

---

## 功能特性

| 特性 | 说明 |
|:-----|:-----|
| **🌐 WebSocket 信令** | Gorilla WebSocket，支持心跳、房间管理、消息转发 |
| **👥 多人 Mesh** | 每房间最多 50 参与者，自动对等端管理 |
| **💬 DataChannel 聊天** | 点对点文本消息，无需服务器中转 |
| **🎥 媒体控制** | 静音、摄像头开关、屏幕共享 |
| **📹 本地录制** | 浏览器端 MediaRecorder，WebM 格式导出 |
| **🔒 安全** | 来源验证、身份绑定、速率限制 |
| **🐳 Docker 支持** | 多阶段构建，支持 HTTPS/TURN |

---

## 快速开始

### 环境要求

- Go 1.22+
- 现代浏览器 (Chrome 90+, Firefox 88+, Safari 14+)
- Docker（可选）

### 本地运行

```bash
git clone https://github.com/LessUp/webrtc.git
cd webrtc
go mod tidy
go run ./cmd/server
```

访问 http://localhost:8080 开始通话！

### Docker 运行

```bash
docker build -t webrtc .
docker run --rm -p 8080:8080 webrtc
```

### Docker Compose 运行（生产环境）

```bash
export DOMAIN=your-domain.com
docker compose up -d
```

访问 `https://your-domain.com`，自动 HTTPS。

---

## 项目亮点

- **🎓 学习导向** — 从一对一到多人通话的渐进式复杂度设计
- **🔐 安全优先** — 来源校验、身份绑定、连接限制
- **📦 零依赖前端** — 纯原生 JavaScript，无需任何框架
- **🚀 开箱即用** — 多阶段 Docker 构建，镜像体积最小化
- **📝 文档完善** — 中英双语文档、架构图、故障排查指南

---

## 系统架构

### 模块结构

```
webrtc/
├── cmd/server/              # HTTP + WebSocket 入口
├── internal/signal/         # 信令逻辑
│   ├── hub.go               # 房间管理、消息转发
│   ├── hub_test.go          # 单元测试
│   └── message.go           # 消息类型定义
├── web/                     # 前端（原生 JS）
│   ├── index.html           # UI
│   ├── app.js               # 主入口
│   ├── app.*.js             # 模块化组件
│   └── styles.css           # 响应式样式
├── docs/                    # 文档（中英双语）
├── changelog/               # 版本历史
└── .github/workflows/       # CI/CD
```

### 架构图

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

| 流向 | 路径 | 说明 |
|:-----|:-----|:-----|
| **信令流** | 浏览器 ↔ WebSocket `/ws` ↔ Hub | Offer/Answer/ICE 转发 |
| **媒体流** | 浏览器 ↔ WebRTC P2P ↔ 浏览器 | 音视频流传输 |
| **数据通道** | 浏览器 ↔ WebRTC P2P ↔ 浏览器 | 文本聊天 |

---

## 文档导航

完整文档提供英文和简体中文版本：

| 文档 | 说明 |
|:-----|:-----|
| **📘 [技术指南](docs/guide.zh-CN.md)** | 架构设计、实现细节 |
| **🚀 [部署指南](docs/deployment.zh-CN.md)** | Docker、HTTPS、TURN 配置 |
| **📡 [信令协议](docs/signaling.zh-CN.md)** | WebSocket 协议规范 |
| **🔧 [API 参考](docs/api.zh-CN.md)** | 配置、环境变量 |
| **🔍 [故障排查](docs/troubleshooting.zh-CN.md)** | 常见问题和解决方案 |

📖 **在线文档**: https://lessup.github.io/webrtc/

---

## 配置说明

### 环境变量

| 变量名 | 默认值 | 说明 |
|:-------|:-------|:-----|
| `ADDR` | `:8080` | HTTP 服务监听地址 |
| `WS_ALLOWED_ORIGINS` | `*` | WebSocket 允许来源，逗号分隔；`*` 允许所有 |
| `RTC_CONFIG_JSON` | 公共 STUN | 传递给浏览器的 ICE/TURN 配置 |

### 自定义 ICE/TURN 配置

```bash
export RTC_CONFIG_JSON='{
  "iceServers": [
    { "urls": ["stun:stun.l.google.com:19302"] },
    { "urls": ["turn:turn.example.com:3478"], "username": "user", "credential": "pass" }
  ]
}'
```

---

## 部署指南

### 生产检查清单

- [ ] `WS_ALLOWED_ORIGINS` 设置为你的域名
- [ ] 配置 TURN 服务器用于 NAT 穿透
- [ ] 启用 HTTPS（Caddy 自动处理）
- [ ] 设置监控和日志

### Docker Compose（推荐）

```yaml
# docker-compose.yml
services:
  webrtc:
    build: .
    environment:
      - WS_ALLOWED_ORIGINS=yourdomain.com
      - RTC_CONFIG_JSON={"iceServers":[{"urls":"turn:yourdomain.com:3478"...}]}
  
  caddy:
    image: caddy:2-alpine
    ports:
      - "80:80"
      - "443:443"
  
  coturn:
    image: coturn/coturn:latest
    network_mode: host
```

详细步骤请参阅 [部署指南](docs/deployment.zh-CN.md)。

---

## 参与贡献

欢迎贡献代码！请参阅：

- [贡献指南](CONTRIBUTING.md) — 环境搭建和工作流
- [路线图](ROADMAP.md) — 未来规划
- [变更日志](CHANGELOG.md) — 版本历史

### 开发环境

```bash
# 安装依赖
go mod tidy

# 运行测试
go test -race ./...

# 运行代码检查
golangci-lint run

# 热重载开发
air
```

---

## 技术栈

| 类别 | 技术 |
|:-----|:-----|
| **后端** | Go 1.22+、net/http、Gorilla WebSocket |
| **前端** | HTML5 + 原生 JavaScript + CSS3 |
| **媒体** | WebRTC APIs（getUserMedia、RTCPeerConnection、DataChannel）|
| **容器** | Docker（多阶段构建）|
| **CI/CD** | GitHub Actions |

---

## 安全

- 白名单来源验证
- 服务器验证的客户端身份
- 连接限制（50 客户端/房间，1000 房间）
- 输入验证和清理
- 详见 [安全策略](.github/SECURITY.md)

---

## 许可证

[MIT License](LICENSE) © [LessUp](https://github.com/LessUp)

---

<p align="center">
  由 <a href="https://github.com/LessUp">LessUp</a> 用 ❤️ 打造
</p>

<p align="center">
  <a href="https://github.com/LessUp/webrtc/stargazers">
    <img src="https://img.shields.io/github/stars/LessUp/webrtc?style=social" alt="GitHub Stars">
  </a>
</p>
