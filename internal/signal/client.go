package signal

import (
	"errors"
	"log"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

// Client represents a connected WebSocket client.
type Client struct {
	mu        sync.RWMutex
	id        string
	room      string
	connID    uint64
	conn      *websocket.Conn
	send      chan Message
	closed    chan struct{}
	closeOnce sync.Once
	// Rate limiting
	msgCount    int
	msgWindow   time.Time
	rateLimited bool
}

// identity returns the client's ID and room.
func (c *Client) identity() (userID, userRoom string) {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.id, c.room
}

// setIdentity sets the client's ID and room.
func (c *Client) setIdentity(id, room string) {
	c.mu.Lock()
	c.id = id
	c.room = room
	c.mu.Unlock()
}

// setRoom sets the client's room.
func (c *Client) setRoom(room string) {
	c.mu.Lock()
	c.room = room
	c.mu.Unlock()
}

// checkRateLimit implements token bucket rate limiting.
// Returns true if the message should be allowed, false if rate limited.
// Allows burst up to RateLimitBurst (50), then enforces MaxMessagesPerSecond (30/sec).
func (c *Client) checkRateLimit() bool {
	c.mu.Lock()
	defer c.mu.Unlock()

	now := time.Now()
	// Reset window if more than 1 second has passed
	if now.Sub(c.msgWindow) >= time.Second {
		c.msgWindow = now
		c.msgCount = 0
		c.rateLimited = false
	}

	c.msgCount++

	// First check: absolute burst limit (hard cap at 50)
	if c.msgCount > RateLimitBurst {
		if !c.rateLimited {
			c.rateLimited = true
			log.Printf("signal: rate limiting client conn=%d (burst exceeded)", c.connID)
		}
		return false
	}

	// Second check: per-second rate limit after initial burst window
	// Only enforce if we're past the burst allowance (30) within the first second
	if c.msgCount > MaxMessagesPerSecond && now.Sub(c.msgWindow) < time.Second {
		if !c.rateLimited {
			c.rateLimited = true
			log.Printf("signal: rate limiting client conn=%d (rate exceeded)", c.connID)
		}
		return false
	}

	return true
}

// sendError sends an error message to the client.
func (c *Client) sendError(err *ProtocolError) error {
	_, room := c.identity()
	return c.enqueue(Message{Type: MsgTypeError, Room: room, Code: err.Code, Error: err.Message})
}

// sendErrorAndLog sends an error message to the client and logs if sending fails.
func (c *Client) sendErrorAndLog(err *ProtocolError) error {
	sendErr := c.sendError(err)
	if sendErr != nil {
		log.Printf("signal: failed to send %s error to conn=%d: %v", err.Code, c.connID, sendErr)
	}
	return sendErr
}

// enqueue queues a message for sending to the client.
func (c *Client) enqueue(msg Message) error {
	select {
	case <-c.closed:
		return errClientClosed
	default:
	}

	timer := time.NewTimer(SendTimeout)

	select {
	case <-c.closed:
		timer.Stop()
		return errClientClosed
	case c.send <- msg:
		// Drain timer to prevent resource leak
		if !timer.Stop() {
			select {
			case <-timer.C:
			default:
			}
		}
		return nil
	case <-timer.C:
		return errors.New("send timeout")
	}
}

// close closes the client's WebSocket connection.
func (c *Client) close() {
	c.closeOnce.Do(func() {
		close(c.closed)
		if c.conn == nil {
			return
		}
		defer func() {
			if r := recover(); r != nil {
				log.Printf("signal: conn close panic conn=%d: %v", c.connID, r)
			}
		}()
		_ = c.conn.Close()
	})
}

// writePump handles sending messages to the WebSocket connection.
func (c *Client) writePump() {
	ticker := time.NewTicker(PingPeriod)
	defer ticker.Stop()

	for {
		select {
		case <-c.closed:
			return
		case msg := <-c.send:
			if err := c.conn.SetWriteDeadline(time.Now().Add(WriteWait)); err != nil {
				log.Printf("signal: set write deadline failed conn=%d: %v", c.connID, err)
				c.close()
				return
			}
			if err := c.conn.WriteJSON(msg); err != nil {
				id, room := c.identity()
				log.Printf("signal: write message error room=%s id=%s conn=%d: %v", room, id, c.connID, err)
				c.close()
				return
			}
		case <-ticker.C:
			if err := c.conn.SetWriteDeadline(time.Now().Add(WriteWait)); err != nil {
				log.Printf("signal: set ping deadline failed conn=%d: %v", c.connID, err)
				c.close()
				return
			}
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				id, room := c.identity()
				log.Printf("signal: ping failed room=%s id=%s conn=%d: %v", room, id, c.connID, err)
				c.close()
				return
			}
		}
	}
}
