---
layout: docs
title: 部署指南 — WebRTC
description: LessUp WebRTC 的本地与 Docker 部署说明。
lang: zh-CN
---

# 部署指南

## 本地运行

```bash
go run ./cmd/server
```

然后访问 `http://localhost:8080`。

## Docker 镜像

```bash
docker build -f deploy/docker/Dockerfile -t webrtc .
docker run --rm -p 8080:8080 webrtc
```

## Compose 组合部署

仓库在 `deploy/docker/` 下提供了以下部署资源：

- Go 应用
- Caddy 反向代理与 HTTPS
- coturn 用于 TURN/STUN

## 常用环境变量

```bash
export ADDR=:8080
export WS_ALLOWED_ORIGINS=example.com
export RTC_CONFIG_JSON='{"iceServers":[{"urls":["stun:stun.l.google.com:19302"]}]}'
```

## TURN 与 WSS 说明

- 本地开发通常不需要 TURN
- 跨公网网络连接通常需要 TURN
- 生产环境信令应通过 `wss://` 提供
- TURN 凭证不要提交到仓库

## 相关文件

- `deploy/docker/Dockerfile`
- `deploy/docker/docker-compose.yml`
- `deploy/web/Caddyfile`
- `deploy/turnserver.conf.example`
