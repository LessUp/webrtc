package signal

import (
	"errors"
	"strings"
	"unicode"
)

// handleJoin processes a join request.
func (h *Hub) handleJoin(c *Client, msg Message) error {
	id := normalizeClientID(msg.From, MaxClientIDLength)
	if id == "" {
		_ = c.sendErrorAndLog(ErrInvalidID)
		return errors.New("invalid client id")
	}
	room := normalizeRoomName(msg.Room, MaxRoomIDLength)
	if room == "" {
		_ = c.sendErrorAndLog(ErrInvalidRoom)
		return errors.New("invalid room")
	}

	boundID, currentRoom := c.identity()
	if boundID != "" && boundID != id {
		_ = c.sendErrorAndLog(ErrIdentityLocked)
		return errors.New("identity mismatch")
	}
	if currentRoom != "" && currentRoom != room {
		_ = c.sendErrorAndLog(ErrAlreadyJoined)
		return errors.New("already joined")
	}

	c.setIdentity(id, room)
	if err := h.addClient(c); err != nil {
		c.setIdentity("", "") // Clear both id and room on failure
		_ = c.sendErrorAndLog(err)
		return err
	}
	if err := c.enqueue(Message{Type: MsgTypeJoined, Room: room, From: id}); err != nil {
		return err
	}
	h.broadcastMembers(room)
	return nil
}

// normalizeClientID validates and normalizes a client ID.
// Returns empty string if invalid.
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
// Returns empty string if invalid.
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
