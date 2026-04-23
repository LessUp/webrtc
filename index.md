---
layout: default
title: LessUp WebRTC
description: A readable WebRTC demo with Go signaling, a vanilla JavaScript frontend, and an OpenSpec-driven repository workflow.
---

## A compact WebRTC project you can actually read

LessUp WebRTC is built for developers who want a practical reference implementation rather than a large product stack. It keeps the runtime simple and pushes repository rigor into specs, docs, and automation.

### What you get

<div class="feature-grid">
  <div class="feature-card">
    <div class="feature-icon">🔌</div>
    <h3>Go signaling server</h3>
    <p>Room management, identity binding, origin validation, rate limiting, and health endpoints.</p>
  </div>
  <div class="feature-card">
    <div class="feature-icon">🎥</div>
    <h3>Browser media features</h3>
    <p>Camera, microphone, screen share, recording, and peer-to-peer chat.</p>
  </div>
  <div class="feature-card">
    <div class="feature-icon">🧩</div>
    <h3>Vanilla JS modules</h3>
    <p>No frontend framework, no bundler, and a small module graph rooted in <code>web/src/core/app.js</code>.</p>
  </div>
  <div class="feature-card">
    <div class="feature-icon">📋</div>
    <h3>OpenSpec workflow</h3>
    <p>Main specs, change proposals, and task-driven implementation live in <code>openspec/</code>.</p>
  </div>
</div>

<a id="quick-start"></a>
## Quick Start

```bash
git clone https://github.com/LessUp/webrtc.git
cd webrtc
go run ./cmd/server
```

Then open `http://localhost:8080` in two browser windows and join the same room.

### Validation

```bash
make check
cd web && npm test
```

## Runtime shape

```text
cmd/server/main.go          HTTP server, /ws, /healthz, /config.js
internal/signal/            Hub, message handling, limits, tests
web/src/core/app.js         browser app entrypoint
web/src/controllers/        media, peers, signaling, stats, UI
openspec/specs/             repository source of truth
docs/                       public documentation and spec hub
```

## Explore the project

<div class="doc-cards">
  <a href="{{ site.baseurl }}/docs/" class="doc-card">
    <span class="doc-icon">📚</span>
    <div class="doc-content">
      <h4>Docs Home</h4>
      <p>Start with architecture, deployment, API, and troubleshooting.</p>
    </div>
    <span class="doc-arrow">→</span>
  </a>
  <a href="{{ site.baseurl }}/docs/specs" class="doc-card">
    <span class="doc-icon">📋</span>
    <div class="doc-content">
      <h4>OpenSpec Hub</h4>
      <p>See the current capability specs and how change work is structured.</p>
    </div>
    <span class="doc-arrow">→</span>
  </a>
  <a href="{{ site.baseurl }}/docs/deployment" class="doc-card">
    <span class="doc-icon">🚀</span>
    <div class="doc-content">
      <h4>Deployment Guide</h4>
      <p>Run locally, build with Docker, and configure TURN when needed.</p>
    </div>
    <span class="doc-arrow">→</span>
  </a>
  <a href="https://github.com/LessUp/webrtc" class="doc-card">
    <span class="doc-icon">⭐</span>
    <div class="doc-content">
      <h4>GitHub Repository</h4>
      <p>Source code, issues, workflows, and OpenSpec changes.</p>
    </div>
    <span class="doc-arrow">→</span>
  </a>
</div>

## Development model

This repository is maintained with a **closeout-style OpenSpec workflow**:

1. define or update behavior in `openspec/`
2. implement against the change tasks
3. run focused validation
4. review before merge

That keeps the code, docs, and public project surfaces aligned while the project stays intentionally small.
