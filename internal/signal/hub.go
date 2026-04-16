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
	"unicode"

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

func (c *Client) identity() (userID, userRoom string) {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.id, c.room
}

func (c *Client) setIdentity(id, room string) {
	c.mu.Lock()
	c.id = id
	c.room = room
	c.mu.Unlock()
}

func (c *Client) setRoom(room string) {
	c.mu.Lock()
	c.room = room
	c.mu.Unlock()
}

// checkRateLimit implements token bucket rate limiting.
// Returns true if the message should be allowed, false if rate limited.
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

	// Allow burst up to RateLimitBurst, then enforce MaxMessagesPerSecond
	if c.msgCount > RateLimitBurst {
		if !c.rateLimited {
			c.rateLimited = true
			log.Printf("signal: rate limiting client conn=%d", c.connID)
		}
		return false
	}

	// After burst, check per-second rate
	if c.msgCount > MaxMessagesPerSecond && now.Sub(c.msgWindow) < time.Second {
		if !c.rateLimited {
			c.rateLimited = true
			log.Printf("signal: rate limiting client conn=%d", c.connID)
		}
		return false
	}

	return true
}

func (c *Client) sendError(code, text string) error {
	_, room := c.identity()
	return c.enqueue(Message{Type: "error", Room: room, Code: code, Error: text})
}

func (c *Client) enqueue(msg Message) error {
	select {
	case <-c.closed:
		return errClientClosed
	default:
	}

	timer := time.NewTimer(SendTimeout)
	defer timer.Stop()

	select {
	case <-c.closed:
		return errClientClosed
	case c.send <- msg:
		return nil
	case <-timer.C:
		return errors.New("send timeout")
	}
}

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

func normalizeClientID(raw string, maxLen int) string {
	trimmed := strings.TrimSpace(raw)
	if trimmed == "" || len(trimmed) > maxLen {
		return ""
	}
	for _, r := range trimmed {
		switch {
		case r >= 'a' && r <= 'z':
		case r >= 'A' && r <= 'Z':
		case r >= '0' && r <= '9':
		case r == '-', r == '_':
		default:
			return ""
		}
	}
	return trimmed
}

func normalizeRoomName(raw string, maxLen int) string {
	trimmed := strings.TrimSpace(raw)
	if trimmed == "" || len(trimmed) > maxLen {
		return ""
	}
	for _, r := range trimmed {
		if unicode.IsControl(r) {
			return ""
		}
	}
	return trimmed
}

func (h *Hub) registerClient(c *Client) bool {
	h.mu.Lock()
	defer h.mu.Unlock()
	if h.closed {
		return false
	}
	h.clients[c] = struct{}{}
	return true
}

func (h *Hub) unregisterClient(c *Client) {
	h.mu.Lock()
	delete(h.clients, c)
	h.mu.Unlock()
}

func (h *Hub) HandleWS(w http.ResponseWriter, r *http.Request) {
	conn, err := h.upg.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("signal: ws upgrade failed from %s path=%s: %v", r.RemoteAddr, r.URL.Path, err)
		return
	}

	client := &Client{
		connID: h.nextConnID.Add(1),
		conn:   conn,
		send:   make(chan Message, SendBufferSize),
		closed: make(chan struct{}),
	}
	if !h.registerClient(client) {
		_ = conn.Close()
		return
	}

	log.Printf("signal: ws connected from %s conn=%d", r.RemoteAddr, client.connID)
	defer func() {
		h.removeClient(client)
		h.unregisterClient(client)
		client.close()
	}()

	go client.writePump()

	conn.SetReadLimit(MaxMessageSize)
	if err := conn.SetReadDeadline(time.Now().Add(PongWait)); err != nil {
		log.Printf("signal: set initial read deadline failed conn=%d: %v", client.connID, err)
		client.close()
		return
	}
	conn.SetPongHandler(func(string) error {
		if err := conn.SetReadDeadline(time.Now().Add(PongWait)); err != nil {
			log.Printf("signal: set pong read deadline failed conn=%d: %v", client.connID, err)
			return err
		}
		return nil
	})

	for {
		var msg Message
		if err := conn.ReadJSON(&msg); err != nil {
			id, room := client.identity()
			log.Printf("signal: read message error room=%s id=%s conn=%d: %v", room, id, client.connID, err)
			return
		}
		if err := h.handleMessage(client, msg); err != nil {
			log.Printf("signal: handle message error conn=%d type=%s: %v", client.connID, msg.Type, err)
		}
	}
}

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

func (h *Hub) handleMessage(client *Client, msg Message) error {
	// Rate limit check
	if !client.checkRateLimit() {
		_ = client.sendError("rate_limited", "too many messages, please slow down")
		return errors.New("rate limited")
	}

	switch msg.Type {
	case "join":
		return h.handleJoin(client, msg)
	case "leave":
		h.removeClient(client)
		return nil
	case "ping":
		return client.enqueue(Message{Type: "pong"})
	case "offer", "answer", "candidate", "hangup":
		return h.forward(client, msg)
	default:
		_ = client.sendError("unknown_type", "unsupported message type")
		return errors.New("unknown message type")
	}
}

