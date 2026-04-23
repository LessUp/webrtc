---
layout: docs
title: Deployment Guide — WebRTC
description: Local and Docker deployment guidance for LessUp WebRTC.
---

# Deployment Guide

## Local run

```bash
go run ./cmd/server
```

Visit `http://localhost:8080`.

## Docker image

```bash
docker build -f deploy/docker/Dockerfile -t webrtc .
docker run --rm -p 8080:8080 webrtc
```

## Compose stack

The repository includes deployment assets under `deploy/docker/` for:

- the Go app
- Caddy as the HTTPS reverse proxy
- coturn for TURN/STUN support

## Environment you will usually set

```bash
export ADDR=:8080
export WS_ALLOWED_ORIGINS=example.com
export RTC_CONFIG_JSON='{"iceServers":[{"urls":["stun:stun.l.google.com:19302"]}]}'
```

## TURN and WSS notes

- local development can work without TURN
- cross-network calls often need TURN
- production signaling should run over `wss://`
- never commit TURN credentials to the repository

## Related files

- `deploy/docker/Dockerfile`
- `deploy/docker/docker-compose.yml`
- `deploy/web/Caddyfile`
- `deploy/turnserver.conf.example`
