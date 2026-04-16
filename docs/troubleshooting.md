---
layout: default
title: Troubleshooting — WebRTC
description: Common issues and solutions for WebRTC deployment and usage
---

[← Back to Home]({{ site.baseurl }}/) | [Documentation Index](README.md)

# Troubleshooting Guide

Common issues and solutions for the WebRTC project.

---

## Table of Contents

- [Connection Issues](#connection-issues)
- [Media Problems](#media-problems)
- [Deployment Issues](#deployment-issues)
- [Performance Issues](#performance-issues)
- [Browser Compatibility](#browser-compatibility)
- [Getting Help](#getting-help)

---

## Connection Issues

### WebSocket Connection Fails

**Symptoms**: "Connection failed" or "WebSocket error" in browser console

**Possible Causes & Solutions**:

#### 1. Origin Not Allowed

Check browser console for:
```
WebSocket connection to 'wss://...' failed
```

Verify `WS_ALLOWED_ORIGINS` includes your domain:

```bash
# Check current configuration
docker compose exec webrtc env | grep WS_ALLOWED_ORIGINS

# Fix in docker-compose.yml
environment:
  - WS_ALLOWED_ORIGINS=yourdomain.com,www.yourdomain.com
```

#### 2. Firewall Blocking

Check server firewall:

```bash
# Check open ports
sudo netstat -tlnp | grep -E '8080|443|80'

# Allow ports (Ubuntu/Debian with UFW)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3478/tcp
sudo ufw allow 3478/udp
```

#### 3. SSL Certificate Issues

If using HTTPS, check certificate:

```bash
# Test SSL connection
curl -v https://yourdomain.com/healthz

# Check Caddy logs
docker compose logs caddy | tail -50
```

### "Cannot Join Room"

**Symptoms**: Join button doesn't work, no error shown

**Solutions**:

1. **Check Client ID**: Must be non-empty and unique
2. **Check Room Name**: Must be non-empty
3. **Check Limits**: Max 50 clients per room, max 1000 rooms
4. **Check Logs**:
   ```bash
   docker compose logs webrtc | grep -E "error|Error|join"
   ```

### "Target Not Found"

**Symptoms**: Call button shows "Target not found" error

**Solutions**:

1. Verify target user is still in the room (check member list)
2. Both users must have joined the same room
3. Target user ID must be exactly as shown in member list

---

## Media Problems

### No Video / Black Screen

**Symptoms**: Remote video element is black or shows placeholder

**Checklist**:

1. **Camera Permissions**
   - Check browser permission icon in address bar
   - Verify camera works on other sites (e.g., [Webcam Test](https://webcamtests.com/))

2. **ICE Connection State**
   ```javascript
   // Open browser console and check
   peer.pc.iceConnectionState  // Should be "connected"
   peer.pc.connectionState     // Should be "connected"
   ```

3. **TURN Server Issues**
   - Test with [Trickle ICE](https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/)
   - Add your TURN server and check for relay candidates
   - Verify TURN credentials in server configuration

4. **Firewall / NAT**
   ```bash
   # Check if TURN ports are open
   nc -zv yourdomain.com 3478
   nc -zv -u yourdomain.com 3478
   ```

### No Audio

**Symptoms**: Video works but no sound

**Solutions**:

1. **Check Mute State**
   ```javascript
   // In browser console
   state.muted           // Should be false
   state.localStream.getAudioTracks()[0].enabled  // Should be true
   ```

2. **Check System Volume**
   - Verify system audio is not muted
   - Check browser tab is not muted
   - Check output device selection

3. **Audio Track Issues**
   ```javascript
   // Verify audio track exists
   state.localStream.getAudioTracks().length  // Should be >= 1
   ```

### Poor Video Quality

**Symptoms**: Pixelated video, low frame rate

**Solutions**:

1. **Check Bandwidth**
   ```javascript
   // Check connection stats
   peer.pc.getStats().then(stats => {
     stats.forEach(report => {
       if (report.type === 'outbound-rtp' && report.mediaType === 'video') {
         console.log('Bitrate:', report.bitrateMean);
       }
     });
   });
   ```

2. **Reduce Resolution**
   ```javascript
   // Request lower resolution
   navigator.mediaDevices.getUserMedia({
     video: { width: 640, height: 480 },
     audio: true
   });
   ```

3. **Check CPU Usage**
   - High CPU can cause quality degradation
   - Try closing other applications
   - Reduce number of concurrent calls

---

## Deployment Issues

### Docker Container Won't Start

**Symptoms**: `docker compose up` fails or containers exit immediately

**Solutions**:

1. **Check Logs**
   ```bash
   docker compose logs webrtc
   docker compose logs coturn
   docker compose logs caddy
   ```

2. **Port Conflicts**
   ```bash
   # Check if ports are already in use
   sudo lsof -i :80
   sudo lsof -i :443
   sudo lsof -i :8080
   sudo lsof -i :3478
   ```

3. **Permission Issues**
   ```bash
   # Fix file permissions
   sudo chown -R $USER:$USER ./
   ```

### HTTPS Certificate Errors

**Symptoms**: Browser shows certificate warning

**Solutions**:

1. **DNS Not Propagated**
   ```bash
   # Check DNS resolution
   dig yourdomain.com
   nslookup yourdomain.com
   ```

2. **Port 80 Blocked**
   - Let's Encrypt requires port 80 for HTTP-01 challenge
   - Ensure firewall allows port 80 → 443 redirect

3. **Rate Limiting**
   - Let's Encrypt has rate limits (5 failures/hour, 50 certs/week)
   - Wait before retrying if you've hit limits

### TURN Server Connection Fails

**Symptoms**: Calls work on same network but fail across networks

**Solutions**:

1. **Verify TURN Configuration**
   ```bash
   # Test TURN with turnutils_uclient
   turnutils_uclient -u webrtc -w yourpassword yourdomain.com
   ```

2. **Check Firewall**
   ```bash
   # TURN needs UDP ports 3478 and 5349
   # Plus relay ports (default 10000-20000)
   sudo ufw allow 3478/tcp
   sudo ufw allow 3478/udp
   sudo ufw allow 5349/tcp
   sudo ufw allow 5349/udp
   sudo ufw allow 10000:20000/udp
   ```

3. **Check Configuration File**
   ```bash
   # Verify turnserver.conf syntax
   docker compose exec coturn turnserver -c /etc/turnserver.conf -v
   ```

---

## Performance Issues

### High CPU Usage

**Symptoms**: Server CPU at 100%, sluggish response

**Causes & Solutions**:

1. **Too Many Rooms/Clients**
   - Default limit: 1000 rooms, 50 clients/room
   - Monitor current usage:
   ```bash
   docker compose logs webrtc | grep -E "rooms|clients"
   ```

2. **Goroutine Leak** (fixed in v0.9.0+)
   - Ensure you're running latest version
   - Check goroutine count in logs

3. **Noisy Neighbors**
   - Use resource limits in docker-compose.yml:
   ```yaml
   deploy:
     resources:
       limits:
         cpus: '2.0'
         memory: 1G
   ```

### High Memory Usage

**Symptoms**: Server runs out of memory

**Solutions**:

1. **Check for Memory Leaks**
   ```bash
   # Monitor memory usage
   docker stats webrtc
   ```

2. **Reduce Buffer Sizes**
   - Edit `internal/signal/hub.go` if self-hosting
   - Reduce `SendBufferSize` constant

3. **Restart Periodically**
   - Add to crontab for daily restart:
   ```bash
   0 4 * * * cd /path/to/webrtc && docker compose restart
   ```

### Browser Performance Issues

**Symptoms**: Browser becomes slow or crashes with multiple participants

**Solutions**:

1. **Mesh Limitations**
   - Each peer creates N-1 connections
   - 10 peers = 90 total connections
   - Consider SFU for large rooms

2. **Reduce Simultaneous Videos**
   - Implement pagination or active speaker selection
   - Use lower resolution for thumbnails

3. **Enable Hardware Acceleration**
   - Chrome: Settings → System → Use hardware acceleration

---

## Browser Compatibility

### Supported Browsers

| Browser | Minimum Version | WebRTC Support |
|:--------|:----------------|:---------------|
| Chrome | 90+ | ✅ Full support |
| Firefox | 88+ | ✅ Full support |
| Safari | 14+ | ✅ Full support |
| Edge | 90+ | ✅ Full support |

### Known Issues

#### Safari
- May require user interaction before playing remote video
- Add `playsinline` attribute to video elements (already included)

#### Firefox
- Occasionally requires page refresh after permission grant
- Some corporate firewalls block WebRTC

#### Mobile Browsers
- iOS Safari: Limited background tab support
- Chrome Android: Back camera may be default for `getUserMedia`

---

## Getting Help

If you can't resolve your issue:

### 1. Check Logs

```bash
# All services
docker compose logs

# Specific service with follow
docker compose logs -f webrtc

# Last 100 lines
docker compose logs --tail=100 webrtc
```

### 2. Enable Debug Mode

```bash
# Run with verbose logging
docker compose exec webrtc go run ./cmd/server -v
```

### 3. Browser Debugging

```javascript
// Enable WebRTC logging in Chrome
chrome://webrtc-internals/

// Check console for errors
// F12 → Console tab

// Inspect peer connections
// F12 → Application → WebRTC Internals
```

### 4. Submit an Issue

Include:
- Browser and version
- Server logs
- Steps to reproduce
- Expected vs actual behavior

[Open an Issue](https://github.com/LessUp/webrtc/issues)

---

## Quick Reference

### Common Commands

```bash
# View logs
docker compose logs -f

# Restart services
docker compose restart

# Check status
docker compose ps

# Update to latest
git pull
docker compose up -d --build

# Clean restart
docker compose down
docker compose up -d
```

### Debug Checklist

- [ ] Server is running (`docker compose ps`)
- [ ] Can access health endpoint (`curl /healthz`)
- [ ] WebSocket connects (browser dev tools → Network → WS)
- [ ] Can join room (no error in console)
- [ ] Camera/mic permissions granted
- [ ] ICE candidates exchanging (check `chrome://webrtc-internals/`)

---

**Last Updated**: 2026-04-16 | **Version**: v1.0.0
