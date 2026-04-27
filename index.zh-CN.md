---
layout: default
title: LessUp WebRTC
description: 一个采用 Go 信令服务、原生 JavaScript 前端和 OpenSpec 工作流的可读型 WebRTC 项目。
lang: zh-CN
---

## 一个真正能看懂的 WebRTC 小项目

LessUp WebRTC 更像是一份可读的参考实现，而不是堆满框架和基础设施的大型产品。运行时保持克制，仓库治理则交给规范、文档和自动化来兜底。

### 你能得到什么

<div class="feature-grid">
  <div class="feature-card">
    <div class="feature-icon">🔌</div>
    <h3>Go 信令服务</h3>
    <p>房间管理、身份绑定、来源校验、速率限制和健康检查都在这里。</p>
  </div>
  <div class="feature-card">
    <div class="feature-icon">🎥</div>
    <h3>浏览器媒体能力</h3>
    <p>摄像头、麦克风、屏幕共享、录制和点对点聊天。</p>
  </div>
  <div class="feature-card">
    <div class="feature-icon">🧩</div>
    <h3>原生 JS 模块</h3>
    <p>不依赖前端框架，也没有打包器，入口就是 <code>web/src/core/app.js</code>。</p>
  </div>
  <div class="feature-card">
    <div class="feature-icon">📋</div>
    <h3>OpenSpec 工作流</h3>
    <p>主规范、变更提案和实现任务统一放在 <code>openspec/</code>。</p>
  </div>
</div>

## 继续浏览

<div class="doc-cards">
  <a href="{{ site.baseurl }}/docs/index.zh-CN" class="doc-card">
    <span class="doc-icon">📚</span>
    <div class="doc-content">
      <h4>文档首页</h4>
      <p>从架构、部署、API 和排障入口开始。</p>
    </div>
    <span class="doc-arrow">→</span>
  </a>
  <a href="{{ site.baseurl }}/docs/specs.zh-CN" class="doc-card">
    <span class="doc-icon">📋</span>
    <div class="doc-content">
      <h4>OpenSpec 导航</h4>
      <p>查看当前能力规范，以及仓库如何组织 change 工作流。</p>
    </div>
    <span class="doc-arrow">→</span>
  </a>
  <a href="{{ site.baseurl }}/docs/deployment.zh-CN" class="doc-card">
    <span class="doc-icon">🚀</span>
    <div class="doc-content">
      <h4>部署指南</h4>
      <p>本地运行、Docker 构建，以及需要时如何接入 TURN。</p>
    </div>
    <span class="doc-arrow">→</span>
  </a>
  <a href="https://github.com/LessUp/webrtc" class="doc-card">
    <span class="doc-icon">⭐</span>
    <div class="doc-content">
      <h4>GitHub 仓库</h4>
      <p>源码、Issues、工作流和 OpenSpec changes 都在这里。</p>
    </div>
    <span class="doc-arrow">→</span>
  </a>
</div>

## 开发模型

这个仓库采用偏“收尾治理型”的 **OpenSpec 工作流**：

1. 先在 `openspec/` 中定义或更新行为
2. 按 change 里的任务实现
3. 做聚焦校验
4. 合并前完成 review

这样可以在保持项目体量克制的同时，让代码、文档和公开呈现始终一致。
