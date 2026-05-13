package signal

import (
	"errors"
	"log"
)

// forward routes signaling messages between clients.
func (h *Hub) forward(sender *Client, msg Message) error {
	id, room := sender.identity()
	if id == "" || room == "" {
		_ = sender.sendErrorAndLog(ErrNotJoined)
		return errors.New("sender not joined")
	}
	to := normalizeClientID(msg.To, MaxClientIDLength)
	if to == "" || to == id {
		_ = sender.sendErrorAndLog(ErrInvalidTarget)
		return errors.New("invalid target")
	}

	h.mu.RLock()
	m, ok := h.rooms[room]
	if !ok {
		h.mu.RUnlock()
		_ = sender.sendErrorAndLog(ErrRoomMissing)
		return errors.New("room missing")
	}
	current, ok := m[id]
	if !ok || current != sender {
		h.mu.RUnlock()
		_ = sender.sendErrorAndLog(ErrMembershipLost)
		return errors.New("sender not registered")
	}
	dst, ok := m[to]
	h.mu.RUnlock()
	if !ok || dst == nil {
		_ = sender.sendErrorAndLog(ErrTargetNotFound)
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
