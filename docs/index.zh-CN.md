---
layout: docs
title: 文档 — WebRTC
description: LessUp WebRTC 文档首页：架构、信令、部署、API、排障与 OpenSpec 规范导航。
lang: zh-CN
---

# 文档首页

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

## 按目标阅读

| 目标 | 对应页面 |
|:-----|:---------|
| 看懂代码结构 | [技术指南](guide.zh-CN) |
| 对接信令接口 | [API 参考](api.zh-CN) |
| 理解 WebSocket 消息流 | [信令协议](signaling.zh-CN) |
| 运行或部署项目 | [部署指南](deployment.zh-CN) |
| 排查常见问题 | [故障排查](troubleshooting.zh-CN) |
| 查看唯一事实来源规范 | [OpenSpec 导航](specs.zh-CN) |

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
