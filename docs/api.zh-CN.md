---
layout: docs
title: API 参考 — WebRTC
description: LessUp WebRTC 的端点与配置参考。
lang: zh-CN
---

# API 参考

## HTTP 端点

| 方法 | 路径 | 作用 |
|:-----|:-----|:-----|
| `GET` | `/` | 前端入口 |
| `GET` | `/config.js` | 注入运行时 RTC 配置 |
| `GET` | `/healthz` | 健康检查 |
| `GET` | `/ws` | 信令 WebSocket 升级 |

## 环境变量

| 变量 | 默认值 | 说明 |
|:-----|:-------|:-----|
| `ADDR` | `:8080` | HTTP 监听地址 |
| `WS_ALLOWED_ORIGINS` | 未设置时仅允许 localhost 语义 | 仅开发环境才应使用 `*` |
| `RTC_CONFIG_JSON` | 仅公共 STUN | 作为 JSON 注入到 `window.__APP_CONFIG__` |

## `config.js`

服务端会生成一段很小的 JavaScript：

```javascript
window.__APP_CONFIG__ = {
  rtcConfig: {
    iceServers: [...]
  }
};
```

前端再用 `web/src/config.js` 里的默认值与它合并。

## 信令消息结构

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

## 客户端入口

- 浏览器总入口：`web/src/core/app.js`
- 信令控制器：`web/src/controllers/signaling.js`
- 默认配置与能力检测：`web/src/config.js`

行为细节见 [信令协议](signaling.zh-CN)，代码布局见 [技术指南](guide.zh-CN)。
