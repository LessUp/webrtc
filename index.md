---
layout: default
title: WebRTC
---

# WebRTC

基于 Go 的最小可用 WebRTC 示例项目 — WebSocket 信令服务器与浏览器端 Demo，适合作为实时音视频应用的入门模板。

## 核心特性

- **WebSocket 信令** — Gorilla WebSocket 实现房间内 Offer/Answer/ICE Candidate 转发
- **浏览器前端** — 一键采集音视频并发起点对点呼叫
- **Go Modules** — 依赖管理，便于扩展与部署
- **可扩展架构** — 可进一步接入 TURN/SFU/录制等能力

## 文档

- [README](README.md) — 项目概述与快速开始
- [使用指南](docs/guide.md) — 详细使用教程
- [信令协议](docs/signaling.md) — WebSocket 信令协议文档

## 架构

```
Browser ──HTTP GET /──→ HTTP 静态文件
Browser ──WebSocket /ws──→ Signal Hub
Browser ──WebRTC 媒体通道──→ 远端浏览器
```

## 快速开始

```bash
# 克隆项目
git clone https://github.com/LessUp/WebRTC.git
cd WebRTC

# 运行服务器
go run cmd/server/main.go

# 浏览器访问 http://localhost:8080
```

## 技术栈

| 类别 | 技术 |
|------|------|
| 后端 | Go 1.22+ |
| 信令 | Gorilla WebSocket |
| 前端 | HTML + JavaScript |
| 容器 | Docker |

## 链接

- [GitHub 仓库](https://github.com/LessUp/WebRTC)
- [README](README.md)
