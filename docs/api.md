---
layout: docs
title: API Reference — WebRTC
description: Endpoint and configuration reference for LessUp WebRTC.
---

# API Reference

## HTTP endpoints

| Method | Path | Purpose |
|:-------|:-----|:--------|
| `GET` | `/` | frontend entry |
| `GET` | `/config.js` | runtime RTC config injection |
| `GET` | `/healthz` | health check |
| `GET` | `/ws` | signaling socket upgrade |

## Environment variables

| Variable | Default | Notes |
|:---------|:--------|:------|
| `ADDR` | `:8080` | HTTP listen address |
| `WS_ALLOWED_ORIGINS` | localhost-only behavior when unset | set `*` only for development |
| `RTC_CONFIG_JSON` | public STUN only | JSON injected into `window.__APP_CONFIG__` |

## `config.js`

The server generates a small JavaScript payload:

```javascript
window.__APP_CONFIG__ = {
  rtcConfig: {
    iceServers: [...]
  }
};
```

The frontend merges that config with the default fallback in `web/src/config.js`.

## Signaling message envelope

```go
type Message struct {
    Type      string          `json:"type"`
    Room      string          `json:"room"`
    From      string          `json:"from"`
    To        string          `json:"to,omitempty"`
    SDP       json.RawMessage `json:"sdp,omitempty"`
    Candidate json.RawMessage `json:"candidate,omitempty"`
    Members   []string        `json:"members,omitempty"`
    Code      string          `json:"code,omitempty"`
    Error     string          `json:"error,omitempty"`
}
```

## Client-side entrypoints

- browser assembly: `web/src/core/app.js`
- signaling client: `web/src/controllers/signaling.js`
- defaults and capability checks: `web/src/config.js`

See [Signaling Protocol](signaling) for behavior and [Technical Guide](guide) for code layout.
