---
layout: default
title: WebRTC — 实时音视频通话示例
description: 基于 Go + WebRTC 的实时音视频示例项目，覆盖信令、媒体控制、多人 Mesh 通话、Docker 部署
---

<div class="hero-section">
  <h1 class="hero-title">📹 WebRTC</h1>
  <p class="hero-subtitle">基于 Go 的 WebRTC 实时音视频示例项目<br>从一对一通话到多人 Mesh 房间，覆盖 WebRTC 核心能力的学习与实践</p>
  
  <div class="hero-badges">
    <img src="https://github.com/LessUp/webrtc/actions/workflows/ci.yml/badge.svg" alt="Go CI" loading="lazy">
    <img src="https://github.com/LessUp/webrtc/actions/workflows/pages.yml/badge.svg" alt="Pages" loading="lazy">
    <img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT" loading="lazy">
    <img src="https://img.shields.io/badge/Go-1.22+-00ADD8?logo=go&logoColor=white" alt="Go" loading="lazy">
    <img src="https://img.shields.io/badge/WebRTC-Enabled-333333?logo=webrtc&logoColor=white" alt="WebRTC" loading="lazy">
    <img src="https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white" alt="Docker" loading="lazy">
  </div>
  
  <div class="hero-cta">
    <a href="#quick-start" class="btn btn-primary">🚀 快速开始</a>
    <a href="{{ site.baseurl }}/docs/" class="btn btn-secondary">📖 阅读文档</a>
    <a href="https://github.com/LessUp/webrtc" class="btn btn-secondary" target="_blank" rel="noopener">⭐ GitHub</a>
  </div>
</div>

---

## 功能全景

<div class="feature-grid">
  <div class="feature-card">
    <div class="feature-icon">🔌</div>
    <h3>WebSocket 信令</h3>
    <p>Gorilla WebSocket 实现房间内 Offer/Answer/ICE Candidate 转发，支持心跳保活机制</p>
  </div>
  
  <div class="feature-card">
    <div class="feature-icon">🎥</div>
    <h3>媒体控制</h3>
    <p>静音/取消静音、摄像头开关、屏幕共享（<code>getDisplayMedia</code>）</p>
  </div>
  
  <div class="feature-card">
    <div class="feature-icon">💬</div>
    <h3>DataChannel</h3>
    <p>点对点文本聊天，无需服务器中转，低延迟消息传递</p>
  </div>
  
  <div class="feature-card">
    <div class="feature-icon">🎬</div>
    <h3>本地录制</h3>
    <p>MediaRecorder 录制音视频流，导出 <code>.webm</code> 格式下载</p>
  </div>
  
  <div class="feature-card">
    <div class="feature-icon">👥</div>
    <h3>多人 Mesh</h3>
    <p>房间成员列表广播，多 PeerConnection 管理，网格视频布局</p>
  </div>
  
  <div class="feature-card">
    <div class="feature-icon">🐳</div>
    <h3>Docker 部署</h3>
    <p>多阶段 Dockerfile，Go 编译 + 静态前端打包，镜像体积最小化</p>
  </div>
</div>

## 开发路线图

| 阶段 | 能力 | 状态 |
|:-----|:-----|:----:|
| **阶段 1 — 基础通话** | 一对一通话、连接状态展示、错误处理、心跳保活 | <span class="status-badge status-done">已完成</span> |
| **阶段 2 — 媒体控制** | 静音/摄像头开关、屏幕共享、DataChannel 文本聊天、本地录制 | <span class="status-badge status-done">已完成</span> |
| **阶段 3 — 多人房间** | 房间成员列表、自动呼叫提示、小规模 Mesh 多人通话 | <span class="status-badge status-done">已完成</span> |
| **阶段 4 — 容器部署** | Docker 多阶段构建、环境变量配置 | <span class="status-badge status-done">已完成</span> |
| **计划中** | TURN 支持（coturn）、HTTPS/WSS 反向代理 | <span class="status-badge status-planning">规划中</span> |

## 架构总览

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

## <a name="quick-start"></a>快速开始

### 📋 环境要求

- Go 1.22+
- Chrome / Edge / Firefox (最新版)
- Docker (可选，用于部署)

### 🖥️ 本地运行

```bash
# 克隆仓库
git clone https://github.com/LessUp/webrtc.git
cd webrtc

# (可选) 国内代理
go env -w GOPROXY=https://goproxy.cn,direct

# 安装依赖并启动
go mod tidy
go run ./cmd/server

# 浏览器访问 http://localhost:8080
```

### 🐳 Docker 运行

