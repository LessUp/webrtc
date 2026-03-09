package signal

import (
	"log"
	"net/http"
	"net/url"
	"strings"
	"sync"

	"github.com/gorilla/websocket"
)

// Limits to prevent resource exhaustion
const (
	MaxRooms          = 1000
	MaxClientsPerRoom = 50
)

type Hub struct {
	mu    sync.RWMutex
	rooms map[string]map[string]*Client
	upg   websocket.Upgrader

	allowedOrigins  []string
	allowAllOrigins bool
}

type Client struct {
	id   string
	room string
	conn *websocket.Conn
	send chan Message
}

type Options struct {
	AllowedOrigins  []string
	AllowAllOrigins bool
}

func NewHub() *Hub {
	return NewHubWithOptions(Options{})
}

func NewHubWithOptions(opts Options) *Hub {
	h := &Hub{
		rooms:           make(map[string]map[string]*Client),
		allowedOrigins:  append([]string(nil), opts.AllowedOrigins...),
		allowAllOrigins: opts.AllowAllOrigins,
	}
	h.upg = websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool {
			return h.isOriginAllowed(r)
		},
	}
	return h
}

func (h *Hub) isOriginAllowed(r *http.Request) bool {
	if h.allowAllOrigins {
		return true
	}
	origin := r.Header.Get("Origin")
	if origin == "" {
		host := r.Host
		return strings.HasPrefix(host, "localhost:") || strings.HasPrefix(host, "127.0.0.1:")
	}
	if len(h.allowedOrigins) == 0 {
		u, err := url.Parse(origin)
		if err != nil {
			return false
		}
		host := u.Hostname()
		if host == "localhost" || host == "127.0.0.1" {
			return true
		}
		return false
	}
	for _, o := range h.allowedOrigins {
		if o == origin {
			return true
		}
	}
	return false
}

func (h *Hub) HandleWS(w http.ResponseWriter, r *http.Request) {
	c, err := h.upg.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("signal: ws upgrade failed from %s path=%s: %v", r.RemoteAddr, r.URL.Path, err)
		return
	}
	log.Printf("signal: ws connected from %s", r.RemoteAddr)
	client := &Client{conn: c, send: make(chan Message, 32)}
	go client.writePump()

	// readPump: blocks until read error (disconnect / protocol error)
	for {
		var msg Message
		if err := c.ReadJSON(&msg); err != nil {
			log.Printf("signal: read message error room=%s id=%s: %v", client.room, client.id, err)
			break
		}
		switch msg.Type {
		case "join":
			client.id = msg.From
			client.room = msg.Room
			h.addClient(client)
		case "leave":
			h.removeClient(client)
		case "ping":
			select {
			case client.send <- Message{Type: "pong"}:
			default:
			}
		case "offer", "answer", "candidate":
			h.forward(msg)
		default:
			log.Printf("signal: unknown msg type=%s room=%s from=%s", msg.Type, msg.Room, msg.From)
		}
	}

	// Cleanup: order matters to avoid goroutine leak and data race.
	// 1. Remove from hub first (prevents new messages being sent to client.send)
	h.removeClient(client)
	// 2. Close send channel (terminates writePump's range loop)
	close(client.send)
	// 3. Close WebSocket (writePump may still be draining; conn.Close is safe to call concurrently)
	c.Close()
}

func (h *Hub) addClient(c *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if c.room == "" || c.id == "" {
		return
	}
	m, ok := h.rooms[c.room]
	if !ok {
		// Enforce max rooms limit
		if len(h.rooms) >= MaxRooms {
			log.Printf("signal: room limit reached (%d), rejecting join room=%s id=%s", MaxRooms, c.room, c.id)
			return
		}
		m = make(map[string]*Client)
		h.rooms[c.room] = m
	}
	// Enforce per-room client limit
	if len(m) >= MaxClientsPerRoom {
		log.Printf("signal: room %s full (%d clients), rejecting id=%s", c.room, MaxClientsPerRoom, c.id)
		return
	}
	m[c.id] = c
	log.Printf("signal: join room=%s id=%s (room size: %d, total rooms: %d)", c.room, c.id, len(m), len(h.rooms))
	broadcastMembers(c.room, m)
}

func (h *Hub) removeClient(c *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if c.room == "" || c.id == "" {
		return
	}
	room := c.room
	if m, ok := h.rooms[room]; ok {
		if _, ok2 := m[c.id]; !ok2 {
			c.room = ""
			return
		}
		delete(m, c.id)
		log.Printf("signal: leave room=%s id=%s", room, c.id)
		c.room = ""
		if len(m) == 0 {
			delete(h.rooms, room)
			log.Printf("signal: room %s closed", room)
			return
		}
		broadcastMembers(room, m)
	}
}

// broadcastMembers sends the current member list to all clients in a room.
// Must be called with h.mu held.
func broadcastMembers(room string, m map[string]*Client) {
	members := make([]string, 0, len(m))
	for id := range m {
		members = append(members, id)
	}
	msg := Message{
		Type:    "room_members",
		Room:    room,
		Members: members,
	}
	for _, cli := range m {
		if cli != nil && cli.conn != nil {
			select {
			case cli.send <- msg:
			default:
			}
		}
	}
}

func (h *Hub) forward(msg Message) {
	h.mu.RLock()
	defer h.mu.RUnlock()
	if m, ok := h.rooms[msg.Room]; ok {
		if dst, ok := m[msg.To]; ok && dst != nil && dst.conn != nil {
			select {
			case dst.send <- msg:
			default:
				// drop if buffer full to avoid blocking the hub
			}
		}
	}
}

func (c *Client) writePump() {
	for msg := range c.send {
		if err := c.conn.WriteJSON(msg); err != nil {
			log.Printf("signal: write message error room=%s id=%s: %v", c.room, c.id, err)
			// Don't close conn here — the read goroutine owns conn lifecycle.
			// Drain remaining messages from send channel so close(send) doesn't block.
			for range c.send {
			}
			return
		}
	}
}
