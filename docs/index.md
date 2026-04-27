---
layout: docs
title: Documentation — WebRTC
description: Documentation hub for LessUp WebRTC: architecture, signaling, deployment, API, troubleshooting, and OpenSpec.
---

# Documentation

<div class="github-cta" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 24px; margin-bottom: 32px; color: white; text-align: center;">
  <h3 style="margin: 0 0 8px 0; color: white;">⭐ Like this project?</h3>
  <p style="margin: 0 0 16px 0; opacity: 0.9;">Star us on GitHub to show your support!</p>
  <a href="https://github.com/LessUp/webrtc" class="github-button" style="display: inline-block; background: white; color: #333; padding: 10px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">View on GitHub</a>
</div>

## Why LessUp WebRTC?

| Feature | Description |
|:--------|:------------|
| 🪶 **Lightweight** | Single Go dependency (gorilla/websocket), no heavy frameworks |
| ⚡ **Zero Build** | Vanilla JavaScript ES6+, served directly—no bundlers, no transpilers |
| 📋 **OpenSpec-Driven** | Spec-first development with structured change management |
| 🌐 **Bilingual Docs** | Complete documentation in English and Chinese |
| 🔧 **Production-Ready** | Docker, Kubernetes, and Fly.io deployment configs included |

Use this page as the public entrypoint for understanding the project.

## Start here

<div class="doc-cards">
  <a href="{{ site.baseurl }}/docs/guide" class="doc-card">
    <span class="doc-icon">🧭</span>
    <div class="doc-content">
      <h4>Technical Guide</h4>
      <p>Architecture, module boundaries, and the actual runtime shape.</p>
    </div>
    <span class="doc-arrow">→</span>
  </a>
  <a href="{{ site.baseurl }}/docs/signaling" class="doc-card">
    <span class="doc-icon">📡</span>
    <div class="doc-content">
      <h4>Signaling Protocol</h4>
      <p>Join flow, room updates, relay rules, and server guarantees.</p>
    </div>
    <span class="doc-arrow">→</span>
  </a>
  <a href="{{ site.baseurl }}/docs/deployment" class="doc-card">
    <span class="doc-icon">🚀</span>
    <div class="doc-content">
      <h4>Deployment</h4>
      <p>Local run, Docker usage, and TURN/WSS considerations.</p>
    </div>
    <span class="doc-arrow">→</span>
  </a>
  <a href="{{ site.baseurl }}/docs/specs" class="doc-card">
    <span class="doc-icon">📋</span>
    <div class="doc-content">
      <h4>OpenSpec Hub</h4>
      <p>Main capabilities, change workflow, and links to the current specs.</p>
    </div>
    <span class="doc-arrow">→</span>
  </a>
</div>

## Read by goal

| Goal | Best page |
|:-----|:----------|
| Understand the code layout | [Technical Guide](guide) |
| Integrate with the signaling server | [API Reference](api) |
| Understand WebSocket message flow | [Signaling Protocol](signaling) |
| Run or deploy the project | [Deployment Guide](deployment) |
| Diagnose common setup issues | [Troubleshooting](troubleshooting) |
| See the source-of-truth specs | [OpenSpec Hub](specs) |

## Public spec model

The repository now treats `openspec/` as the only specification authority.

- main capability specs live in `openspec/specs/`
- implementation work lives in `openspec/changes/`
- public docs link to a curated spec hub instead of the deleted legacy `/specs/` tree

## Related pages

- [README](../README.md)
- [Contributing](../CONTRIBUTING.md)
- [Roadmap](../ROADMAP.md)
- [Changelog](../CHANGELOG.md)