```bash
# 构建镜像
docker build -t webrtc .

# 运行容器
docker run --rm -p 8080:8080 webrtc
```

### 📱 使用步骤

1. 打开两个浏览器窗口，访问 `http://localhost:8080`
2. 输入相同房间名并点击 **Join**
3. 点击左侧成员列表中的对端 ID（或手动输入），然后点击 **Call**
4. 允许摄像头/麦克风权限，即可看到远端视频
5. 通话建立后可进行文本聊天、屏幕共享与本地录制

<div class="callout callout-info">
  <div class="callout-title">💡 提示</div>
  <p>确保两个浏览器访问的是同一网络地址（或配置好 STUN/TURN 服务器），WebRTC P2P 才能成功建立连接。</p>
</div>

---

## 文档导航

<div class="doc-cards">
  <a href="{{ site.baseurl }}/docs/guide" class="doc-card">
    <span class="doc-icon">📚</span>
    <div class="doc-content">
      <h4>技术指南</h4>
      <p>项目整体架构、前端实现、媒体控制、录制等技术详解</p>
    </div>
    <span class="doc-arrow">→</span>
  </a>
  
  <a href="{{ site.baseurl }}/docs/signaling" class="doc-card">
    <span class="doc-icon">📡</span>
    <div class="doc-content">
      <h4>信令协议</h4>
      <p>信令与房间管理的深入讲解，含时序图与代码示例</p>
    </div>
    <span class="doc-arrow">→</span>
  </a>
  
  <a href="{{ site.baseurl }}/docs/deployment" class="doc-card">
    <span class="doc-icon">🚀</span>
    <div class="doc-content">
      <h4>部署指南</h4>
      <p>Docker 部署、HTTPS/WSS 配置、生产环境最佳实践</p>
    </div>
    <span class="doc-arrow">→</span>
  </a>
  
  <a href="{{ site.baseurl }}/docs/troubleshooting" class="doc-card">
    <span class="doc-icon">🔧</span>
    <div class="doc-content">
      <h4>故障排除</h4>
      <p>常见问题与解决方案，帮助快速定位和修复问题</p>
    </div>
    <span class="doc-arrow">→</span>
  </a>
  
  <a href="{{ site.baseurl }}/ROADMAP" class="doc-card">
    <span class="doc-icon">🗺️</span>
    <div class="doc-content">
      <h4>开发路线图</h4>
      <p>各阶段开发计划、功能规划和未来发展方向</p>
    </div>
    <span class="doc-arrow">→</span>
  </a>
  
  <a href="{{ site.baseurl }}/CONTRIBUTING" class="doc-card">
    <span class="doc-icon">🤝</span>
    <div class="doc-content">
      <h4>贡献指南</h4>
      <p>开发流程、代码规范、提交信息格式和 PR 流程</p>
    </div>
    <span class="doc-arrow">→</span>
  </a>
</div>

---

## 技术栈

| 类别 | 技术 |
|:-----|:-----|
| **后端** | Go 1.22+、net/http、Gorilla WebSocket |
| **前端** | HTML5 + Vanilla JavaScript + CSS3 |
| **媒体** | WebRTC（getUserMedia、RTCPeerConnection、DataChannel、MediaRecorder） |
| **容器** | Docker（multi-stage build） |
| **CI/CD** | GitHub Actions（Go 多版本测试 + staticcheck + GitHub Pages 部署） |

---

## 项目结构

```
webrtc/
├── cmd/server/          # HTTP + WebSocket 服务入口
├── internal/signal/     # 信令逻辑（Hub、Client、Message）
├── web/                 # 浏览器前端（HTML/JS/CSS）
├── docs/                # 技术文档
├── specs/               # 规范文档（产品/RFC/API/DB/测试）
├── changelog/           # 变更日志
├── deploy/              # 部署配置
└── Dockerfile           # 多阶段构建
```

---

## 开源协议

本项目基于 [MIT License](https://github.com/LessUp/webrtc/blob/main/LICENSE) 开源。

<div align="center" style="margin-top: 3rem; padding: 2rem; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 12px;">
  <p style="margin-bottom: 1rem;">觉得这个项目有帮助？</p>
  <a href="https://github.com/LessUp/webrtc" target="_blank" rel="noopener" style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.5rem; background: #24292e; color: white; text-decoration: none; border-radius: 6px; font-weight: 500;">
    ⭐ Star on GitHub
  </a>
  <p style="margin-top: 1rem; font-size: 0.9rem; color: #6c757d;">
    Made with ❤️ by <a href="https://github.com/LessUp">LessUp</a>
  </p>
</div>
