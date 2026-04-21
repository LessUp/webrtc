---
layout: default
title: Roadmap — WebRTC
description: WebRTC development roadmap and milestone tracking - features, phases, and future plans
---

[← Back to Home]({{ site.baseurl }}/) | [返回首页]({{ site.baseurl }}/)

# Development Roadmap / 开发路线图

> **Project Positioning / 项目定位**: A production-ready WebRTC learning platform built with Go, covering everything from basic peer-to-peer calls to advanced multi-party Mesh architecture.
>
> 基于 Go 的生产级 WebRTC 学习平台，从基础点对点通话到高级多人 Mesh 架构，覆盖 WebRTC 核心能力的完整实现。

This roadmap documents the development plan, milestones, and progress tracking, designed with a progressive learning path.

本路线图记录项目的开发计划、里程碑和进度追踪，采用渐进式学习路径设计。

---

## 📊 Project Overview / 项目概览

### Basic Info / 基本信息

| 项目 | 内容 |
|:-----|:-----|
| **名称** | WebRTC |
| **类型** | 学习导向的生产级 Demo |
| **技术栈** | Go 1.22+ / Vanilla JavaScript / WebRTC APIs |
| **许可** | MIT |

### 核心目标

- ✅ 理解 WebRTC 点对点通话的完整流程（信令、ICE、媒体流）
- ✅ 掌握常见 WebRTC 能力（静音、屏幕共享、DataChannel、多人通话）
- ✅ 学习生产级安全实践（身份绑定、连接限制、完美协商）
- ⚠️ 不涉及复杂运维（高可用、监控、鉴权体系）

### 当前状态

| 模块 | 状态 | 完成度 |
|:-----|:-----|:-------|
| WebSocket 信令服务 | ✅ 生产可用 | 100% |
| 浏览器前端 Demo | ✅ 生产可用 | 100% |
| 多人 Mesh 通话 | ✅ 生产可用 | 100% |
| Docker 部署 | ✅ 生产可用 | 100% |

---

## 🗺️ 开发阶段总览

项目采用**渐进式学习路径**，分为四个主要阶段：

```
阶段 1: 基础体验优化
    ↓
阶段 2: WebRTC 能力扩展
    ↓
阶段 3: 多人通话进阶
    ↓
阶段 4: 部署与网络扩展
```

| 阶段 | 名称 | 状态 | 核心目标 |
|:-----|:-----|:-----|:---------|
| **阶段 1** | 打磨一对一 Demo 体验 | ✅ 已完成 | 提升稳定性、可读性、错误处理 |
| **阶段 2** | WebRTC 能力扩展 | ✅ 已完成 | 媒体控制、屏幕共享、DataChannel、录制 |
| **阶段 3** | 多人通话进阶 | ✅ 已完成 | 房间管理、Mesh 多人通话 |
| **阶段 4** | 部署与网络扩展 | ✅ 已完成 | TURN、HTTPS、Docker |

---

## 📝 阶段 1：打磨一对一 Demo 体验

> **目标**：在不增加复杂度的前提下，让一对一 Demo 更稳定、更易懂、更好用。

### 1.1 后端优化（Go 信令服务）

#### 日志与调试

- [x] **结构化日志输出**
  - [x] WebSocket 升级失败时，记录请求路径和错误详情
  - [x] JSON 消息解析失败时，包含房间/客户端上下文
  - [x] JSON 写入失败时，记录完整错误堆栈
  - **实现位置**：`internal/signal/hub.go`

#### 连接管理

- [x] **稳健的连接清理**
  - [x] 读/写错误时立即调用 `removeClient`
  - [x] 房间成员为空时自动删除房间
  - [x] 防止"僵尸连接"残留
  - **实现位置**：`internal/signal/hub.go`

- [x] **心跳保活机制**
  - [x] 前端定时发送 `type: "ping"` 消息
  - [x] 后端响应 `type: "pong"` 或忽略
  - **目的**：学习保活概念，不做复杂超时逻辑

### 1.2 前端优化（web/app.js + web/index.html）

#### 状态管理

- [x] **连接与通话状态展示**
  - [x] 状态文本区域显示：未连接 → 已加入房间 → 通话中 → 已挂断
  - [x] 关键动作时自动更新状态
  - **实现位置**：`web/app.js`

- [x] **按钮状态管理**
  - [x] 根据状态动态禁用/启用按钮
  - [x] 状态机：未加入 → 已加入 → 通话中 → 已挂断
  - **实现位置**：`web/app.js`

#### 错误处理

- [x] **用户友好的错误提示**
  - [x] `getUserMedia` 失败时显示权限提示
  - [x] WebSocket 断开时显示重连提示
  - **实现位置**：`web/app.js`

---

## 🎯 阶段 2：WebRTC 能力扩展

> **目标**：通过前端扩展，深入理解媒体轨道、屏幕共享、数据通道和录制。

### 2.1 媒体控制

- [x] **静音/取消静音**
  - [x] 添加 `Mute / Unmute` 按钮
  - [x] 通过 `localStream.getAudioTracks()[0].enabled` 控制
  - **实现位置**：`web/app.js`

