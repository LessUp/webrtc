---
layout: home
---

<div class="home-header">
  <div class="home-header-left">
    <div class="home-logo">📹</div>
    <div>
      <span class="home-title">LessUp WebRTC</span>
      <span class="home-subtitle">Go 信令 + 原生 JavaScript</span>
    </div>
  </div>
  <div class="home-nav">
    <a href="./guide">技术指南</a>
    <a href="https://github.com/LessUp/webrtc">GitHub</a>
    <a href="../en/">English</a>
  </div>
</div>

<div class="home-intro-row">
  <div class="home-intro">
    一个紧凑的 WebRTC 演示项目，专注于可读的信令实现、浏览器端媒体功能、OpenSpec 驱动的维护流程，以及清晰的文档体验。
  </div>
  <div class="home-stats">
    <span><strong>Go</strong> 后端</span>
    <span><strong>原生</strong> JS</span>
    <span><strong>50</strong> 最大房间</span>
  </div>
</div>

## 核心特性

<div class="feature-map">
  <div class="feature-card">
    <div class="feature-card-title">🔌 Go 信令服务器</div>
    <div class="feature-card-desc">
      房间管理、身份绑定、来源校验、速率限制和健康检查都在这里。
    </div>
    <div class="feature-tags">
      <a href="./signaling" class="feature-tag">协议</a>
      <a href="./api" class="feature-tag">API</a>
    </div>
  </div>

  <div class="feature-card">
    <div class="feature-card-title">🎥 浏览器媒体</div>
    <div class="feature-card-desc">
      摄像头、麦克风、屏幕共享、录制和点对点聊天，全部使用原生 JS。
    </div>
    <div class="feature-tags">
      <a href="./guide" class="feature-tag">技术指南</a>
      <a href="./troubleshooting" class="feature-tag">故障排除</a>
    </div>
  </div>

  <div class="feature-card">
    <div class="feature-card-title">🧩 无框架依赖</div>
    <div class="feature-card-desc">
      不依赖前端框架，没有打包工具。以 web/src/core/app.js 为根的小型模块图。
    </div>
    <div class="feature-tags">
      <a href="./guide" class="feature-tag">架构</a>
    </div>
  </div>

  <div class="feature-card">
    <div class="feature-card-title">📋 OpenSpec 工作流</div>
    <div class="feature-card-desc">
      主规范、变更提案和实现任务统一放在 openspec/。
    </div>
    <div class="feature-tags">
      <a href="./specs" class="feature-tag">OpenSpec</a>
    </div>
  </div>

  <div class="feature-card">
    <div class="feature-card-title">🐳 Docker 就绪</div>
    <div class="feature-card-desc">
      生产就绪，支持 Docker、Kubernetes 和 Fly.io 部署。包含 TURN/WSS 配置。
    </div>
    <div class="feature-tags">
      <a href="./deployment" class="feature-tag">部署</a>
    </div>
  </div>

  <div class="feature-card">
    <div class="feature-card-title">📝 MIT 许可证</div>
    <div class="feature-card-desc">
      开源、宽松许可。作为参考或项目起点使用。
    </div>
    <div class="feature-tags">
      <a href="https://github.com/LessUp/webrtc" class="feature-tag">GitHub</a>
    </div>
  </div>
</div>

<div class="quick-start">
  <div class="quick-start-title">快速开始</div>
  <div class="quick-start-content">
    <div class="command-block">
      <code>go run ./cmd/server</code>
    </div>
    然后在浏览器打开 <code>http://localhost:8080</code>。
  </div>
</div>
