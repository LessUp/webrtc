# Stability & Security Refactoring

Date: 2026-03-09

## Critical Bug Fixes

### writePump goroutine leak and data race (hub.go)
- `HandleWS` used a `defer` to close resources, but the ordering caused a race:
  - `writePump` goroutine called `c.conn.Close()` on write error
  - The read goroutine's defer also called `c.Close()`
  - Two goroutines closing the same connection concurrently = data race
- `writePump` could also leak if `close(client.send)` was never reached
- **Fix**: Explicit sequential cleanup after read loop exits:
  1. `removeClient` — prevents new messages from being routed to send channel
  2. `close(client.send)` — terminates writePump's range loop
  3. `c.Close()` — only the read goroutine owns conn lifecycle now
- `writePump` no longer calls `c.conn.Close()` on write error; instead drains remaining messages and returns

### No room/client limits — DoS vector (hub.go)
- Any client could create unlimited rooms and join unlimited times, exhausting server memory
- **Fix**: Added `MaxRooms = 1000` and `MaxClientsPerRoom = 50` limits in `addClient()`
- Rejections are logged for monitoring

## Improvements

### WebSocket auto-reconnection (app.js)
- On unexpected disconnect, the client just set state to 'idle' — user had to manually rejoin
- **Fix**: On unexpected disconnect (not manual leave), automatically attempt reconnection after 2 seconds if a roomId exists
- Shows "连接断开，正在重连…" status message during reconnection

### Files Modified
- `internal/signal/hub.go` — goroutine lifecycle fix, room limits, writePump drain
- `web/app.js` — WebSocket auto-reconnection
