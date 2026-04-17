---
layout: default
title: Documentation — WebRTC
description: Complete documentation for WebRTC learning platform
---

[← Back to Home]({{ site.baseurl }}/)

# WebRTC Documentation

Welcome to the WebRTC project documentation. This project follows **Spec-Driven Development (SDD)**.

---

## Table of Contents

- [Documentation Home](index.md) — 文档索引（中文）
- [Quick Navigation](#quick-navigation)
- [Specifications (Single Source of Truth)](#specifications-single-source-of-truth)
- [User & Developer Guides](#user--developer-guides)
- [Language Selection](#language-selection)
- [External Resources](#external-resources)

---

## Quick Navigation

<div class="doc-cards">
  <a href="guide.md" class="doc-card">
    <span class="doc-icon">🚀</span>
    <div class="doc-content">
      <h4>Getting Started</h4>
      <p>Quick start guide with architecture overview and implementation details</p>
    </div>
    <span class="doc-arrow">→</span>
  </a>
  
  <a href="signaling.md" class="doc-card">
    <span class="doc-icon">📡</span>
    <div class="doc-content">
      <h4>Signaling Protocol</h4>
      <p>WebSocket message formats, room management, and heartbeat mechanism</p>
    </div>
    <span class="doc-arrow">→</span>
  </a>
  
  <a href="deployment.md" class="doc-card">
    <span class="doc-icon">🌐</span>
    <div class="doc-content">
      <h4>Deployment Guide</h4>
      <p>Docker deployment, HTTPS/WSS setup, and production best practices</p>
    </div>
    <span class="doc-arrow">→</span>
  </a>
  
  <a href="troubleshooting.md" class="doc-card">
    <span class="doc-icon">🔍</span>
    <div class="doc-content">
      <h4>Troubleshooting</h4>
      <p>Common issues and solutions for connection, media, and deployment problems</p>
    </div>
    <span class="doc-arrow">→</span>
  </a>
  
  <a href="api.md" class="doc-card">
    <span class="doc-icon">⚙️</span>
    <div class="doc-content">
      <h4>API Reference</h4>
      <p>Environment variables, configuration options, and endpoints</p>
    </div>
    <span class="doc-arrow">→</span>
  </a>
</div>

---

## Specifications (Single Source of Truth)

The `/specs` directory is the authoritative source. **Specs drive all development.**

| Spec | Description |
|:-----|:------------|
| **[Product Spec](../specs/product/webrtc-platform.md)** | Feature definitions and acceptance criteria |
| **[RFC-0001](../specs/rfc/0001-signaling-server.md)** | Signaling server architecture |
| **[RFC-0002](../specs/rfc/0002-frontend-architecture.md)** | Frontend architecture and module design |
| **[API Spec](../specs/api/signaling.yaml)** | OpenAPI 3.0 signaling specification |
| **[DB Schema](../specs/db/schema.md)** | In-memory data structures |
| **[Testing Spec](../specs/testing/testing-spec.feature)** | BDD test specifications |

---

## User & Developer Guides

Complete documentation available in English and 简体中文.

### Getting Started

| Document | EN | ZH | Description |
|:---------|:--:|:--:|:------------|
| **Guide** | [English](guide.md) | [中文](guide.zh-CN.md) | Architecture, implementation details, code walkthrough |
| **Deployment** | [English](deployment.md) | [中文](deployment.zh-CN.md) | Docker, HTTPS/TURN setup, production deployment |

### Reference

| Document | EN | ZH | Description |
|:---------|:--:|:--:|:------------|
| **Signaling Protocol** | [English](signaling.md) | [中文](signaling.zh-CN.md) | WebSocket protocol and message specifications |
| **API Reference** | [English](api.md) | [中文](api.zh-CN.md) | Configuration options, environment variables, endpoints |

### Troubleshooting

| Document | EN | ZH | Description |
|:---------|:--:|:--:|:------------|
| **Troubleshooting** | [English](troubleshooting.md) | [中文](troubleshooting.zh-CN.md) | Common issues and solutions |

---

## Language Selection

This documentation is available in multiple languages:

- 📘 **[English](guide.md)** (Current) — English documentation
- 📗 **[简体中文](guide.zh-CN.md)** — Chinese (Simplified)

---

## External Resources

| Resource | Link | Description |
|:---------|:-----|:------------|
| GitHub Repository | [LessUp/webrtc](https://github.com/LessUp/webrtc) | Source code |
| Changelog | [CHANGELOG.md](../CHANGELOG.md) | Version history |
| Contributing | [CONTRIBUTING.md](../CONTRIBUTING.md) | Development workflow |
| Roadmap | [ROADMAP.md](../ROADMAP.md) | Future plans |

---

## Need Help?

- **Found a bug?** [Open an issue](https://github.com/LessUp/webrtc/issues)
- **Have a question?** Check the [Troubleshooting Guide](troubleshooting.md)
- **Want to contribute?** See [Contributing Guidelines](../CONTRIBUTING.md)

---

<div style="text-align: center; margin-top: 2rem; color: #6c757d; font-size: 0.9rem;">
  <strong>Last Updated</strong>: 2026-04-17 | <strong>Version</strong>: v1.0.0
</div>
