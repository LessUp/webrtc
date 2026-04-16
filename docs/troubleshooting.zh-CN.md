---
layout: default
title: 故障排查 — WebRTC
description: WebRTC 部署和使用的常见问题及解决方案
---

[← 返回首页]({{ site.baseurl }}/) | [文档索引](README.zh-CN.md)

# 故障排查指南

WebRTC 项目的常见问题及解决方案。

---

## 目录

- [连接问题](#连接问题)
- [媒体问题](#媒体问题)
- [部署问题](#部署问题)
- [性能问题](#性能问题)
- [浏览器兼容性](#浏览器兼容性)
- [获取帮助](#获取帮助)

---

## 连接问题

### WebSocket 连接失败

**症状**: 浏览器控制台显示"连接失败"或"WebSocket 错误"

**可能原因及解决方案**：

#### 1. 来源不允许

检查浏览器控制台：
```
WebSocket connection to 'wss://...' failed
```

验证 `WS_ALLOWED_ORIGINS` 包含你的域名：

```bash
# 检查当前配置
docker compose exec webrtc env | grep WS_ALLOWED_ORIGINS

# 在 docker-compose.yml 中修复
environment:
  - WS_ALLOWED_ORIGINS=yourdomain.com,www.yourdomain.com
```

#### 2. 防火墙阻止

检查服务器防火墙：

```bash
# 检查开放端口
sudo netstat -tlnp | grep -E '8080|443|80'

# 允许端口（Ubuntu/Debian with UFW）
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3478/tcp
sudo ufw allow 3478/udp
```

#### 3. SSL 证书问题

如果使用 HTTPS，检查证书：

```bash
# 测试 SSL 连接
curl -v https://yourdomain.com/healthz

# 检查 Caddy 日志
docker compose logs caddy | tail -50
```

### "无法加入房间"

**症状**: 加入按钮无响应，不显示错误

**解决方案**：

1. **检查客户端 ID**: 必须非空且唯一
2. **检查房间名**: 必须非空
3. **检查限制**: 最多每房间 50 客户端，最多 1000 房间
4. **检查日志**：
   ```bash
   docker compose logs webrtc | grep -E "error|Error|join"
   ```

### "目标未找到"

**症状**: 通话按钮显示"目标未找到"错误

**解决方案**：

1. 验证目标用户仍在房间中（检查成员列表）
2. 两个用户必须在同一个房间
3. 目标用户 ID 必须与成员列表中显示的完全一致

---

## 媒体问题

### 无视频 / 黑屏

**症状**: 远程视频元素黑屏或显示占位符

**检查清单**：

1. **摄像头权限**
   - 检查浏览器地址栏中的权限图标
   - 验证摄像头在其他网站工作（如 [Webcam Test](https://webcamtests.com/)）

2. **ICE 连接状态**
   ```javascript
   // 打开浏览器控制台检查
   peer.pc.iceConnectionState  // 应为 "connected"
   peer.pc.connectionState     // 应为 "connected"
   ```

3. **TURN 服务器问题**
   - 使用 [Trickle ICE](https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/) 测试
   - 添加 TURN 服务器并检查 relay candidates
   - 验证服务器配置中的 TURN 凭证

4. **防火墙 / NAT**
   ```bash
   # 检查 TURN 端口是否开放
   nc -zv yourdomain.com 3478
   nc -zv -u yourdomain.com 3478
   ```

### 无音频

**症状**: 视频正常但没有声音

**解决方案**：

1. **检查静音状态**
   ```javascript
   // 浏览器控制台
   state.muted           // 应为 false
   state.localStream.getAudioTracks()[0].enabled  // 应为 true
   ```

2. **检查系统音量**
   - 验证系统音频未静音
   - 检查浏览器标签未静音
   - 检查输出设备选择

3. **音频轨道问题**
   ```javascript
   // 验证音频轨道存在
   state.localStream.getAudioTracks().length  // 应 >= 1
   ```

### 视频质量差

**症状**: 视频马赛克，帧率低

**解决方案**：

1. **检查带宽**
   ```javascript
   // 检查连接统计
   peer.pc.getStats().then(stats => {
     stats.forEach(report => {
       if (report.type === 'outbound-rtp' && report.mediaType === 'video') {
         console.log('码率:', report.bitrateMean);
       }
     });
   });
   ```

2. **降低分辨率**
   ```javascript
   // 请求更低分辨率
   navigator.mediaDevices.getUserMedia({
     video: { width: 640, height: 480 },
     audio: true
   });
   ```

3. **检查 CPU 使用**
   - 高 CPU 可能导致质量下降
   - 尝试关闭其他应用
   - 减少并发通话数

---

## 部署问题

### Docker 容器无法启动

**症状**: `docker compose up` 失败或容器立即退出

**解决方案**：

1. **检查日志**
   ```bash
   docker compose logs webrtc
   docker compose logs coturn
   docker compose logs caddy
   ```

2. **端口冲突**
   ```bash
   # 检查端口是否被占用
   sudo lsof -i :80
   sudo lsof -i :443
   sudo lsof -i :8080
   sudo lsof -i :3478
   ```

3. **权限问题**
   ```bash
   # 修复文件权限
   sudo chown -R $USER:$USER ./
   ```

### HTTPS 证书错误

**症状**: 浏览器显示证书警告

**解决方案**：

1. **DNS 未传播**
   ```bash
   # 检查 DNS 解析
   dig yourdomain.com
   nslookup yourdomain.com
   ```

2. **端口 80 被阻止**
   - Let's Encrypt 需要端口 80 用于 HTTP-01 验证
   - 确保防火墙允许端口 80 → 443 重定向

3. **速率限制**
   - Let's Encrypt 有速率限制（5 次失败/小时，50 个证书/周）
   - 如果达到限制，请等待后再试

### TURN 服务器连接失败

**症状**: 同网络通话正常，跨网络失败

**解决方案**：

1. **验证 TURN 配置**
   ```bash
   # 使用 turnutils_uclient 测试 TURN
   turnutils_uclient -u webrtc -w yourpassword yourdomain.com
   ```

2. **检查防火墙**
   ```bash
   # TURN 需要 UDP 端口 3478 和 5349
   # 加中继端口（默认 10000-20000）
   sudo ufw allow 3478/tcp
   sudo ufw allow 3478/udp
   sudo ufw allow 5349/tcp
   sudo ufw allow 5349/udp
   sudo ufw allow 10000:20000/udp
   ```

3. **检查配置文件**
   ```bash
   # 验证 turnserver.conf 语法
   docker compose exec coturn turnserver -c /etc/turnserver.conf -v
   ```

---

## 性能问题

### CPU 使用率高

**症状**: 服务器 CPU 100%，响应缓慢

**原因及解决方案**：

1. **房间/客户端过多**
   - 默认限制：1000 房间，50 客户端/房间
   - 监控当前使用：
   ```bash
   docker compose logs webrtc | grep -E "rooms|clients"
   ```

2. **Goroutine 泄露**（已在 v0.9.0+ 修复）
   - 确保运行最新版本
   - 检查日志中的 goroutine 数量

3. **邻居干扰**
   - 在 docker-compose.yml 中使用资源限制：
   ```yaml
   deploy:
     resources:
       limits:
         cpus: '2.0'
         memory: 1G
   ```

### 内存使用率高

**症状**: 服务器内存耗尽

**解决方案**：

1. **检查内存泄露**
   ```bash
   # 监控内存使用
   docker stats webrtc
   ```

2. **减少缓冲区大小**
   - 如果自行托管，编辑 `internal/signal/hub.go`
   - 减少 `SendBufferSize` 常量

3. **定期重启**
   - 添加到 crontab 每日重启：
   ```bash
   0 4 * * * cd /path/to/webrtc && docker compose restart
   ```

### 浏览器性能问题

**症状**: 多参与者时浏览器变慢或崩溃

**解决方案**：

1. **Mesh 限制**
   - 每个对等端创建 N-1 个连接
   - 10 个对等端 = 90 个总连接
   - 考虑大房间使用 SFU

2. **减少同时视频**
   - 实现分页或主讲人选择
   - 缩略图使用更低分辨率

3. **启用硬件加速**
   - Chrome: 设置 → 系统 → 使用硬件加速

---

## 浏览器兼容性

### 支持的浏览器

| 浏览器 | 最低版本 | WebRTC 支持 |
|:-------|:---------|:------------|
| Chrome | 90+ | ✅ 完全支持 |
| Firefox | 88+ | ✅ 完全支持 |
| Safari | 14+ | ✅ 完全支持 |
| Edge | 90+ | ✅ 完全支持 |

### 已知问题

#### Safari
- 可能需要用户交互后才播放远程视频
- 视频元素已包含 `playsinline` 属性

#### Firefox
- 授予权限后偶尔需要刷新页面
- 某些企业防火墙阻止 WebRTC

#### 移动端浏览器
- iOS Safari: 后台标签页支持有限
- Chrome Android: `getUserMedia` 默认可能使用后置摄像头

---

## 获取帮助

如果无法解决你的问题：

### 1. 检查日志

```bash
# 所有服务
docker compose logs

# 跟踪特定服务
docker compose logs -f webrtc

# 最后 100 行
docker compose logs --tail=100 webrtc
```

### 2. 启用调试模式

```bash
# 使用详细日志运行
docker compose exec webrtc go run ./cmd/server -v
```

### 3. 浏览器调试

```javascript
// 在 Chrome 中启用 WebRTC 日志
chrome://webrtc-internals/

// 检查控制台错误
// F12 → Console 标签

// 检查对等连接
// F12 → Application → WebRTC Internals
```

### 4. 提交 Issue

包括：
- 浏览器和版本
- 服务器日志
- 复现步骤
- 预期与实际情况

[提交 Issue](https://github.com/LessUp/webrtc/issues)

---

## 快速参考

### 常用命令

```bash
# 查看日志
docker compose logs -f

# 重启服务
docker compose restart

# 检查状态
docker compose ps

# 更新到最新
git pull
docker compose up -d --build

# 干净重启
docker compose down
docker compose up -d
```

### 调试检查清单

- [ ] 服务器运行中 (`docker compose ps`)
- [ ] 健康端点可访问 (`curl /healthz`)
- [ ] WebSocket 连接成功（浏览器开发者工具 → Network → WS）
- [ ] 可以加入房间（控制台无错误）
- [ ] 摄像头/麦克风权限已授予
- [ ] ICE candidates 交换成功（检查 `chrome://webrtc-internals/`）

---

**最后更新**: 2026-04-16 | **版本**: v1.0.0
