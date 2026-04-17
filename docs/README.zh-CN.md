---
layout: default
title: 文档 — WebRTC
description: WebRTC 学习平台完整文档
---

[← 返回首页]({{ site.baseurl }}/)

# WebRTC 文档

欢迎查阅 WebRTC 项目文档。本项目遵循**规范驱动开发（SDD）**范式。

---

## 目录

- [规范文档（唯一事实来源）](#规范文档唯一事实来源)
- [用户与开发者指南](#用户与开发者指南)
- [快速导航](#快速导航)
- [语言选择](#语言选择)
- [外部资源](#外部资源)

---

## 规范文档（唯一事实来源）

`/specs` 目录是权威来源。**规范驱动所有开发工作。**

| 规范 | 描述 |
|:-----|:-----|
| **[产品规范](../specs/product/webrtc-platform.md)** | 功能定义和验收标准 |
| **[RFC-0001](../specs/rfc/0001-signaling-server.md)** | 信令服务器架构 |
| **[RFC-0002](../specs/rfc/0002-frontend-architecture.md)** | 前端架构和模块设计 |
| **[API 规范](../specs/api/signaling.yaml)** | OpenAPI 3.0 信令规范 |
| **[数据库 Schema](../specs/db/schema.md)** | 内存数据结构 |
| **[测试规范](../specs/testing/testing-spec.feature)** | BDD 测试规范 |

---

## 用户与开发者指南

完整文档提供英文和简体中文版本。

### 入门指南

| 文档 | 英文 | 中文 | 描述 |
|:-----|:----:|:----:|:-----|
| **技术指南** | [English](guide.md) | [中文](guide.zh-CN.md) | 架构设计、实现细节、代码解析 |
| **部署指南** | [English](deployment.md) | [中文](deployment.zh-CN.md) | Docker、HTTPS、TURN 配置、生产部署 |

### 参考资料

| 文档 | 英文 | 中文 | 描述 |
|:-----|:----:|:----:|:-----|
| **信令协议** | [English](signaling.md) | [中文](signaling.zh-CN.md) | WebSocket 协议和消息规范 |
| **API 参考** | [English](api.md) | [中文](api.zh-CN.md) | 配置选项、环境变量、端点 |

### 故障排查

| 文档 | 英文 | 中文 | 描述 |
|:-----|:----:|:----:|:-----|
| **故障排查** | [English](troubleshooting.md) | [中文](troubleshooting.zh-CN.md) | 常见问题和解决方案 |

---

## 快速导航

### 🚀 快速开始

1. [快速开始指南](guide.zh-CN.md#快速开始) — 本地运行项目
2. [Docker 部署](deployment.zh-CN.md) — 生产环境部署
3. [配置说明](api.zh-CN.md#配置) — 环境变量

### 🔧 开发

1. [架构概览](guide.zh-CN.md#架构概览)
2. [信令协议](signaling.zh-CN.md)
3. [前端状态机](guide.zh-CN.md#前端状态机)

### 🏭 运维

1. [部署指南](deployment.zh-CN.md)
2. [故障排查](troubleshooting.zh-CN.md)
3. [性能调优](api.zh-CN.md#限制与性能)

---

## 语言选择

本文档提供多种语言版本：

- **[English](README.md)** — 英文
- **简体中文**（当前）

---

## 外部资源

| 资源 | 链接 | 描述 |
|:-----|:-----|:-----|
| GitHub 仓库 | [LessUp/webrtc](https://github.com/LessUp/webrtc) | 源代码 |
| 更新日志 | [CHANGELOG.md](../CHANGELOG.md) | 版本历史 |
| 贡献指南 | [CONTRIBUTING.md](../CONTRIBUTING.md) | 开发工作流 |
| 路线图 | [ROADMAP.md](../ROADMAP.md) | 未来规划 |

---

## 需要帮助？

- **发现 Bug？** [提交 Issue](https://github.com/LessUp/webrtc/issues)
- **有问题？** 查看 [故障排查指南](troubleshooting.zh-CN.md)
- **想贡献代码？** 参考 [贡献指南](../CONTRIBUTING.md)

---

**最后更新**: 2026-04-17 | **版本**: v1.0.0
