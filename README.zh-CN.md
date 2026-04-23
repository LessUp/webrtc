<div align="center">

# LessUp WebRTC

**一个用 Go 信令服务和原生 JavaScript 前端构建的、适合学习与演示的 WebRTC 项目。**

[![CI](https://github.com/LessUp/webrtc/actions/workflows/ci.yml/badge.svg)](https://github.com/LessUp/webrtc/actions/workflows/ci.yml)
[![Pages](https://github.com/LessUp/webrtc/actions/workflows/pages.yml/badge.svg)](https://lessup.github.io/webrtc/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Go Version](https://img.shields.io/badge/Go-1.22+-00ADD8?logo=go&logoColor=white)](https://go.dev/)

[English](README.md) | [简体中文](README.zh-CN.md) | [在线文档](https://lessup.github.io/webrtc/) | [OpenSpec 导航](docs/specs.zh-CN.md)

</div>

## 项目定位

LessUp WebRTC 面向想快速看懂 WebRTC 核心链路的人：代码量适中，但关键能力完整，适合学习、演示和做小规模功能验证。

- WebSocket 信令、房间管理、身份绑定
- 浏览器端音视频直连与 DataChannel 聊天
- 静音、摄像头开关、屏幕共享、本地录制
- 无框架前端，直接由 Go 服务静态文件
- Docker 部署与公开文档站点

## 当前能力

| 模块 | 状态 |
|:-----|:-----|
| 信令服务 | Go + Gorilla WebSocket |
| 浏览器客户端 | 原生 JavaScript ES Modules |
| 通话模型 | 一对一与小规模 Mesh |
| 媒体控制 | 静音、摄像头、共享屏幕 |
| 录制 | 浏览器端 `MediaRecorder` |
| 规范与文档 | GitHub Pages + OpenSpec |

## 快速开始

### 本地运行

```bash
git clone https://github.com/LessUp/webrtc.git
cd webrtc
go run ./cmd/server
```

打开 `http://localhost:8080`，在两个浏览器窗口加入同一个房间后发起通话。

### 基础检查

```bash
make check
cd web && npm test
```

### Docker

```bash
docker build -f deploy/docker/Dockerfile -t webrtc .
docker run --rm -p 8080:8080 webrtc
```

## 架构概览

```text
浏览器 UI
  └─ web/src/core/app.js
     ├─ controllers/media.js
     ├─ controllers/peers.js
     ├─ controllers/signaling.js
     ├─ controllers/stats.js
     └─ controllers/ui.js

Go 服务
  ├─ cmd/server/main.go
  └─ internal/signal/
```

服务端暴露的关键入口：

- `GET /` — 前端页面
- `GET /config.js` — 运行时 RTC 配置
- `GET /healthz` — 健康检查
- `GET /ws` — 信令 WebSocket

## 规范与开发流程

本仓库只使用 **OpenSpec** 管理需求、设计和任务。

- 主规范：[`openspec/specs/`](openspec/specs/)
- 活跃变更：[`openspec/changes/`](openspec/changes/)
- 公开规范导航：[`docs/specs.zh-CN.md`](docs/specs.zh-CN.md)

推荐流程：

1. 先创建或更新 OpenSpec change
2. 按 `proposal.md`、`design.md`、`tasks.md` 实施
3. 运行仓库校验命令
4. 合并前做一次 review

## 项目结构

```text
cmd/server/              应用入口
internal/signal/         信令核心与测试
web/                     静态前端
docs/                    公共文档
openspec/                规范与变更
deploy/                  Docker / Caddy / 部署资源
```

## 文档入口

- [文档首页](docs/index.zh-CN.md)
- [技术指南](docs/guide.zh-CN.md)
- [信令协议](docs/signaling.zh-CN.md)
- [部署指南](docs/deployment.zh-CN.md)
- [API 参考](docs/api.zh-CN.md)
- [故障排查](docs/troubleshooting.zh-CN.md)

## 参与贡献

请先阅读 [CONTRIBUTING.md](CONTRIBUTING.md)，并以当前 OpenSpec change 为准推进工作。这个仓库更偏好聚焦、低噪音、能一次收口的改动。
