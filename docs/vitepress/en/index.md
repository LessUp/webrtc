---
layout: home
---

<div class="home-header">
  <div class="home-header-left">
    <div class="home-logo">📹</div>
    <div>
      <span class="home-title">LessUp WebRTC</span>
      <span class="home-subtitle">Go Signaling + Vanilla JS</span>
    </div>
  </div>
  <div class="home-nav">
    <a href="./guide">Guide</a>
    <a href="https://github.com/LessUp/webrtc">GitHub</a>
    <a href="../zh/">中文</a>
  </div>
</div>

<div class="home-intro-row">
  <div class="home-intro">
    A compact WebRTC demo focused on readable signaling, browser-side media features, OpenSpec-driven maintenance, and clear documentation. Built for developers who want a practical reference implementation.
  </div>
  <div class="home-stats">
    <span><strong>Go</strong> backend</span>
    <span><strong>Vanilla</strong> JS</span>
    <span><strong>50</strong> max/room</span>
  </div>
</div>

## Features

<div class="feature-map">
  <div class="feature-card">
    <div class="feature-card-title">🔌 Go Signaling Server</div>
    <div class="feature-card-desc">
      Room management, identity binding, origin validation, rate limiting, and health endpoints.
    </div>
    <div class="feature-tags">
      <a href="./signaling" class="feature-tag">Protocol</a>
      <a href="./api" class="feature-tag">API</a>
    </div>
  </div>

  <div class="feature-card">
    <div class="feature-card-title">🎥 Browser Media</div>
    <div class="feature-card-desc">
      Camera, microphone, screen share, recording, and peer-to-peer chat — all in vanilla JS.
    </div>
    <div class="feature-tags">
      <a href="./guide" class="feature-tag">Guide</a>
      <a href="./troubleshooting" class="feature-tag">Troubleshoot</a>
    </div>
  </div>

  <div class="feature-card">
    <div class="feature-card-title">🧩 No Framework</div>
    <div class="feature-card-desc">
      No frontend framework, no bundler. A small module graph rooted in web/src/core/app.js.
    </div>
    <div class="feature-tags">
      <a href="./guide" class="feature-tag">Architecture</a>
    </div>
  </div>

  <div class="feature-card">
    <div class="feature-card-title">📋 OpenSpec Workflow</div>
    <div class="feature-card-desc">
      Main specs, change proposals, and task-driven implementation live in openspec/.
    </div>
    <div class="feature-tags">
      <a href="./specs" class="feature-tag">OpenSpec</a>
    </div>
  </div>

  <div class="feature-card">
    <div class="feature-card-title">🐳 Docker Ready</div>
    <div class="feature-card-desc">
      Production ready with Docker, Kubernetes, and Fly.io support. TURN/WSS configuration included.
    </div>
    <div class="feature-tags">
      <a href="./deployment" class="feature-tag">Deploy</a>
    </div>
  </div>

  <div class="feature-card">
    <div class="feature-card-title">📝 MIT License</div>
    <div class="feature-card-desc">
      Open source, permissive license. Use it as a reference or starting point for your own project.
    </div>
    <div class="feature-tags">
      <a href="https://github.com/LessUp/webrtc" class="feature-tag">GitHub</a>
    </div>
  </div>
</div>

<div class="quick-start">
  <div class="quick-start-title">Quick Start</div>
  <div class="quick-start-content">
    <div class="command-block">
      <code>go run ./cmd/server</code>
    </div>
    Then open <code>http://localhost:8080</code> in your browser.
  </div>
</div>
