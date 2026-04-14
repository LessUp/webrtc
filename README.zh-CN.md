# WebRTC

[English](README.md) | 简体中文 | [📖 在线文档](https://lessup.github.io/webrtc/)

[![Go CI](https://github.com/LessUp/webrtc/actions/workflows/ci.yml/badge.svg)](https://github.com/LessUp/webrtc/actions/workflows/ci.yml)
[![Pages](https://github.com/LessUp/webrtc/actions/workflows/pages.yml/badge.svg)](https://lessup.github.io/webrtc/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
![Go](https://img.shields.io/badge/Go-1.22+-00ADD8?logo=go&logoColor=white)
![WebRTC](https://img.shields.io/badge/WebRTC-Enabled-333333?logo=webrtc&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)

> **生产级 WebRTC 学习平台** — 从基础点对点通话到高级多人 Mesh 架构，本项目提供完整、文档齐全的实现，通过实践深入理解 WebRTC 核心原理。

**项目亮点**
- 🎯 **学习导向**：从一对一通话到多人通话的渐进式复杂度设计
- 🔒 **安全优先**：Origin 校验、身份绑定、连接数限制
- 📦 **零依赖前端**：纯原生 JavaScript，无需任何框架
- 🐳 **开箱即用**：多阶段 Docker 构建，镜像体积最小化
- 📚 **文档完善**：架构图、协议规范、故障排查指南一应俱全

## ✨ 核心特性

### 基础能力
| 特性 | 说明 | 状态 |
|:-----|:-----|:-----|
| **WebSocket 信令** | Gorilla WebSocket 实现 Offer/Answer/ICE Candidate 转发，支持心跳保活、加入确认、显式挂断 | ✅ 生产可用 |
| **媒体控制** | 静音/取消静音、摄像头开关、屏幕共享（`getDisplayMedia`） | ✅ 生产可用 |
| **DataChannel** | 点对点文本聊天，无需服务器中转 | ✅ 生产可用 |
| **本地录制** | MediaRecorder 录制音视频流，导出 `.webm` 下载 | ✅ 生产可用 |
| **多人 Mesh** | 房间成员列表广播，多 PeerConnection 管理，网格视频布局 | ✅ 生产可用 |

### 安全与可靠性
| 特性 | 说明 | 状态 |
|:-----|:-----|:-----|
| **Origin 校验** | 基于 WebSocket 连接的白名单 CORS 保护 | ✅ 生产可用 |
| **身份绑定** | WebSocket 连接绑定单一客户端 ID 和房间成员身份 | ✅ 生产可用 |
| **连接限制** | 房间/客户端数量限制、重复 ID 拒绝、自动重连 | ✅ 生产可用 |
| **完美协商** | 冲突处理和显式挂断信令，确保 Mesh 通话稳定 | ✅ 生产可用 |

### 运维与部署
| 特性 | 说明 | 状态 |
|:-----|:-----|:-----|
| **Docker** | 多阶段 Dockerfile，Go 编译 + 静态前端打包 | ✅ 生产可用 |
| **CI/CD** | GitHub Actions：golangci-lint、多版本测试、Pages 部署 | ✅ 生产可用 |
| **健康检查** | `/healthz` 端点，支持容器编排 | ✅ 生产可用 |

## 🏗️ 架构总览

### 系统架构

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

### 数据流向

| 流向类型 | 路径 | 说明 |
|:---------|:-----|:-----|
| **信令流** | 浏览器 → WebSocket `/ws` → Signal Hub → 浏览器 | Offer/Answer/ICE Candidate 转发 |
| **媒体流** | 浏览器 ←→ WebRTC P2P ←→ 浏览器 | 音视频流传输 |
| **数据通道** | 浏览器 ←→ WebRTC P2P ←→ 浏览器 | 文本聊天、文件传输 |

## 🚀 快速开始

### 环境要求

- **Go**：1.22 或更高版本
- **浏览器**：Chrome / Edge / Firefox 最新版
- **Docker**（可选）：用于容器化部署

### 方式一：原生 Go 运行

```bash
# 克隆仓库
git clone https://github.com/LessUp/webrtc.git
cd webrtc

# （可选）配置国内代理加速
go env -w GOPROXY=https://goproxy.cn,direct

# 安装依赖
go mod tidy

# 启动服务
go run ./cmd/server

# 服务将在 http://localhost:8080 启动
```

### 方式二：Docker 部署

```bash
# 构建 Docker 镜像
docker build -t webrtc .

# 运行容器
docker run --rm -p 8080:8080 webrtc

# 访问 http://localhost:8080
```

### 测试步骤

1. 打开两个浏览器标签页，访问 `http://localhost:8080`
2. 在两个标签页中输入相同的**房间名**，点击 **Join**
3. 在其中一个标签页，点击成员列表中的对方 ID
4. 点击 **Call** 发起连接
5. 授予摄像头/麦克风权限
6. 此时应该能看到远端视频流

> **提示**：如果在同一台机器上测试但无法互通，请关闭浏览器的"HTTPS-Only"模式或使用隐身窗口。

## ⚙️ 配置说明

### 环境变量

| 变量名 | 说明 | 默认值 | 示例 |
|:-------|:-----|:-------|:-----|
| `ADDR` | HTTP 服务监听地址 | `:8080` | `:8080`、`0.0.0.0:8080` |
| `WS_ALLOWED_ORIGINS` | WebSocket 允许来源，逗号分隔；设为 `*` 允许所有来源 | `localhost` | `localhost,example.com` 或 `*` |
| `RTC_CONFIG_JSON` | 自定义 ICE/TURN 配置（JSON 格式） | 内置公共 STUN | 见下方示例 |

### 自定义 ICE/TURN 配置

通过 `RTC_CONFIG_JSON` 环境变量配置自定义 STUN/TURN 服务器：

```bash
export RTC_CONFIG_JSON='{
  "iceServers": [
    { "urls": ["stun:stun.l.google.com:19302"] },
    {
      "urls": ["turn:turn.example.com:3478"],
      "username": "demo-user",
      "credential": "demo-password"
    }
  ]
}'
```

### 健康检查

服务提供健康检查端点，用于容器编排：

```bash
curl http://localhost:8080/healthz
# 返回：OK
```

## 📁 项目结构

```
webrtc/
├── cmd/server/              # HTTP + WebSocket 服务入口
│   └── main.go              # 服务启动、优雅关闭、Origin 配置
├── internal/signal/         # 信令逻辑
│   ├── hub.go               # 房间管理、消息转发、客户端生命周期
│   ├── hub_test.go          # 单元测试
│   └── message.go           # 消息类型定义
├── web/                     # 浏览器前端
│   ├── index.html           # UI 界面
│   ├── app.js               # WebRTC & 信令逻辑（Mesh 多人通话）
│   └── styles.css           # 响应式样式（亮色/暗色主题）
├── docs/                    # 技术文档
│   ├── guide.md             # 项目技术说明（架构、前端、媒体、录制）
│   └── signaling.md         # 信令协议与房间管理详解
├── .github/workflows/       # CI/CD 流水线
│   ├── ci.yml               # Go 构建 + 测试 + lint
│   └── pages.yml            # GitHub Pages 部署
├── changelog/               # 变更日志
├── Dockerfile               # 多阶段构建
├── .golangci.yml            # Linter 配置
└── go.mod                   # Go 模块定义
```

## 🛠️ 技术栈

| 类别 | 技术 | 用途 |
|:-----|:-----|:-----|
| **后端** | Go 1.22+、net/http、Gorilla WebSocket | 信令服务器、WebSocket 处理 |
| **前端** | HTML5 + Vanilla JavaScript + CSS3 | 零依赖浏览器 UI |
| **媒体** | WebRTC APIs | getUserMedia、RTCPeerConnection、DataChannel、MediaRecorder |
| **容器** | Docker（多阶段构建） | 最小镜像体积、便捷部署 |
| **CI/CD** | GitHub Actions | golangci-lint、多版本测试、Pages 部署 |

## 📚 文档导航

| 文档 | 说明 |
|:-----|:-----|
| [技术指南](docs/guide.md) | 架构设计、前端实现、媒体控制、录制功能 |
| [信令协议](docs/signaling.md) | 信令协议、房间管理、消息流程 |
| [开发路线图](ROADMAP.md) | 开发计划、进度追踪、未来功能 |
| [贡献指南](CONTRIBUTING.md) | 开发流程、代码规范、PR 指南 |

## 🔒 安全特性

本项目实现了多项安全最佳实践：

- **身份绑定**：每个 WebSocket 连接绑定单一客户端 ID 和房间成员身份
- **重复拒绝**：同一房间内的重复客户端 ID 会被拒绝
- **连接限制**：房间和客户端数量限制，防止资源耗尽
- **Origin 校验**：基于白名单的 WebSocket 连接 CORS 保护
- **完美协商**：冲突处理和显式挂断信令，确保 Mesh 通话稳定
- **WebSocket 加固**：读取限制、超时设置、Pong 处理、服务端驱动 Ping

## 🗺️ 开发路线图

### 已完成 ✅
- [x] 一对一通话、状态展示、错误处理、心跳保活
- [x] 静音/摄像头/屏幕共享、DataChannel 聊天、本地录制
- [x] 房间成员列表、自动呼叫提示、多人 Mesh 通话
- [x] Docker 多阶段构建与部署

### 进行中 🚧
- [ ] TURN 支持（coturn）
- [ ] HTTPS/WSS 反向代理

### 未来规划 🔮
- [ ] 多人通话 SFU 框架
- [ ] 端到端加密
- [ ] 移动端支持

## 🤝 参与贡献

欢迎提交 Issue 和 Pull Request！请参阅 [CONTRIBUTING.md](CONTRIBUTING.md) 了解：
- 开发流程
- 代码规范
- 提交信息格式
- Pull Request 流程

## 📄 许可证

本项目采用 [MIT 许可证](LICENSE)。

---

**由 LessUp 团队用 ❤️ 打造**
