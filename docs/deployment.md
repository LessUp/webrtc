---
layout: default
title: Deployment Guide — WebRTC
description: Production deployment with Docker Compose, HTTPS, and TURN server
---

[← Back to Home]({{ site.baseurl }}/) | [Documentation Index](README.md)

# Deployment Guide

This guide covers deploying the WebRTC project in production environments using Docker Compose with HTTPS and TURN server support.

---

## Table of Contents

- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Docker Compose Deployment](#docker-compose-deployment)
- [Local Development](#local-development)
- [Configuration Reference](#configuration-reference)
- [Production Checklist](#production-checklist)
- [Troubleshooting](#troubleshooting)

---

## Quick Start

Deploy all services with a single command:

```bash
# Clone repository
git clone https://github.com/LessUp/webrtc.git
cd webrtc

# Set your domain
export DOMAIN=your-domain.com

# Start all services
docker compose up -d

# View logs
docker compose logs -f
```

Visit `https://your-domain.com` and start calling!

---

## Architecture

The deployment consists of three services:

| Service | Purpose | Exposed Ports |
|:--------|:--------|:--------------|
| **webrtc** | Go signaling server + static frontend | 8080 (internal) |
| **caddy** | HTTPS reverse proxy with auto TLS | 80, 443 |
| **coturn** | TURN/STUN server for NAT traversal | 3478, 5349 |

```
                    ┌─────────────┐
                    │   Client    │
                    └──────┬──────┘
                           │ HTTPS (443)
                    ┌──────▼──────┐
                    │    Caddy    │ ← Let's Encrypt auto TLS
                    └──────┬──────┘
                           │ HTTP (8080)
                    ┌──────▼──────┐
                    │   webrtc    │ ← Go server + frontend
                    └──────┬──────┘
                           │ WebSocket
                    ┌──────▼──────┐
                    │    coturn   │ ← TURN/STUN (3478)
                    └─────────────┘
```

---

## Docker Compose Deployment

### Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- Domain name with DNS A record pointing to your server
- Ports 80, 443, 3478, 5349 open in firewall

### Step 1: Configure Environment

Create environment file:

```bash
# .env file
DOMAIN=your-domain.com
WS_ALLOWED_ORIGINS=your-domain.com
RTC_CONFIG_JSON={"iceServers":[{"urls":"turn:your-domain.com:3478","username":"webrtc","credential":"your-secure-password"}]}
```

### Step 2: Configure TURN Server

Copy and edit TURN configuration:

```bash
cp turnserver.conf.example turnserver.conf
```

Edit `turnserver.conf`:

```conf
# TURN server configuration
listening-port=3478
listening-ip=0.0.0.0
relay-ip=YOUR_SERVER_IP
external-ip=YOUR_SERVER_IP/YOUR_SERVER_IP

# Authentication
user=webrtc:your-secure-password
realm=your-domain.com

# Security
no-cli
no-tlsv1
no-tlsv1_1
```

> ⚠️ **Security Note**: `turnserver.conf` is in `.gitignore` to prevent credential leaks.

### Step 3: Launch Services

```bash
# Start all services
docker compose up -d

# Check status
docker compose ps

# View logs
docker compose logs -f

# Stop all services
docker compose down
```

### Step 4: Verify Deployment

```bash
# Test HTTPS endpoint
curl -I https://your-domain.com

# Test health check
curl https://your-domain.com/healthz

# Test WebSocket (using wscat)
npm install -g wscat
wscat -c wss://your-domain.com/ws
```

---

## Local Development

For local development without HTTPS or TURN:

### Option 1: Direct Go Run

```bash
go run ./cmd/server
# Open http://localhost:8080
```

### Option 2: Docker (webrtc only)

```bash
docker compose up -d webrtc
# Open http://localhost:8080
```

### Development with Hot Reload

```bash
# Install air (live reload for Go)
go install github.com/air-verse/air@latest

# Run with hot reload
air
```

---

## Configuration Reference

### Environment Variables

| Variable | Service | Default | Description |
|:---------|:--------|:--------|:------------|
| `DOMAIN` | caddy | `localhost` | Domain for HTTPS certificate |
| `ADDR` | webrtc | `:8080` | HTTP listen address |
| `WS_ALLOWED_ORIGINS` | webrtc | `*` | Allowed WebSocket origins |
| `RTC_CONFIG_JSON` | webrtc | Public STUN | ICE/TURN server configuration |

### ICE/TURN Configuration Format

```json
{
  "iceServers": [
    {
      "urls": ["stun:stun.l.google.com:19302"]
    },
    {
      "urls": ["turn:your-domain.com:3478"],
      "username": "webrtc",
      "credential": "your-password"
    }
  ]
}
```

### Port Reference

| Port | Protocol | Service | Purpose |
|:-----|:---------|:--------|:--------|
| 80 | TCP | caddy | HTTP (redirects to HTTPS) |
| 443 | TCP/UDP | caddy | HTTPS |
| 8080 | TCP | webrtc | Direct access (development) |
| 3478 | TCP/UDP | coturn | TURN/STUN |
| 5349 | TCP/UDP | coturn | TURN/TLS |
| 10000-20000 | UDP | coturn | Relay ports (dynamic) |

---

## Production Checklist

Before going live, verify:

### Security
- [ ] `WS_ALLOWED_ORIGINS` restricted to your domain (not `*`)
- [ ] TURN credentials are strong and unique
- [ ] `turnserver.conf` in `.gitignore`
- [ ] Firewall rules restrict unnecessary ports
- [ ] HTTPS enforced (Caddy auto-redirects HTTP)

### Performance
- [ ] Tested with expected concurrent user load
- [ ] Server has sufficient bandwidth (estimate 1-2 Mbps per participant)
- [ ] coturn relay ports range configured for your scale
- [ ] Monitoring and alerting configured

### Reliability
- [ ] Health check endpoint responding
- [ ] Automatic service restart configured
- [ ] Log rotation configured
- [ ] Backup strategy for any persistent data

### DNS & SSL
- [ ] Domain DNS A record points to server IP
- [ ] Port 80 open for Let's Encrypt verification
- [ ] SSL certificate auto-renews (Caddy handles this)

---

## Troubleshooting

### Issue: HTTPS not working

**Symptoms**: Browser shows "Not Secure" or can't connect

**Solutions**:
1. Check DNS propagation: `dig your-domain.com`
2. Verify port 80 is open for Let's Encrypt
3. Check Caddy logs: `docker compose logs caddy`
4. Ensure `DOMAIN` environment variable is set correctly

### Issue: WebSocket connection fails

**Symptoms**: "Connection failed" in browser console

**Solutions**:
1. Check `WS_ALLOWED_ORIGINS` includes your domain
2. Verify firewall allows port 443
3. Check webrtc logs: `docker compose logs webrtc`
4. Test with browser dev tools Network tab

### Issue: No video/audio in calls

**Symptoms**: Black video, no sound

**Solutions**:
1. Check browser camera/microphone permissions
2. Verify TURN server is running: `docker compose ps coturn`
3. Check TURN credentials in `RTC_CONFIG_JSON`
4. Test TURN connectivity with [Trickle ICE](https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/)
5. Check coturn logs: `docker compose logs coturn`

### Issue: High CPU/memory usage

**Symptoms**: Server becomes unresponsive

**Solutions**:
1. Check for goroutine leaks: Review hub.go cleanup sequence
2. Monitor room/client limits: Max 1000 rooms, 50 clients/room
3. Check for memory leaks in browser (F12 → Memory tab)
4. Consider using SFU instead of Mesh for large rooms

---

## Advanced Topics

### Scaling with Load Balancer

For high availability, deploy multiple webrtc instances behind a load balancer:

```yaml
# docker-compose.scale.yml
services:
  webrtc-1:
    build: .
    environment:
      - ADDR=:8080
  
  webrtc-2:
    build: .
    environment:
      - ADDR=:8080
  
  nginx:
    image: nginx:alpine
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    ports:
      - "8080:80"
```

> Note: WebSocket connections are stateful; use sticky sessions or shared hub backend.

### Custom TURN Server

If using external TURN server (e.g., Twilio, Xirsys):

```bash
export RTC_CONFIG_JSON='{
  "iceServers": [
    {
      "urls": "turn:global.turn.twilio.com:3478?transport=udp",
      "username": "your-twilio-username",
      "credential": "your-twilio-password"
    }
  ]
}'
```

---

## Related Documentation

- [Technical Guide](guide.md) — Architecture and implementation
- [Troubleshooting](troubleshooting.md) — Common issues
- [API Reference](api.md) — Configuration options
