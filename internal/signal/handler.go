package signal

import (
	"errors"
	"log"
	"net/http"
	"strings"
	"time"
	"unicode"
)

// HandleWS handles WebSocket connection upgrades and message processing.
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

// handleMessage routes incoming messages to appropriate handlers.
func (h *Hub) handleMessage(client *Client, msg Message) error {
	// Rate limit check
	if !client.checkRateLimit() {
		if err := client.sendError(ErrRateLimited); err != nil {
			log.Printf("signal: failed to send rate_limited error to conn=%d: %v", client.connID, err)
		}
		return errors.New("rate limited")
	}

	switch msg.Type {
	case MsgTypeJoin:
		return h.handleJoin(client, msg)
	case MsgTypeLeave:
		h.removeClient(client)
		return nil
	case MsgTypePing:
		return client.enqueue(Message{Type: MsgTypePong})
	case MsgTypeOffer, MsgTypeAnswer, MsgTypeCandidate, MsgTypeHangup:
		return h.forward(client, msg)
	default:
		if err := client.sendError(ErrUnknownType); err != nil {
			log.Printf("signal: failed to send unknown_type error to conn=%d: %v", client.connID, err)
		}
		return errors.New("unknown message type")
	}
}

// handleJoin processes a join request.
func (h *Hub) handleJoin(c *Client, msg Message) error {
	id := normalizeClientID(msg.From, MaxClientIDLength)
	if id == "" {
		if err := c.sendError(ErrInvalidID); err != nil {
			log.Printf("signal: failed to send invalid_id error to conn=%d: %v", c.connID, err)
		}
		return errors.New("invalid client id")
	}
	room := normalizeRoomName(msg.Room, MaxRoomIDLength)
	if room == "" {
		if err := c.sendError(ErrInvalidRoom); err != nil {
			log.Printf("signal: failed to send invalid_room error to conn=%d: %v", c.connID, err)
		}
		return errors.New("invalid room")
	}

	boundID, currentRoom := c.identity()
	if boundID != "" && boundID != id {
		if err := c.sendError(ErrIdentityLocked); err != nil {
			log.Printf("signal: failed to send identity_locked error to conn=%d: %v", c.connID, err)
		}
		return errors.New("identity mismatch")
	}
	if currentRoom != "" && currentRoom != room {
		if err := c.sendError(ErrAlreadyJoined); err != nil {
			log.Printf("signal: failed to send already_joined error to conn=%d: %v", c.connID, err)
		}
		return errors.New("already joined")
	}

	c.setIdentity(id, room)
	if err := h.addClient(c); err != nil {
		c.setIdentity("", "") // Clear both id and room on failure
		if sendErr := c.sendError(err); sendErr != nil {
			log.Printf("signal: failed to send %s error to conn=%d: %v", err.Code, c.connID, sendErr)
		}
		return err
	}
	if err := c.enqueue(Message{Type: MsgTypeJoined, Room: room, From: id}); err != nil {
		return err
	}
	h.broadcastMembers(room)
	return nil
}

// forward routes signaling messages between clients.
func (h *Hub) forward(sender *Client, msg Message) error {
	id, room := sender.identity()
	if id == "" || room == "" {
		if err := sender.sendError(ErrNotJoined); err != nil {
			log.Printf("signal: failed to send not_joined error to conn=%d: %v", sender.connID, err)
		}
		return errors.New("sender not joined")
	}
	to := normalizeClientID(msg.To, MaxClientIDLength)
	if to == "" || to == id {
		if err := sender.sendError(ErrInvalidTarget); err != nil {
			log.Printf("signal: failed to send invalid_target error to conn=%d: %v", sender.connID, err)
		}
		return errors.New("invalid target")
	}

	h.mu.RLock()
	m, ok := h.rooms[room]
	if !ok {
		h.mu.RUnlock()
		if err := sender.sendError(ErrRoomMissing); err != nil {
			log.Printf("signal: failed to send room_missing error to conn=%d: %v", sender.connID, err)
		}
		return errors.New("room missing")
	}
	current, ok := m[id]
	if !ok || current != sender {
		h.mu.RUnlock()
		if err := sender.sendError(ErrMembershipLost); err != nil {
			log.Printf("signal: failed to send membership_lost error to conn=%d: %v", sender.connID, err)
		}
		return errors.New("sender not registered")
	}
	dst, ok := m[to]
	h.mu.RUnlock()
	if !ok || dst == nil {
		if err := sender.sendError(ErrTargetNotFound); err != nil {
			log.Printf("signal: failed to send target_not_found error to conn=%d: %v", sender.connID, err)
		}
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

// normalizeClientID validates and normalizes a client ID.
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

// normalizeRoomName validates and normalizes a room name.
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