- [x] **摄像头开关**
  - [x] 添加 `Camera On/Off` 按钮
  - [x] 通过视频 track 的 `enabled` 属性控制
  - **实现位置**：`web/app.js`

### 2.2 屏幕共享

- [x] **基础屏幕共享**
  - [x] 使用 `navigator.mediaDevices.getDisplayMedia` 获取屏幕流
  - [x] 替换摄像头轨道或新增屏幕窗口
  - **实现位置**：`web/app.js`

### 2.3 DataChannel 文本聊天

- [x] **点对点文本聊天**
  - [x] 创建 `RTCDataChannel`（命名为 `chat`）
  - [x] 通过 `ondatachannel` 接收通道
  - [x] 实现聊天输入框和消息显示区域
  - **实现位置**：`web/app.js`

### 2.4 本地录制

- [x] **MediaRecorder 录制**
  - [x] 录制本地或远端 `MediaStream`
  - [x] 生成 `.webm` 文件并提供下载
  - **实现位置**：`web/app.js`

---

## 🌐 阶段 3：多人通话进阶

> **目标**：理解多人房间概念，实现 3-4 人的小规模 Mesh 通话。

### 3.1 房间成员管理

- [x] **后端：成员列表广播**
  - [x] 成员加入/离开时广播 `type: "room_members"` 消息
  - [x] 消息内容为成员 ID 列表
  - **实现位置**：`internal/signal/hub.go`

- [x] **前端：成员列表显示**
  - [x] 显示当前房间在线成员
  - [x] 点击成员自动填入 `Remote ID` 输入框
  - **实现位置**：`web/app.js`

### 3.2 Mesh 多人通话

- [x] **多 PeerConnection 管理**
  - [x] 为每个远端成员创建独立 `RTCPeerConnection`
  - [x] 维护 `remoteId -> pc` 映射表
  - [x] 分别处理 offer/answer/candidate
  - **实现位置**：`web/app.js`

- [x] **多路视频布局**
  - [x] 为每个远端成员添加 `<video>` 元素
  - [x] 实现网格布局
  - **实现位置**：`web/index.html`, `web/styles.css`

> **提示**：Mesh 模式适合 3-4 人小房间；大规模多人场景建议使用 SFU。

---

## 🚀 阶段 4：部署与网络扩展

> **目标**：理解 TURN/HTTPS 和 Docker 打包，支持跨网络演示。

### 4.1 TURN 支持

- [x] **基础 TURN 配置**
  - [x] 搭建或使用 TURN 服务器（如 coturn）
  - [x] 在前端 `iceServers` 中配置 TURN
  - **注意**：不要在仓库中泄露真实凭证

### 4.2 HTTPS/WSS

- [x] **HTTPS 反向代理**
  - [x] 使用 Nginx/Caddy 提供 HTTPS
  - [x] 信令走 `wss://` 协议
  - **实现位置**：部署配置

### 4.3 Docker 部署

- [x] **多阶段 Dockerfile**
  - [x] Go 编译阶段
  - [x] 静态前端打包阶段
  - [x] 最小化镜像体积
  - **实现位置**：`Dockerfile`

---

## 📋 学习路径建议

### 推荐顺序

1. **阶段 1（必选）**：打磨基础体验
   - 理解信令流程和状态管理
   - 掌握错误处理和调试技巧

2. **阶段 2（按兴趣选择）**：
   - 媒体流和 UI：静音/摄像头/屏幕共享
   - 数据传输：DataChannel 聊天
   - 录制功能：MediaRecorder

3. **阶段 3（进阶）**：多人通话
   - 从房间成员列表开始
   - 逐步实现 Mesh 多人通话

4. **阶段 4（可选）**：部署扩展
   - 仅在需要跨网络演示时考虑

### 学习资源

| 主题 | 推荐资源 |
|:-----|:---------|
| WebRTC 基础 | [MDN WebRTC API](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API) |
| 信令协议 | [WebRTC 信令详解](docs/signaling.md) |
| 架构设计 | [技术指南](docs/guide.md) |
| 完美协商 | [Perfect Negotiation](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Perfect_negotiation_and_imperfect_negotiation) |

---

## 🔮 未来规划

### 短期目标（v2.0）

- [ ] **TURN 自动配置**
  - 自动检测网络环境
  - 动态配置 ICE 服务器

- [ ] **HTTPS/WSS 自动化**
  - 集成 Let's Encrypt
  - 自动证书续期

### 中期目标（v3.0）

- [ ] **SFU 架构**
  - 替代 Mesh 模式
  - 支持大规模多人通话

- [ ] **端到端加密**
  - 实现 DTLS-SRTP
  - 增强安全性

### 长期目标（v4.0）

- [ ] **移动端支持**
  - React Native / Flutter SDK
  - 跨平台兼容

- [ ] **监控与分析**
  - WebRTC 统计信息收集
  - 性能监控面板

---

## 📊 进度统计

| 指标 | 数值 |
|:-----|:-----|
| 总任务数 | 32 |
| 已完成 | 32 |
| 进行中 | 0 |
| 待开始 | 0 |
| **完成率** | **100%** |

---

**最后更新**：2026-04-17
**维护者**：LessUp Team
