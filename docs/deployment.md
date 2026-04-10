---
layout: default
title: 部署指南 — WebRTC
description: 使用 Docker Compose 部署 WebRTC Demo（Caddy HTTPS + coturn TURN）
---

[← 返回首页]({{ site.baseurl }}/)

# 部署指南

本项目提供 `docker-compose.yml`，一键启动三个服务：

| 服务 | 作用 |
|:-----|:-----|
| **webrtc** | Go 信令服务 + 前端静态文件 |
| **caddy** | 反向代理，自动 HTTPS（Let's Encrypt） |
| **coturn** | TURN/STUN 服务器，NAT 穿透 |

---

## 快速启动

### 1. 配置 TURN（可选）

```bash
cp turnserver.conf.example turnserver.conf
# 编辑 turnserver.conf，修改 user=your_user:your_password
```

### 2. 配置 RTC_CONFIG_JSON

在 `docker-compose.yml` 中取消 `RTC_CONFIG_JSON` 的注释，填入你的 TURN 信息：

```yaml
environment:
  - RTC_CONFIG_JSON={"iceServers":[{"urls":"turn:YOUR_SERVER_IP:3478","username":"your_user","credential":"your_password"}]}
```

### 3. 启动

```bash
# 设置域名（用于 Caddy 自动签发证书）
export DOMAIN=your-domain.com

# 启动所有服务
docker compose up -d

# 查看日志
docker compose logs -f
```

访问 `https://your-domain.com` 即可使用。

---

## 仅本地测试（无需 HTTPS）

不需要 Caddy 和 TURN 时，可以直接运行 Go 服务：

```bash
go run ./cmd/server
# 浏览器访问 http://localhost:8080
```

或只启动 webrtc 服务：

```bash
docker compose up -d webrtc
# 浏览器访问 http://localhost:8080
```

---

## 服务说明

### Caddy（HTTPS 反向代理）

- 默认监听 80/443 端口
- 通过 `DOMAIN` 环境变量配置域名
- 未设置 `DOMAIN` 时默认 `localhost`（无自动证书）
- 需要公网域名 + DNS 解析才能自动签发 Let's Encrypt 证书

### coturn（TURN 服务器）

- 使用 `host` 网络模式，直接暴露 3478（UDP/TCP）和 5349（TLS）
- 配置文件：`turnserver.conf`（已在 `.gitignore` 中，不会提交凭证）
- 模板文件：`turnserver.conf.example`

### 环境变量

| 变量 | 服务 | 说明 | 默认值 |
|:-----|:-----|:-----|:-------|
| `DOMAIN` | caddy | Caddy 站点域名 | `localhost` |
| `WS_ALLOWED_ORIGINS` | webrtc | WebSocket 允许的来源 | `*` |
| `RTC_CONFIG_JSON` | webrtc | ICE/TURN 配置 JSON | 内置 STUN |

---

## 端口清单

| 端口 | 协议 | 服务 | 说明 |
|:-----|:-----|:-----|:-----|
| 80 | TCP | caddy | HTTP（自动跳转 HTTPS） |
| 443 | TCP/UDP | caddy | HTTPS |
| 8080 | TCP | webrtc | 直接访问（调试用） |
| 3478 | TCP/UDP | coturn | TURN/STUN |
| 5349 | TCP/UDP | coturn | TURN/TLS |
