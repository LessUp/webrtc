# 2026-03-09 — Stability & Security

> Type: `fix` | Impact: High

## Summary

Critical bug fixes for goroutine lifecycle and resource exhaustion prevention.

## Critical Fixes

### Goroutine Leak (hub.go)

**Problem:** `writePump` and read goroutine both closing WebSocket connection caused data race.

**Solution:** Explicit sequential cleanup:
1. `removeClient` — removes from room, prevents new messages
2. `close(client.send)` — terminates writePump
3. `c.Close()` — only read goroutine owns conn lifecycle

### Resource Exhaustion (hub.go)

**Problem:** Unlimited room/client creation could exhaust server memory.

**Solution:** Added limits with logging:
- `MaxRooms = 1000`
- `MaxClientsPerRoom = 50`

## Improvements

### WebSocket Auto-reconnection

- Automatic reconnection on unexpected disconnect
- 2-second delay with status message

## Files Changed

- `internal/signal/hub.go`
- `web/app.signaling.js`

## Security Impact

- DoS vulnerability fixed (resource exhaustion)
- Race condition fixed (goroutine lifecycle)
