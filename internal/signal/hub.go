package signal

import (
	"log"
	"net/http"
	"net/url"
	"strings"
	"sync"

	"github.com/gorilla/websocket"
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
		if host == "localhost:8080" || strings.HasPrefix(host, "127.0.0.1:") || strings.HasPrefix(host, "localhost:") {
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
	go h.writePump(client)
	defer func() {
		h.removeClient(client)
		close(client.send)
		c.Close()
	}()
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
}

func (h *Hub) addClient(c *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if c.room == "" || c.id == "" {
		return
	}
	m, ok := h.rooms[c.room]
	if !ok {
		m = make(map[string]*Client)
		h.rooms[c.room] = m
	}
	m[c.id] = c
	log.Printf("signal: join room=%s id=%s", c.room, c.id)

	members := make([]string, 0, len(m))
	for id := range m {
		members = append(members, id)
	}
	msg := Message{
		Type:    "room_members",
		Room:    c.room,
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
		c.room = ""
		if len(m) == 0 {
			delete(h.rooms, room)
			log.Printf("signal: room %s closed", room)
			return
		}

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

func (h *Hub) writePump(c *Client) {
	for msg := range c.send {
		if err := c.conn.WriteJSON(msg); err != nil {
			log.Printf("signal: write message error room=%s id=%s: %v", c.room, c.id, err)
			c.conn.Close()
			break
		}
	}
}

