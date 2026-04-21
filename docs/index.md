---
layout: default
title: Documentation — WebRTC
description: Complete documentation for WebRTC learning platform - technical guides, signaling protocol, deployment, troubleshooting
---

<div class="hero-section" style="padding: 2rem 1rem;">
  <h1 class="hero-title" style="font-size: 2rem;">📖 Documentation</h1>
  <p class="hero-subtitle">
    <span>Complete technical documentation for WebRTC platform</span><br>
    <span style="font-size: 0.9rem; color: var(--color-text-light);">WebRTC 项目完整技术文档</span>
  </p>
</div>

---

## Quick Navigation

<div class="doc-cards">
  <a href="{{ site.baseurl }}/docs/guide" class="doc-card">
    <span class="doc-icon">🚀</span>
    <div class="doc-content">
      <h4>Getting Started</h4>
      <p>Prerequisites, local development, Docker deployment</p>
    </div>
    <span class="doc-arrow">→</span>
  </a>
  
  <a href="{{ site.baseurl }}/docs/signaling" class="doc-card">
    <span class="doc-icon">📡</span>
    <div class="doc-content">
      <h4>Signaling Protocol</h4>
      <p>WebSocket message formats, room management, heartbeat mechanism</p>
    </div>
    <span class="doc-arrow">→</span>
  </a>
  
  <a href="{{ site.baseurl }}/docs/deployment" class="doc-card">
    <span class="doc-icon">🌐</span>
    <div class="doc-content">
      <h4>Deployment Guide</h4>
      <p>HTTPS/WSS, TURN server, performance optimization</p>
    </div>
    <span class="doc-arrow">→</span>
  </a>
  
  <a href="{{ site.baseurl }}/docs/troubleshooting" class="doc-card">
    <span class="doc-icon">🔍</span>
    <div class="doc-content">
      <h4>Troubleshooting</h4>
      <p>Connection issues, media problems, deployment solutions</p>
    </div>
    <span class="doc-arrow">→</span>
  </a>
  
  <a href="{{ site.baseurl }}/docs/api" class="doc-card">
    <span class="doc-icon">⚙️</span>
    <div class="doc-content">
      <h4>API Reference</h4>
      <p>Environment variables, ports, ICE server configuration</p>
    </div>
    <span class="doc-arrow">→</span>
  </a>
</div>

---

## Documentation Structure

This project follows **Spec-Driven Development (SDD)**. All implementation is driven by specifications.

### User & Developer Guides

| Document | EN | ZH | Description |
|:---------|:--:|:--:|:------------|
| **Guide** | [English](guide.md) | [中文](guide.zh-CN.md) | Architecture, implementation details, code walkthrough |
| **Deployment** | [English](deployment.md) | [中文](deployment.zh-CN.md) | Docker, HTTPS/TURN setup, production deployment |
| **Signaling** | [English](signaling.md) | [中文](signaling.zh-CN.md) | WebSocket protocol and message specifications |
| **API Reference** | [English](api.md) | [中文](api.zh-CN.md) | Configuration options, environment variables, endpoints |
| **Troubleshooting** | [English](troubleshooting.md) | [中文](troubleshooting.zh-CN.md) | Common issues and solutions |

### Specification Documents (Single Source of Truth)

The `/specs` directory is the authoritative source. **Specs drive all development.**

| Spec | Path | Description |
|:-----|:-----|:------------|
| **Product Spec** | [`/specs/product/`](../specs/product/) | Feature definitions and acceptance criteria |
| **RFC Documents** | [`/specs/rfc/`](../specs/rfc/) | Technical design and architecture decisions |
| **API Spec** | [`/specs/api/`](../specs/api/) | OpenAPI 3.0 signaling specification |
| **Database Spec** | [`/specs/db/`](../specs/db/) | In-memory data structure definitions |
| **Testing Spec** | [`/specs/testing/`](../specs/testing/) | BDD test specifications and acceptance criteria |

---

## Learning Paths

### 🔰 Beginners

If you're new to WebRTC, we recommend reading in this order:

1. **[Getting Started](guide.md#quick-start)** — Get the project running
2. **[Signaling Protocol Overview](signaling.md#overview)** — Understand how browsers establish connections
3. **[Frontend State Machine](guide.md#frontend-state-machine)** — Understand client connection state management

### 🛠️ Developers

If you want to extend or modify the project:

1. **[Architecture Overview](guide.md#architecture-overview)** — Overall system architecture
2. **[RFC-0001: Signaling Server](../specs/rfc/0001-signaling-server.md)** — Server design decisions
3. **[RFC-0002: Frontend Architecture](../specs/rfc/0002-frontend-architecture.md)** — Client module design
4. **[Product Spec](../specs/product/webrtc-platform.md)** — Feature definitions and acceptance criteria

### 🏭 DevOps Engineers

If you need to deploy to production:

1. **[Deployment Guide](deployment.md)** — Docker deployment and configuration
2. **[API Configuration Reference](api.md#configuration)** — All environment variables
3. **[Troubleshooting](troubleshooting.md)** — Common deployment issues

---

## Resources

### External Links

| Resource | Link | Description |
|:---------|:-----|:------------|
| GitHub Repository | [LessUp/webrtc](https://github.com/LessUp/webrtc) | Source code, Issues, PRs |
| Changelog | [CHANGELOG.md](../CHANGELOG.md) | Version history and release notes |
| Contributing | [CONTRIBUTING.md](../CONTRIBUTING.md) | Development workflow and guidelines |
| Roadmap | [ROADMAP.md](../ROADMAP.md) | Future development plans |

### WebRTC Learning Resources

- [MDN - WebRTC API](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- [WebRTC Official Documentation](https://webrtc.org/getting-started/overview)
- [WebRTC for the Curious](https://webrtcforthecurious.com/)

---

<div class="callout callout-info">
  <div class="callout-title">💡 Need Help?</div>
  <ul style="margin-bottom: 0;">
    <li><strong>Found a bug?</strong> Open an issue on <a href="https://github.com/LessUp/webrtc/issues">GitHub Issues</a></li>
    <li><strong>Have a feature request?</strong> Check the <a href="../ROADMAP.md">Roadmap</a> or submit a Feature Request</li>
    <li><strong>Want to contribute?</strong> Read the <a href="../CONTRIBUTING.md">Contributing Guidelines</a></li>
  </ul>
</div>

---

<div style="text-align: center; margin-top: 2rem; color: var(--color-text-light); font-size: 0.9rem;">
  <strong>Last Updated / 最后更新</strong>: 2026-04-22 | <strong>Version / 版本</strong>: v1.0.0
</div>
