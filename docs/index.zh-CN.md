---
layout: docs
title: 文档 — WebRTC
description: LessUp WebRTC 文档首页：架构、信令、部署、API、排障与 OpenSpec 规范导航。
lang: zh-CN
---

# 文档首页

## 为什么选择 LessUp WebRTC？

| 特性 | 描述 |
|:-----|:-----|
| 🪶 **轻量级** | 仅一个 Go 依赖 (gorilla/websocket)，无重型框架 |
| ⚡ **零构建** | 原生 JavaScript ES6+，直接服务——无打包器、无转译器 |
| 📋 **OpenSpec 驱动** | 规范优先开发，结构化变更管理 |
| 🌐 **双语文档** | 完整的中英文文档 |
| 🔧 **生产就绪** | 包含 Docker、Kubernetes、Fly.io 部署配置 |

把这里当成公开文档的总入口即可。

## 从这里开始

<div class="doc-cards">
  <a href="{{ site.baseurl }}/docs/guide.zh-CN" class="doc-card">
    <span class="doc-icon">🧭</span>
    <div class="doc-content">
      <h4>技术指南</h4>
      <p>了解架构、模块边界，以及实际运行时结构。</p>
    </div>
    <span class="doc-arrow">→</span>
  </a>
  <a href="{{ site.baseurl }}/docs/signaling.zh-CN" class="doc-card">
    <span class="doc-icon">📡</span>
    <div class="doc-content">
      <h4>信令协议</h4>
      <p>加入房间、成员更新、消息转发与服务端约束。</p>
    </div>
    <span class="doc-arrow">→</span>
  </a>
  <a href="{{ site.baseurl }}/docs/deployment.zh-CN" class="doc-card">
    <span class="doc-icon">🚀</span>
    <div class="doc-content">
      <h4>部署指南</h4>
      <p>本地运行、Docker 使用，以及 TURN/WSS 要点。</p>
    </div>
    <span class="doc-arrow">→</span>
  </a>
  <a href="{{ site.baseurl }}/docs/specs.zh-CN" class="doc-card">
    <span class="doc-icon">📋</span>
    <div class="doc-content">
      <h4>OpenSpec 导航</h4>
      <p>查看主规范、change 工作流以及当前能力边界。</p>
    </div>
    <span class="doc-arrow">→</span>
  </a>
</div>

## 公开规范模型

仓库现在只把 `openspec/` 视为唯一规范权威来源。

- 主能力规范位于 `openspec/specs/`
- 实施工作位于 `openspec/changes/`
- 公开文档通过“规范导航”汇总展示，不再使用已经删除的旧 `/specs/` 目录

## 相关页面

- [README](../README.zh-CN.md)
- [贡献指南](../CONTRIBUTING.md)
- [路线图](../ROADMAP.md)
- [变更日志](../CHANGELOG.md)
