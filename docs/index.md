---
layout: default
title: Documentation — WebRTC
description: 完整的 WebRTC 项目文档，包含技术指南、信令协议、部署说明和故障排除
---

<div class="hero-section" style="padding: 2rem 1rem;">
  <h1 class="hero-title" style="font-size: 2rem;">📖 文档中心</h1>
  <p class="hero-subtitle">探索 WebRTC 项目的完整技术文档</p>
</div>

---

## 快速导航

<div class="doc-cards">
  <a href="{{ site.baseurl }}/docs/guide" class="doc-card">
    <span class="doc-icon">🚀</span>
    <div class="doc-content">
      <h4>快速开始指南</h4>
      <p>环境准备、本地运行、Docker 部署的最简步骤</p>
    </div>
    <span class="doc-arrow">→</span>
  </a>
  
  <a href="{{ site.baseurl }}/docs/signaling" class="doc-card">
    <span class="doc-icon">📡</span>
    <div class="doc-content">
      <h4>信令协议参考</h4>
      <p>WebSocket 消息格式、房间管理、心跳机制详解</p>
    </div>
    <span class="doc-arrow">→</span>
  </a>
  
  <a href="{{ site.baseurl }}/docs/deployment" class="doc-card">
    <span class="doc-icon">🌐</span>
    <div class="doc-content">
      <h4>生产部署指南</h4>
      <p>HTTPS/WSS 配置、TURN 服务器、性能优化</p>
    </div>
    <span class="doc-arrow">→</span>
  </a>
  
  <a href="{{ site.baseurl }}/docs/troubleshooting" class="doc-card">
    <span class="doc-icon">🔍</span>
    <div class="doc-content">
      <h4>常见问题排查</h4>
      <p>连接问题、媒体问题、部署问题的解决方案</p>
    </div>
    <span class="doc-arrow">→</span>
  </a>
  
  <a href="{{ site.baseurl }}/docs/api" class="doc-card">
    <span class="doc-icon">⚙️</span>
    <div class="doc-content">
      <h4>API 配置参考</h4>
      <p>环境变量、端口配置、ICE 服务器配置说明</p>
    </div>
    <span class="doc-arrow">→</span>
  </a>
</div>

---

## 文档结构

本项目遵循 **Spec-Driven Development (Spec-Driven Development)** 方法论，所有实现都基于规范文档。

### 用户与开发者指南

| 文档 | 中文 | 英文 | 说明 |
|:-----|:--:|:--:|:-----|
| **指南** | [中文](guide.zh-CN.md) | [English](guide.md) | 架构、实现细节、代码走读 |
| **部署** | [中文](deployment.zh-CN.md) | [English](deployment.md) | Docker、HTTPS/TURN 设置、生产部署 |
| **信令协议** | [中文](signaling.zh-CN.md) | [English](signaling.md) | WebSocket 协议和消息规范 |
| **API 参考** | [中文](api.zh-CN.md) | [English](api.md) | 配置选项、环境变量、端点 |
| **故障排除** | [中文](troubleshooting.zh-CN.md) | [English](troubleshooting.md) | 常见问题和解决方案 |

### 规范文档 (Specs)

规范目录是开发的**单一真相来源 (Single Source of Truth)**：

| 规范 | 路径 | 说明 |
|:-----|:-----|:-----|
| **产品规范** | [`/specs/product/`](../specs/product/) | 功能定义和验收标准 |
| **RFC 文档** | [`/specs/rfc/`](../specs/rfc/) | 技术设计文档和架构决策 |
| **API 规范** | [`/specs/api/`](../specs/api/) | OpenAPI 3.0 信令规范 |
| **数据库规范** | [`/specs/db/`](../specs/db/) | 内存数据结构定义 |
| **测试规范** | [`/specs/testing/`](../specs/testing/) | BDD 测试规范和验收标准 |

---

## 学习路径

### 🔰 初学者

如果您是 WebRTC 新手，建议按以下顺序阅读：

1. **[快速开始指南](guide.md#quick-start)** — 先让项目跑起来
2. **[信令协议入门](signaling.md#概览)** — 了解浏览器如何建立连接
3. **[技术指南 - 前端状态机](guide.md#前端状态机)** — 理解客户端如何管理连接状态

### 🛠️ 开发者

如果您想扩展或修改项目：

1. **[技术指南 - 架构概览](guide.md#架构概览)** — 整体系统架构
2. **[RFC-0001: 信令服务器](../specs/rfc/0001-signaling-server.md)** — 服务端设计决策
3. **[RFC-0002: 前端架构](../specs/rfc/0002-frontend-architecture.md)** — 客户端模块设计
4. **[产品规范](../specs/product/webrtc-platform.md)** — 功能定义和验收标准

### 🏭 运维工程师

如果您需要部署到生产环境：

1. **[部署指南](deployment.md)** — Docker 部署和配置
2. **[API 配置参考](api.md#configuration)** — 所有环境变量说明
3. **[故障排除](troubleshooting.md)** — 常见部署问题

---

## 相关资源

### 外部链接

| 资源 | 链接 | 说明 |
|:-----|:-----|:-----|
| GitHub 仓库 | [LessUp/webrtc](https://github.com/LessUp/webrtc) | 源代码、Issue、PR |
| 变更日志 | [CHANGELOG.md](../CHANGELOG.md) | 版本历史和发布说明 |
| 贡献指南 | [CONTRIBUTING.md](../CONTRIBUTING.md) | 开发流程和规范 |
| 路线图 | [ROADMAP.md](../ROADMAP.md) | 未来开发计划 |

### WebRTC 学习资源

- [MDN - WebRTC API](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- [WebRTC 官方文档](https://webrtc.org/getting-started/overview)
- [WebRTC for the Curious](https://webrtcforthecurious.com/)

---

<div class="callout callout-info">
  <div class="callout-title">💡 需要帮助？</div>
  <ul style="margin-bottom: 0;">
    <li><strong>发现 Bug？</strong> 在 <a href="https://github.com/LessUp/webrtc/issues">GitHub Issues</a> 提交问题</li>
    <li><strong>有功能建议？</strong> 查看 <a href="../ROADMAP.md">路线图</a> 或提交 Feature Request</li>
    <li><strong>想参与贡献？</strong> 阅读 <a href="../CONTRIBUTING.md">贡献指南</a></li>
  </ul>
</div>

---

<div style="text-align: center; margin-top: 2rem; color: #6c757d; font-size: 0.9rem;">
  <strong>最后更新</strong>: 2026-04-17 | <strong>版本</strong>: v1.0.0
</div>
