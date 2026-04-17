<div align="center">

# 📹 WebRTC

**生产级 WebRTC 学习平台**

[![Go CI](https://github.com/LessUp/webrtc/actions/workflows/ci.yml/badge.svg)](https://github.com/LessUp/webrtc/actions/workflows/ci.yml)
[![Pages](https://github.com/LessUp/webrtc/actions/workflows/pages.yml/badge.svg)](https://lessup.github.io/webrtc/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Go Version](https://img.shields.io/badge/Go-1.22+-00ADD8?logo=go&logoColor=white)](https://golang.org/)
[![WebRTC](https://img.shields.io/badge/WebRTC-Enabled-333333?logo=webrtc&logoColor=white)](https://webrtc.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)

[English](README.md) | 简体中文 | [📖 在线文档](https://lessup.github.io/webrtc/)

</div>

<p align="center">
  从基础点对点通话到高级多人 Mesh 架构<br>
  一个以学习为导向、安全优先的 Go 语言 WebRTC 实现
</p>

<p align="center">
  <a href="specs/product/webrtc-platform.md">📋 产品规范</a> ·
  <a href="specs/rfc/0001-signaling-server.md">🏗️ RFC 文档</a> ·
  <a href="specs/api/signaling.yaml">📡 API 规范</a> ·
  <a href="CHANGELOG.md">📝 变更日志</a> ·
  <a href="ROADMAP.md">🗺️ 路线图</a>
</p>

---

## 目录

- [✨ 功能特性](#-功能特性)
- [🚀 快速开始](#-快速开始)
- [🏗️ 系统架构](#️-系统架构)
- [📚 文档导航](#-文档导航)
- [⚙️ 配置说明](#️-配置说明)
- [🚀 部署指南](#-部署指南)
- [🤝 参与贡献](#-参与贡献)
- [📄 许可证](#-许可证)

---

## ✨ 功能特性

<table>
<tr>
<td width="50%">

### 核心能力
- **🌐 WebSocket 信令** — Gorilla WebSocket，心跳保活、房间管理
- **👥 多人 Mesh** — 单房间最多 50 参与者
- **💬 DataChannel 聊天** — P2P 消息，无需服务器中转
- **🎥 媒体控制** — 静音、摄像头开关、屏幕共享
- **📹 本地录制** — 浏览器端 MediaRecorder，WebM 导出

</td>
<td width="50%">

### 生产就绪
- **🔒 安全优先** — 来源验证、身份绑定、速率限制
- **📦 零依赖前端** — 纯原生 JavaScript
- **🐳 Docker 支持** — 多阶段构建，镜像体积最小
- **🧪 完整测试** — 单元测试 + Playwright E2E 测试
- **📝 中英双语** — 完整双语文档支持

</td>
</tr>
</table>

---

## 🚀 快速开始

### 环境要求

- [Go 1.22+](https://golang.org/dl/)
- 现代浏览器 (Chrome 90+, Firefox 88+, Safari 14+)
- [Docker](https://www.docker.com/)（可选）

### 方式一：本地运行（最快）

```bash
# 克隆并运行
git clone https://github.com/LessUp/webrtc.git
cd webrtc
go mod tidy
go run ./cmd/server

# 访问 http://localhost:8080
```

### 方式二：Docker

```bash
docker build -t webrtc .
docker run --rm -p 8080:8080 webrtc
```

### 方式三：Docker Compose（生产环境）

```bash
export DOMAIN=your-domain.com
docker compose up -d
```

访问 `https://your-domain.com`，Caddy 自动配置 HTTPS。

### 使用方法

1. 打开两个浏览器窗口，访问 `http://localhost:8080`
2. 输入**相同的房间名称**，点击 **加入**
3. 从成员列表选择对端，点击 **呼叫**
4. 允许摄像头/麦克风权限 ✅
5. 享受视频通话、屏幕共享和文本聊天！

<details>
<summary>💡 NAT 穿透遇到问题？</summary>

不同网络间连接需要 TURN 服务器：

```bash
export RTC_CONFIG_JSON='{
  "iceServers": [
    { "urls": ["stun:stun.l.google.com:19302"] },
    { "urls": ["turn:your-turn.com:3478"], "username": "user", "credential": "pass" }
  ]
}'
```

详见 [部署指南](docs/deployment.zh-CN.md) 的 TURN 配置。
</details>

---

## 🏗️ 系统架构

本项目遵循 **Spec-Driven Development (SDD)** — 所有实现都基于规范文档。

### 系统概览

```
┌────────────────────────────────────────────────────────────┐
│  浏览器 A                                                   │
│  ┌────────┐    ┌──────────┐    ┌────────────────────┐     │
│  │HTML UI │──→ │  app.js  │──→ │   getUserMedia     │     │
│  └────────┘    └────┬─────┘    └─────────┬──────────┘     │
└─────────────────────┼────────────────────┼────────────────┘
                      │ WebSocket          │ WebRTC P2P
               ┌──────▼──────┐             │
               │  Go 信令服务  │             │
               │ ┌─────────┐ │             │
               │ │Hub/房间 │ │             │
               │ │管理     │ │             │
               │ └─────────┘ │             │
               └──────┬──────┘             │
                      │ WebSocket          │
┌─────────────────────┼────────────────────┼────────────────┐
│  浏览器 B           │                    │                │
│  ┌────────┐    ┌────▼──────┐    ┌───────▼────────────┐   │
│  │HTML UI │──→ │  app.js   │──→ │   getUserMedia     │   │
│  └────────┘    └───────────┘    └────────────────────┘   │
└────────────────────────────────────────────────────────────┘
```

| 流向 | 技术 | 说明 |
|:-----|:-----|:-----|
| **信令流** | WebSocket `/ws` | Offer/Answer/ICE 转发（Go Hub）|
| **媒体流** | WebRTC P2P | 音视频流（浏览器直连）|
| **数据通道** | WebRTC P2P | 文本聊天（浏览器直连）|

### 项目结构

```
webrtc/
├── cmd/server/              # HTTP + WebSocket 入口
├── internal/signal/         # 信令逻辑
│   ├── hub.go               # 房间管理、消息转发
│   ├── hub_test.go          # 单元测试
│   └── message.go           # 消息类型定义
├── web/                     # 前端（原生 JS）
│   ├── src/
│   │   ├── core/            # 应用初始化
│   │   └── controllers/     # UI、媒体、信令、对等端
│   ├── index.html
│   └── styles.css
├── docs/                    # 文档（中英双语）
├── specs/                   # 规范文档（SDD）
│   ├── product/             # 产品规范
│   ├── rfc/                 # 架构 RFC
│   ├── api/                 # OpenAPI 规范
│   ├── db/                  # 模式定义
│   └── testing/             # BDD 测试规范
└── deploy/                  # 部署配置
```

### 规范文档

| 文档 | 用途 |
|:-----|:-----|
| **[产品规范](specs/product/webrtc-platform.md)** | 功能定义、用户故事、验收标准 |
| **[RFC-0001](specs/rfc/0001-signaling-server.md)** | 信令服务器架构决策 |
| **[RFC-0002](specs/rfc/0002-frontend-architecture.md)** | 前端模块设计和状态管理 |
| **[API 规范](specs/api/signaling.yaml)** | OpenAPI 3.0 信令协议规范 |
| **[数据库模式](specs/db/schema.md)** | 内存数据结构定义 |
| **[测试规范](specs/testing/testing-spec.feature)** | BDD 验收标准 |

---

## 📚 文档导航

### 📖 指南文档

| 文档 | 说明 |
|:-----|:-----|
| **[技术指南](docs/guide.zh-CN.md)** | 架构深入、实现走读 |
| **[信令协议](docs/signaling.zh-CN.md)** | WebSocket 消息格式和流程 |
| **[部署指南](docs/deployment.zh-CN.md)** | Docker、HTTPS、TURN 服务器配置 |
| **[API 参考](docs/api.zh-CN.md)** | 环境变量和配置选项 |
| **[故障排查](docs/troubleshooting.zh-CN.md)** | 常见问题和解决方案 |

### 🌐 在线文档

**https://lessup.github.io/webrtc/**

完整文档站点，支持搜索、导航和双语切换。

---

## ⚙️ 配置说明

### 环境变量

| 变量名 | 默认值 | 说明 |
|:-------|:-------|:-----|
| `ADDR` | `:8080` | HTTP 服务监听地址 |
| `WS_ALLOWED_ORIGINS` | `*` | 允许的请求来源（逗号分隔，`*` 表示允许所有）|
| `RTC_CONFIG_JSON` | 公共 STUN | 传递给浏览器的 ICE/TURN 配置（JSON）|

### ICE/TURN 配置示例

```bash
export RTC_CONFIG_JSON='{
  "iceServers": [
    { "urls": ["stun:stun.l.google.com:19302"] },
    { 
      "urls": ["turn:turn.yourdomain.com:3478"],
      "username": "your_username",
      "credential": "your_password"
    }
  ]
}'
```

---

## 🚀 部署指南

### 生产检查清单

- [ ] `WS_ALLOWED_ORIGINS` 设置为你的域名（安全）
- [ ] 配置 TURN 服务器用于 NAT 穿透
- [ ] 启用 HTTPS（Caddy 自动处理）
- [ ] 设置监控和日志轮转

### Docker Compose（推荐）

```yaml
# docker-compose.yml
services:
  webrtc:
    build: .
    environment:
      - WS_ALLOWED_ORIGINS=yourdomain.com
      - RTC_CONFIG_JSON={"iceServers":[...]}
  
  caddy:
    image: caddy:2-alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./deploy/web/Caddyfile:/etc/caddy/Caddyfile
  
  coturn:
    image: coturn/coturn:latest
    network_mode: host
```

详细步骤请参阅 **[部署指南](docs/deployment.zh-CN.md)**。

---

## 🤝 参与贡献

欢迎贡献代码！本项目遵循 **Spec-Driven Development (SDD)**：

1. 📝 先阅读 `/specs` 中的相关规范
2. 💡 如有需要，先提出规范修改
3. 💻 按规范进行实现
4. ✅ 根据验收标准进行测试

### 快速链接

- **[AGENTS.md](AGENTS.md)** — AI Agent 工作流指南
- **[贡献指南](CONTRIBUTING.md)** — 环境搭建、编码规范、PR 流程
- **[路线图](ROADMAP.md)** — 未来规划和功能
- **[变更日志](CHANGELOG.md)** — 版本历史

### 开发环境

```bash
# 设置
go mod tidy

# 运行测试
go test -race ./...

# 运行代码检查
golangci-lint run

# 热重载开发
air
```

---

## 🛡️ 安全

- ✅ 白名单来源验证
- ✅ 服务器验证的客户端身份
- ✅ 连接限制（50/房间，1000 房间上限）
- ✅ 输入验证和清理

安全漏洞报告请参阅 [安全策略](.github/SECURITY.md)。

---

## 📊 项目统计

| 指标 | 数值 |
|:-----|:-----|
| **开发语言** | Go / JavaScript |
| **代码行数** | 约 3,000 Go + 约 2,000 JS |
| **测试覆盖** | 核心模块已测试 |
| **开源许可** | MIT |

---

## 📄 许可证

[MIT License](LICENSE) © [LessUp](https://github.com/LessUp)

---

<div align="center">

**[⭐ 给项目点个 Star](https://github.com/LessUp/webrtc/stargazers)** 如果你觉得有帮助！

由 [LessUp](https://github.com/LessUp) 用 ❤️ 打造

[![GitHub Stars](https://img.shields.io/github/stars/LessUp/webrtc?style=social)](https://github.com/LessUp/webrtc/stargazers)

</div>
