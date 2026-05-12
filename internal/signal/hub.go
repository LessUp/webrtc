package signal

import (
	"errors"
	"log"
	"net/http"
	"net/url"
	"sort"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	"github.com/gorilla/websocket"
)

// Limits to prevent resource exhaustion
const (
	MaxRooms          = 1000
	MaxClientsPerRoom = 50
	MaxRoomIDLength   = 64
	MaxClientIDLength = 64
	SendBufferSize    = 64
	SendTimeout       = 2 * time.Second
	WriteWait         = 10 * time.Second
	PongWait          = 20 * time.Second
	PingPeriod        = 15 * time.Second
	MaxMessageSize    = 1 << 20
	// Rate limiting: max messages per second per client
	MaxMessagesPerSecond = 30
	RateLimitBurst       = 50
)

var errClientClosed = errors.New("client closed")

// Options configures Hub behavior.
type Options struct {
	AllowedOrigins  []string
	AllowAllOrigins bool
}

// Hub manages rooms and routes signaling messages between clients.
type Hub struct {
	mu      sync.RWMutex
	rooms   map[string]map[string]*Client
	clients map[*Client]struct{}
	upg     websocket.Upgrader

	allowedOrigins  []string
	allowAllOrigins bool
	closed          bool
	nextConnID      atomic.Uint64
}

// NewHub creates a new Hub with default options.
func NewHub() *Hub {
	return NewHubWithOptions(Options{})
}

// NewHubWithOptions creates a new Hub with custom options.
func NewHubWithOptions(opts Options) *Hub {
	h := &Hub{
		rooms:           make(map[string]map[string]*Client),
		clients:         make(map[*Client]struct{}),
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

// registerClient adds a client to the hub's client registry.
func (h *Hub) registerClient(c *Client) bool {
	h.mu.Lock()
	defer h.mu.Unlock()
	if h.closed {
		return false
	}
	h.clients[c] = struct{}{}
	return true
}

// unregisterClient removes a client from the hub's client registry.
func (h *Hub) unregisterClient(c *Client) {
	h.mu.Lock()
	delete(h.clients, c)
	h.mu.Unlock()
}

// addClient adds a client to a room.
func (h *Hub) addClient(c *Client) *ProtocolError {
	id, room := c.identity()
	h.mu.Lock()
	defer h.mu.Unlock()
	if room == "" || id == "" {
		return ErrInvalidJoin
	}
	m, ok := h.rooms[room]
	if !ok {
		if len(h.rooms) >= MaxRooms {
			log.Printf("signal: room limit reached (%d), rejecting join room=%s id=%s", MaxRooms, room, id)
			return ErrRoomLimitReached
		}
		m = make(map[string]*Client)
		h.rooms[room] = m
	}
	if existing, exists := m[id]; exists {
		if existing == c {
			return nil
		}
		log.Printf("signal: duplicate id rejected room=%s id=%s", room, id)
		return ErrDuplicateID
	}
	if len(m) >= MaxClientsPerRoom {
		log.Printf("signal: room %s full (%d clients), rejecting id=%s", room, MaxClientsPerRoom, id)
		return ErrRoomFull
	}
	m[id] = c
	log.Printf("signal: join room=%s id=%s conn=%d (room size: %d, total rooms: %d)", room, id, c.connID, len(m), len(h.rooms))
	return nil
}

// removeClient removes a client from its room.
func (h *Hub) removeClient(c *Client) {
	id, room := c.identity()
	if room == "" || id == "" {
		return
	}

	var shouldBroadcast bool
	var roomRemoved bool

	h.mu.Lock()
	if m, ok := h.rooms[room]; ok {
		current, ok2 := m[id]
		if !ok2 || current != c {
			h.mu.Unlock()
			c.setRoom("")
			return
		}
		delete(m, id)
		log.Printf("signal: leave room=%s id=%s conn=%d", room, id, c.connID)
		if len(m) == 0 {
			delete(h.rooms, room)
			log.Printf("signal: room %s closed", room)
			roomRemoved = true
		} else {
			shouldBroadcast = true
		}
	}
	h.mu.Unlock()
	c.setRoom("")
	if shouldBroadcast && !roomRemoved {
		h.broadcastMembers(room)
	}
}

// broadcastMembers sends the member list to all clients in a room.
func (h *Hub) broadcastMembers(room string) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	m, ok := h.rooms[room]
	if !ok {
		return
	}

	// Single critical section snapshot: capture both member IDs and client pointers
	members := make([]string, 0, len(m))
	recipients := make([]*Client, 0, len(m))
	for id, cli := range m {
		members = append(members, id)
		recipients = append(recipients, cli)
	}

	sort.Strings(members)
	msg := Message{
		Type:    MsgTypeRoomMembers,
		Room:    room,
		Members: members,
	}

	// Send to all recipients while still holding lock (enqueue is non-blocking)
	for _, cli := range recipients {
		if cli == nil {
			continue
		}
		if err := cli.enqueue(msg); err != nil {
			log.Printf("signal: members broadcast failed room=%s conn=%d: %v", room, cli.connID, err)
			// Remove client asynchronously to avoid deadlock
			go h.removeClient(cli)
			go cli.close()
		}
	}
}

// Close shuts down the hub and disconnects all clients.
func (h *Hub) Close() {
	h.mu.Lock()
	if h.closed {
		h.mu.Unlock()
		return
	}
	h.closed = true
	clients := make([]*Client, 0, len(h.clients))
	for client := range h.clients {
		clients = append(clients, client)
	}
	h.mu.Unlock()

	for _, client := range clients {
		h.removeClient(client)
		client.close()
		h.unregisterClient(client)
	}
}

// IsClosed returns true if the hub has been closed.
func (h *Hub) IsClosed() bool {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return h.closed
}

// isOriginAllowed checks if a request's origin is permitted.
func (h *Hub) isOriginAllowed(r *http.Request) bool {
	if h.allowAllOrigins {
		return true
	}
	origin := r.Header.Get("Origin")
	if origin == "" {
		host := r.Host
		// Check for localhost with proper host:port matching
		if isLocalhostHost(host) {
			return true
		}
		return false
	}
	if len(h.allowedOrigins) == 0 {
		u, err := url.Parse(origin)
		if err != nil {
			return false
		}
		host := u.Hostname()
		return isLocalhost(host)
	}
	for _, o := range h.allowedOrigins {
		if o == origin {
			return true
		}
	}
	return false
}

// isLocalhost checks if a hostname is localhost (IPv4, IPv6, or plain)
func isLocalhost(host string) bool {
	return host == "localhost" || host == "127.0.0.1" || host == "::1"
}

// isLocalhostHost checks if a host:port string refers to localhost
func isLocalhostHost(hostPort string) bool {
	// Handle plain hostnames without port
	if hostPort == "localhost" || hostPort == "127.0.0.1" || hostPort == "[::1]" {
		return true
	}
	// Handle host:port format
	if strings.HasPrefix(hostPort, "localhost:") {
		return true
	}
	if strings.HasPrefix(hostPort, "127.0.0.1:") {
		return true
	}
	if strings.HasPrefix(hostPort, "[::1]:") {
		return true
	}
	return false
}
