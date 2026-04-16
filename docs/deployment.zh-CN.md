---
layout: default
title: 部署指南 — WebRTC
description: 使用 Docker Compose 进行生产部署，包括 HTTPS 和 TURN 服务器
---

[← 返回首页]({{ site.baseurl }}/) | [文档索引](README.zh-CN.md)

# 部署指南

本文档介绍如何在生产环境中使用 Docker Compose 部署 WebRTC 项目，包括 HTTPS 和 TURN 服务器支持。

---

## 目录

- [快速开始](#快速开始)
- [架构说明](#架构说明)
- [Docker Compose 部署](#docker-compose-部署)
- [本地开发](#本地开发)
- [配置参考](#配置参考)
- [生产检查清单](#生产检查清单)
- [故障排查](#故障排查)

---

## 快速开始

一条命令部署所有服务：

```bash
# 克隆仓库
git clone https://github.com/LessUp/webrtc.git
cd webrtc

# 设置你的域名
export DOMAIN=your-domain.com

# 启动所有服务
docker compose up -d

# 查看日志
docker compose logs -f
```

访问 `https://your-domain.com` 开始使用！

---

## 架构说明

部署包含三个服务：

| 服务 | 作用 | 暴露端口 |
|:-----|:-----|:---------|
| **webrtc** | Go 信令服务 + 静态前端 | 8080（内部）|
| **caddy** | HTTPS 反向代理，自动 TLS | 80, 443 |
| **coturn** | TURN/STUN 服务器，NAT 穿透 | 3478, 5349 |

```
                    ┌─────────────┐
                    │    客户端    │
                    └──────┬──────┘
                           │ HTTPS (443)
                    ┌──────▼──────┐
                    │    Caddy    │ ← Let's Encrypt 自动证书
                    └──────┬──────┘
                           │ HTTP (8080)
                    ┌──────▼──────┐
                    │   webrtc    │ ← Go 服务 + 前端
                    └──────┬──────┘
                           │ WebSocket
                    ┌──────▼──────┐
                    │    coturn   │ ← TURN/STUN (3478)
                    └─────────────┘
```

---

## Docker Compose 部署

### 前置要求

- Docker 20.10+
- Docker Compose 2.0+
- 域名 DNS A 记录指向服务器 IP
- 防火墙开放端口 80, 443, 3478, 5349

### 第一步：配置环境

创建环境文件：

```bash
# .env 文件
DOMAIN=your-domain.com
WS_ALLOWED_ORIGINS=your-domain.com
RTC_CONFIG_JSON={"iceServers":[{"urls":"turn:your-domain.com:3478","username":"webrtc","credential":"your-secure-password"}]}
```

### 第二步：配置 TURN 服务器

复制并编辑 TURN 配置：

```bash
cp turnserver.conf.example turnserver.conf
```

编辑 `turnserver.conf`：

```conf
# TURN 服务器配置
listening-port=3478
listening-ip=0.0.0.0
relay-ip=YOUR_SERVER_IP
external-ip=YOUR_SERVER_IP/YOUR_SERVER_IP

# 认证配置
user=webrtc:your-secure-password
realm=your-domain.com

# 安全配置
no-cli
no-tlsv1
no-tlsv1_1
```

> ⚠️ **安全提示**: `turnserver.conf` 已加入 `.gitignore`，防止凭证泄露。

### 第三步：启动服务

```bash
# 启动所有服务
docker compose up -d

# 检查状态
docker compose ps

# 查看日志
docker compose logs -f

# 停止所有服务
docker compose down
```

### 第四步：验证部署

```bash
# 测试 HTTPS 端点
curl -I https://your-domain.com

# 测试健康检查
curl https://your-domain.com/healthz

# 测试 WebSocket（使用 wscat）
npm install -g wscat
wscat -c wss://your-domain.com/ws
```

---

## 本地开发

本地开发无需 HTTPS 或 TURN：

### 方案一：直接运行 Go

```bash
go run ./cmd/server
# 访问 http://localhost:8080
```

### 方案二：Docker（仅 webrtc）

```bash
docker compose up -d webrtc
# 访问 http://localhost:8080
```

### 热重载开发

```bash
# 安装 air（Go 热重载工具）
go install github.com/air-verse/air@latest

# 使用热重载运行
air
```

---

## 配置参考

### 环境变量

| 变量 | 服务 | 默认值 | 说明 |
|:-----|:-----|:-------|:-----|
| `DOMAIN` | caddy | `localhost` | 用于 HTTPS 证书的域名 |
| `ADDR` | webrtc | `:8080` | HTTP 监听地址 |
| `WS_ALLOWED_ORIGINS` | webrtc | `*` | WebSocket 允许的来源 |
| `RTC_CONFIG_JSON` | webrtc | 公共 STUN | ICE/TURN 服务器配置 |

### ICE/TURN 配置格式

`RTC_CONFIG_JSON` 变量接受符合 [RTCIceServer](https://developer.mozilla.org/en-US/docs/Web/API/RTCIceServer) 格式的 JSON 对象：

```json
{
  "iceServers": [
    {
      "urls": ["stun:stun.l.google.com:19302"]
    },
    {
      "urls": ["turn:turn.example.com:3478"],
      "username": "user",
      "credential": "pass"
    }
  ],
  "iceTransportPolicy": "all",
  "bundlePolicy": "balanced"
}
```

### 端口参考

| 端口 | 协议 | 服务 | 说明 |
|:-----|:-----|:-----|:-----|
| 80 | TCP | caddy | HTTP（自动跳转到 HTTPS）|
| 443 | TCP/UDP | caddy | HTTPS |
| 8080 | TCP | webrtc | 直接访问（调试用）|
| 3478 | TCP/UDP | coturn | TURN/STUN |
| 5349 | TCP/UDP | coturn | TURN/TLS |
| 10000-20000 | UDP | coturn | 中继端口（动态）|

---

## 生产检查清单

上线前请检查：

### 安全
- [ ] `WS_ALLOWED_ORIGINS` 限制为域名（不是 `*`）
- [ ] TURN 凭证强度足够且唯一
- [ ] `turnserver.conf` 在 `.gitignore` 中
- [ ] 防火墙规则限制不必要的端口
- [ ] 强制 HTTPS（Caddy 自动处理）

### 性能
- [ ] 测试预期并发用户数
- [ ] 服务器带宽充足（每个参与者约 1-2 Mbps）
- [ ] coturn 中继端口范围按规模配置
- [ ] 配置监控和告警

### 可靠性
- [ ] 健康检查端点响应正常
- [ ] 配置服务自动重启
- [ ] 日志轮转配置
- [ ] 持久化数据备份策略

### DNS 和 SSL
- [ ] 域名 DNS A 记录指向服务器 IP
- [ ] 端口 80 开放用于 Let's Encrypt 验证
- [ ] SSL 证书自动续期（Caddy 自动处理）

---

## 故障排查

### 问题：HTTPS 无法工作

**症状**: 浏览器显示"不安全"或无法连接

**解决方案**:
1. 检查 DNS 解析: `dig your-domain.com`
2. 验证端口 80 开放用于 Let's Encrypt
3. 查看 Caddy 日志: `docker compose logs caddy`
4. 确保 `DOMAIN` 环境变量设置正确

### 问题：WebSocket 连接失败

**症状**: 浏览器控制台显示"连接失败"

**解决方案**:
1. 检查 `WS_ALLOWED_ORIGINS` 包含你的域名
2. 验证防火墙允许端口 443
3. 查看 webrtc 日志: `docker compose logs webrtc`
4. 使用浏览器开发者工具 Network 标签测试

### 问题：通话无视频/音频

**症状**: 视频黑屏，没有声音

**解决方案**:
1. 检查浏览器摄像头/麦克风权限
2. 验证 TURN 服务器运行: `docker compose ps coturn`
3. 检查 TURN 凭证配置
4. 使用 [Trickle ICE](https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/) 测试 TURN 连接
5. 查看 coturn 日志: `docker compose logs coturn`

### 问题：CPU/内存使用率高

**症状**: 服务器无响应

**解决方案**:
1. 检查 goroutine 泄露: 查看 hub.go 清理顺序
2. 监控房间/客户端限制: 最大 1000 房间，50 客户端/房间
3. 检查浏览器内存泄露 (F12 → Memory 标签)
4. 大房间考虑使用 SFU 替代 Mesh

---

## 高级主题

### 负载均衡扩展

高可用性部署，多个 webrtc 实例：

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

> 注意: WebSocket 连接是有状态的，需要使用粘性会话或共享 Hub 后端。

### 外部 TURN 服务器

使用外部 TURN 服务（如 Twilio, Xirsys）：

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

## 相关文档

- [技术指南](guide.zh-CN.md) — 架构和实现
- [故障排查](troubleshooting.zh-CN.md) — 常见问题
- [API 参考](api.zh-CN.md) — 配置选项
