---
layout: docs
title: Troubleshooting — WebRTC
description: Common problems and fixes when running LessUp WebRTC.
---

# Troubleshooting

## WebSocket does not connect

- verify the app is running on the expected host and port
- check `WS_ALLOWED_ORIGINS`
- inspect browser console errors from `web/src/controllers/signaling.js`

## No media devices

- confirm the browser has camera and microphone permission
- make sure `navigator.mediaDevices.getUserMedia` is available
- test on `localhost` or HTTPS

## Remote peer does not appear

- join the exact same room in both tabs
- confirm the server is sending `room_members`
- verify the client did not hit duplicate ID handling

## Cross-network calls fail

- add a TURN server through `RTC_CONFIG_JSON`
- verify firewall rules for TURN ports
- serve the app over HTTPS/WSS in production

## Checks fail locally

- run `make check`
- run `cd web && npm test`
- ensure your `golangci-lint` matches the repo's v2 config expectations

## Still stuck?

- [Open an issue](https://github.com/LessUp/webrtc/issues)
- compare behavior against the [OpenSpec Hub](specs)
