---
layout: docs
title: 故障排查 — WebRTC
description: 运行 LessUp WebRTC 时常见问题与修复建议。
lang: zh-CN
---

# 故障排查

## WebSocket 无法连接

- 确认服务运行在预期的主机和端口上
- 检查 `WS_ALLOWED_ORIGINS`
- 查看浏览器控制台里 `web/src/controllers/signaling.js` 相关报错

## 没有媒体设备

- 确认浏览器已经获得摄像头和麦克风权限
- 确认 `navigator.mediaDevices.getUserMedia` 可用
- 尽量在 `localhost` 或 HTTPS 下测试

## 看不到远端成员

- 确认两个标签页加入的是同一个房间
- 确认服务端发送了 `room_members`
- 检查是否触发了重复 ID 处理

## 跨网络通话失败

- 通过 `RTC_CONFIG_JSON` 配置 TURN
- 检查 TURN 端口与防火墙
- 生产环境通过 HTTPS/WSS 提供服务

## 本地检查失败

- 运行 `make check`
- 运行 `cd web && npm test`
- 确保本地 `golangci-lint` 与仓库 v2 配置兼容

## 仍然卡住？

- [提交 Issue](https://github.com/LessUp/webrtc/issues)
- 对照 [OpenSpec 导航](specs.zh-CN)
