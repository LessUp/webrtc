---
layout: default
title: Changelog — WebRTC
description: WebRTC version history and release notes - v1.0.0 production release with bilingual documentation
lang: zh-CN
---

[← Back to Home]({{ site.baseurl }}/) | [返回首页]({{ site.baseurl }}/)

# Changelog / 变更日志

All notable changes are documented in the [`changelog/`](changelog/) directory. This page provides a quick overview of the version history.

所有重要的变更都记录在 [`changelog/`](changelog/) 目录中。本文档提供版本历史的快速概览。

---

## Version Timeline / 版本时间线

<div class="timeline">
  <div class="timeline-item">
    <div class="timeline-date">2026-04-16</div>
    <h3 class="timeline-title"><a href="changelog/1.0.0.md">v1.0.0</a> <span class="status-badge status-done">当前版本</span></h3>
    <div class="timeline-content">
      🎉 生产版本发布，包含完整的中英文双语文档、GitHub Pages 站点优化和 v1.0 稳定 API。
    </div>
  </div>
  
  <div class="timeline-item">
    <div class="timeline-date">2026-02-13</div>
    <h3 class="timeline-title"><a href="changelog/0.9.0.md">v0.9.0</a></h3>
    <div class="timeline-content">
      重大重构，模块化架构，引入 Spec-Driven Development 方法论。
    </div>
  </div>
  
  <div class="timeline-item">
    <div class="timeline-date">2025-12-18</div>
    <h3 class="timeline-title"><a href="changelog/0.8.0.md">v0.8.0</a></h3>
    <div class="timeline-content">
      DataChannel 文本聊天、Mesh 多人通话、本地录制功能。
    </div>
  </div>
  
  <div class="timeline-item">
    <div class="timeline-date">2025-02-13</div>
    <h3 class="timeline-title"><a href="changelog/0.1.0.md">v0.1.0</a></h3>
    <div class="timeline-content">
      项目初始版本，基础信令服务、一对一通话功能。
    </div>
  </div>
</div>

---

## 变更分类

| 类别 | 前缀 | 说明 |
|:-----|:-----|:-----|
| **功能** | `feat:` | 新功能 |
| **修复** | `fix:` | Bug 修复 |
| **重构** | `refactor:` | 代码改进 |
| **文档** | `docs:` | 文档更新 |
| **测试** | `test:` | 测试添加/改进 |
| **构建** | `chore:` | 构建、CI、工具链 |
| **性能** | `perf:` | 性能优化 |
| **安全** | `security:` | 安全相关变更 |

---

## 版本规范

本项目遵循 [语义化版本控制](https://semver.org/lang/zh-CN/)（Semantic Versioning）：

- **`MAJOR`** — 不兼容的 API 修改
- **`MINOR`** — 向后兼容的功能新增
- **`PATCH`** — 向后兼容的问题修复

---

## 查看完整变更

<div class="doc-cards">
  <a href="changelog/1.0.0.md" class="doc-card">
    <span class="doc-icon">🎉</span>
    <div class="doc-content">
      <h4>v1.0.0</h4>
      <p>2026-04-16 — 生产版本，双语文档</p>
    </div>
    <span class="doc-arrow">→</span>
  </a>
  
  <a href="changelog/0.9.0.md" class="doc-card">
    <span class="doc-icon">🏗️</span>
    <div class="doc-content">
      <h4>v0.9.0</h4>
      <p>2026-02-13 — 模块化架构重构</p>
    </div>
    <span class="doc-arrow">→</span>
  </a>
  
  <a href="changelog/0.8.0.md" class="doc-card">
    <span class="doc-icon">💬</span>
    <div class="doc-content">
      <h4>v0.8.0</h4>
      <p>2025-12-18 — DataChannel + Mesh 通话</p>
    </div>
    <span class="doc-arrow">→</span>
  </a>
  
  <a href="changelog/0.1.0.md" class="doc-card">
    <span class="doc-icon">🚀</span>
    <div class="doc-content">
      <h4>v0.1.0</h4>
      <p>2025-02-13 — 项目初始版本</p>
    </div>
    <span class="doc-arrow">→</span>
  </a>
</div>

---

<div class="callout callout-info">
  <div class="callout-title">📋 变更日志格式</div>
  <p>每个版本的详细变更遵循 <a href="https://keepachangelog.com/zh-CN/1.1.0/">Keep a Changelog</a> 格式规范，按变更类型分组：新增、变更、弃用、移除、修复、安全。</p>
</div>
