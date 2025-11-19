package signal

import (
	"log"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
)

type Hub struct {
	mu    sync.RWMutex
	rooms map[string]map[string]*Client
	upg   websocket.Upgrader
}

type Client struct {
	id   string
	room string
	conn *websocket.Conn
	send chan Message
}

func NewHub() *Hub {
	return &Hub{
		rooms: make(map[string]map[string]*Client),
		upg: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool { return true },
		},
	}
}

func (h *Hub) HandleWS(w http.ResponseWriter, r *http.Request) {
	c, err := h.upg.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("signal: ws upgrade failed from %s: %v", r.RemoteAddr, err)
		return
	}
	log.Printf("signal: ws connected from %s", r.RemoteAddr)
	client := &Client{conn: c, send: make(chan Message, 32)}
	go h.writePump(client)
	defer func() {
		h.removeClient(client)
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
}

func (h *Hub) removeClient(c *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if c.room == "" || c.id == "" {
		return
	}
	if m, ok := h.rooms[c.room]; ok {
		if existing, ok2 := m[c.id]; ok2 {
			delete(m, c.id)
			close(existing.send)
		}
		if len(m) == 0 {
			delete(h.rooms, c.room)
			log.Printf("signal: room %s closed", c.room)
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
			break
		}
	}
}