func (h *Hub) handleJoin(c *Client, msg Message) error {
	id := normalizeClientID(msg.From, MaxClientIDLength)
	if id == "" {
		_ = c.sendError("invalid_id", "invalid client id")
		return errors.New("invalid client id")
	}
	room := normalizeRoomName(msg.Room, MaxRoomIDLength)
	if room == "" {
		_ = c.sendError("invalid_room", "invalid room name")
		return errors.New("invalid room")
	}

	boundID, currentRoom := c.identity()
	if boundID != "" && boundID != id {
		_ = c.sendError("identity_locked", "connection identity is immutable")
		return errors.New("identity mismatch")
	}
	if currentRoom != "" && currentRoom != room {
		_ = c.sendError("already_joined", "leave the current room before joining another")
		return errors.New("already joined")
	}

	c.setIdentity(id, room)
	if err := h.addClient(c); err != nil {
		c.setIdentity("", "") // Clear both id and room on failure
		_ = c.sendError(err.Code, err.Error())
		return err
	}
	if err := c.enqueue(Message{Type: "joined", Room: room, From: id}); err != nil {
		return err
	}
	h.broadcastMembers(room)
	return nil
}

type protocolError struct {
	Code string
	Text string
}

func (e *protocolError) Error() string { return e.Text }

func (h *Hub) addClient(c *Client) *protocolError {
	id, room := c.identity()
	h.mu.Lock()
	defer h.mu.Unlock()
	if room == "" || id == "" {
		return &protocolError{Code: "invalid_join", Text: "room and id are required"}
	}
	m, ok := h.rooms[room]
	if !ok {
		if len(h.rooms) >= MaxRooms {
			log.Printf("signal: room limit reached (%d), rejecting join room=%s id=%s", MaxRooms, room, id)
			return &protocolError{Code: "room_limit_reached", Text: "room limit reached"}
		}
		m = make(map[string]*Client)
		h.rooms[room] = m
	}
	if existing, exists := m[id]; exists {
		if existing == c {
			return nil
		}
		log.Printf("signal: duplicate id rejected room=%s id=%s", room, id)
		return &protocolError{Code: "duplicate_id", Text: "client id already exists in room"}
	}
	if len(m) >= MaxClientsPerRoom {
		log.Printf("signal: room %s full (%d clients), rejecting id=%s", room, MaxClientsPerRoom, id)
		return &protocolError{Code: "room_full", Text: "room is full"}
	}
	m[id] = c
	log.Printf("signal: join room=%s id=%s conn=%d (room size: %d, total rooms: %d)", room, id, c.connID, len(m), len(h.rooms))
	return nil
}

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

func (h *Hub) broadcastMembers(room string) {
	h.mu.RLock()
	m, ok := h.rooms[room]
	if !ok {
		h.mu.RUnlock()
		return
	}
	recipients := make([]*Client, 0, len(m))
	members := make([]string, 0, len(m))
	for id, cli := range m {
		members = append(members, id)
		recipients = append(recipients, cli)
	}
	h.mu.RUnlock()

	sort.Strings(members)
	msg := Message{
		Type:    "room_members",
		Room:    room,
		Members: members,
	}
	for _, cli := range recipients {
		if cli == nil {
			continue
		}
		if err := cli.enqueue(msg); err != nil {
			log.Printf("signal: members broadcast failed room=%s conn=%d: %v", room, cli.connID, err)
			h.removeClient(cli)
			cli.close()
		}
	}
}

func (h *Hub) forward(sender *Client, msg Message) error {
	id, room := sender.identity()
	if id == "" || room == "" {
		_ = sender.sendError("not_joined", "join a room first")
		return errors.New("sender not joined")
	}
	to := normalizeClientID(msg.To, MaxClientIDLength)
	if to == "" || to == id {
		_ = sender.sendError("invalid_target", "invalid target client")
		return errors.New("invalid target")
	}

	h.mu.RLock()
	m, ok := h.rooms[room]
	if !ok {
		h.mu.RUnlock()
		_ = sender.sendError("room_missing", "room no longer exists")
		return errors.New("room missing")
	}
	current, ok := m[id]
	if !ok || current != sender {
		h.mu.RUnlock()
		_ = sender.sendError("membership_lost", "client is no longer registered in room")
		return errors.New("sender not registered")
	}
	dst, ok := m[to]
	h.mu.RUnlock()
	if !ok || dst == nil {
		_ = sender.sendError("target_not_found", "target client is not in the room")
		return errors.New("target not found")
	}

	msg.Room = room
	msg.From = id
	msg.To = to
	if err := dst.enqueue(msg); err != nil {
		log.Printf("signal: forward failed room=%s from=%s to=%s: %v", room, id, to, err)
		h.removeClient(dst)
		dst.close()
		return err
	}
	return nil
}

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
