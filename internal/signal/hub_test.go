package signal

import (
	"net/http"
	"testing"

	"github.com/gorilla/websocket"
)

func TestIsOriginAllowed(t *testing.T) {
	tests := []struct {
		name    string
		opts    Options
		host    string
		origin  string
		allowed bool
	}{
		{"no origin localhost", Options{}, "localhost:8080", "", true},
		{"no origin 127.0.0.1", Options{}, "127.0.0.1:8080", "", true},
		{"no origin external", Options{}, "example.com:8080", "", false},
		{"origin localhost", Options{}, "localhost:8080", "http://localhost:8080", true},
		{"origin 127.0.0.1", Options{}, "127.0.0.1:8080", "http://127.0.0.1:8080", true},
		{"origin external blocked", Options{}, "example.com", "https://example.com", false},
		{"allow all", Options{AllowAllOrigins: true}, "example.com", "https://evil.com", true},
		{"whitelist match", Options{AllowedOrigins: []string{"https://example.com"}}, "", "https://example.com", true},
		{"whitelist miss", Options{AllowedOrigins: []string{"https://example.com"}}, "", "https://evil.com", false},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			h := NewHubWithOptions(tt.opts)
			r := &http.Request{Host: tt.host, Header: http.Header{}}
			if tt.origin != "" {
				r.Header.Set("Origin", tt.origin)
			}
			if got := h.isOriginAllowed(r); got != tt.allowed {
				t.Errorf("isOriginAllowed() = %v, want %v", got, tt.allowed)
			}
		})
	}
}

func drainMessages(ch <-chan Message) {
	for {
		select {
		case <-ch:
		default:
			return
		}
	}
}

func membersSet(members []string) map[string]struct{} {
	res := make(map[string]struct{}, len(members))
	for _, id := range members {
		res[id] = struct{}{}
	}
	return res
}

func TestHubAddClientBroadcastsMembers(t *testing.T) {
	h := NewHub()

	c1 := &Client{
		id:   "a",
		room: "room1",
		conn: &websocket.Conn{},
		send: make(chan Message, 4),
	}
	c2 := &Client{
		id:   "b",
		room: "room1",
		conn: &websocket.Conn{},
		send: make(chan Message, 4),
	}

	h.addClient(c1)
	drainMessages(c1.send)

	h.addClient(c2)

	select {
	case msg := <-c1.send:
		set := membersSet(msg.Members)
		if _, ok := set["a"]; !ok {
			t.Fatalf("expected members to contain a, got %v", msg.Members)
		}
		if _, ok := set["b"]; !ok {
			t.Fatalf("expected members to contain b, got %v", msg.Members)
		}
	default:
		t.Fatalf("expected broadcast to client1")
	}

	select {
	case msg := <-c2.send:
		set := membersSet(msg.Members)
		if _, ok := set["a"]; !ok {
			t.Fatalf("expected members to contain a, got %v", msg.Members)
		}
		if _, ok := set["b"]; !ok {
			t.Fatalf("expected members to contain b, got %v", msg.Members)
		}
	default:
		t.Fatalf("expected broadcast to client2")
	}
}

func TestHubRemoveClientUpdatesMembersAndDeletesEmptyRoom(t *testing.T) {
	h := NewHub()
	room := "room1"

	c1 := &Client{
		id:   "a",
		room: room,
		conn: &websocket.Conn{},
		send: make(chan Message, 4),
	}
	c2 := &Client{
		id:   "b",
		room: room,
		conn: &websocket.Conn{},
		send: make(chan Message, 4),
	}

	h.addClient(c1)
	h.addClient(c2)
	drainMessages(c1.send)
	drainMessages(c2.send)

	h.removeClient(c1)

	if _, ok := h.rooms[room]; !ok {
		t.Fatalf("room should still exist while one member remains")
	}

	select {
	case msg := <-c2.send:
		if len(msg.Members) != 1 || msg.Members[0] != "b" {
			t.Fatalf("expected only member b after removal, got %v", msg.Members)
		}
	default:
		t.Fatalf("expected members broadcast to remaining client")
	}

	h.removeClient(c2)
	if _, ok := h.rooms[room]; ok {
		t.Fatalf("room should be deleted after last member leaves")
	}
}

func TestHubForwardSendsToTargetClient(t *testing.T) {
	h := NewHub()
	room := "room1"

	dst := &Client{
		id:   "b",
		room: room,
		conn: &websocket.Conn{},
		send: make(chan Message, 1),
	}

	h.rooms[room] = map[string]*Client{
		"b": dst,
	}

	msg := Message{Type: "offer", Room: room, From: "a", To: "b"}

	h.forward(msg)

	select {
	case got := <-dst.send:
		if got.Type != msg.Type || got.From != msg.From || got.Room != msg.Room || got.To != msg.To {
			t.Fatalf("unexpected forwarded message: %#v", got)
		}
	default:
		t.Fatalf("expected message to be forwarded to target client")
	}
}

func TestHubAddClientIgnoresEmptyRoomOrID(t *testing.T) {
	h := NewHub()

	c1 := &Client{id: "", room: "room1", conn: &websocket.Conn{}, send: make(chan Message, 4)}
	h.addClient(c1)
	if len(h.rooms) != 0 {
		t.Fatalf("expected no rooms for empty id, got %d", len(h.rooms))
	}

	c2 := &Client{id: "a", room: "", conn: &websocket.Conn{}, send: make(chan Message, 4)}
	h.addClient(c2)
	if len(h.rooms) != 0 {
		t.Fatalf("expected no rooms for empty room, got %d", len(h.rooms))
	}
}

func TestHubRemoveClientIdempotent(t *testing.T) {
	h := NewHub()

	c := &Client{id: "a", room: "room1", conn: &websocket.Conn{}, send: make(chan Message, 4)}
	h.addClient(c)
	drainMessages(c.send)

	h.removeClient(c)
	if _, ok := h.rooms["room1"]; ok {
		t.Fatalf("room should be deleted after last member leaves")
	}

	// Second remove should be a no-op (room is "" now)
	h.removeClient(c)
	if c.room != "" {
		t.Fatalf("room should remain empty after second remove")
	}
}

func TestHubForwardToNonExistentRoom(t *testing.T) {
	h := NewHub()
	msg := Message{Type: "offer", Room: "ghost", From: "a", To: "b"}
	// Should not panic
	h.forward(msg)
}

func TestHubForwardToNonExistentClient(t *testing.T) {
	h := NewHub()
	room := "room1"
	c := &Client{id: "a", room: room, conn: &websocket.Conn{}, send: make(chan Message, 4)}
	h.addClient(c)
	drainMessages(c.send)

	msg := Message{Type: "offer", Room: room, From: "a", To: "nonexistent"}
	// Should not panic, message is silently dropped
	h.forward(msg)

	select {
	case <-c.send:
		t.Fatalf("no message should be sent to client a")
	default:
	}
}

func TestHubMultipleRoomsIsolation(t *testing.T) {
	h := NewHub()

	c1 := &Client{id: "a", room: "room1", conn: &websocket.Conn{}, send: make(chan Message, 4)}
	c2 := &Client{id: "b", room: "room2", conn: &websocket.Conn{}, send: make(chan Message, 4)}

	h.addClient(c1)
	h.addClient(c2)
	drainMessages(c1.send)
	drainMessages(c2.send)

	// Forward in room1 should not reach room2
	msg := Message{Type: "offer", Room: "room1", From: "x", To: "b"}
	h.forward(msg)

	select {
	case <-c2.send:
		t.Fatalf("message should not cross room boundaries")
	default:
	}

	if len(h.rooms) != 2 {
		t.Fatalf("expected 2 rooms, got %d", len(h.rooms))
	}
}

func TestHubMaxRoomsLimit(t *testing.T) {
	h := NewHub()

	// Fill up to MaxRooms
	for i := 0; i < MaxRooms; i++ {
		room := "room" + string(rune('A'+i%26)) + string(rune('0'+i/26%10)) + string(rune('0'+i/260%10)) + string(rune('0'+i/2600%10))
		c := &Client{id: "user", room: room, conn: &websocket.Conn{}, send: make(chan Message, 4)}
		h.addClient(c)
		drainMessages(c.send)
	}

	if len(h.rooms) != MaxRooms {
		t.Fatalf("expected %d rooms, got %d", MaxRooms, len(h.rooms))
	}

	// One more should be rejected
	overflow := &Client{id: "overflow", room: "overflow_room", conn: &websocket.Conn{}, send: make(chan Message, 4)}
	h.addClient(overflow)

	if len(h.rooms) != MaxRooms {
		t.Fatalf("expected room count to remain %d after overflow, got %d", MaxRooms, len(h.rooms))
	}
	if _, ok := h.rooms["overflow_room"]; ok {
		t.Fatalf("overflow room should not have been created")
	}
}

func TestHubMaxClientsPerRoomLimit(t *testing.T) {
	h := NewHub()
	room := "crowded"

	for i := 0; i < MaxClientsPerRoom; i++ {
		id := "u" + string(rune('A'+i%26)) + string(rune('0'+i/26%10))
		c := &Client{id: id, room: room, conn: &websocket.Conn{}, send: make(chan Message, 4)}
		h.addClient(c)
		drainMessages(c.send)
	}

	if len(h.rooms[room]) != MaxClientsPerRoom {
		t.Fatalf("expected %d clients, got %d", MaxClientsPerRoom, len(h.rooms[room]))
	}

	// One more should be rejected
	overflow := &Client{id: "overflow", room: room, conn: &websocket.Conn{}, send: make(chan Message, 4)}
	h.addClient(overflow)

	if len(h.rooms[room]) != MaxClientsPerRoom {
		t.Fatalf("expected client count to remain %d after overflow, got %d", MaxClientsPerRoom, len(h.rooms[room]))
	}
}

func TestHubForwardDropsWhenBufferFull(t *testing.T) {
	h := NewHub()
	room := "room1"

	// Create client with buffer size 1
	dst := &Client{id: "b", room: room, conn: &websocket.Conn{}, send: make(chan Message, 1)}
	h.rooms[room] = map[string]*Client{"b": dst}

	// Fill the buffer
	h.forward(Message{Type: "offer", Room: room, From: "a", To: "b"})
	// Second forward should be silently dropped (buffer full)
	h.forward(Message{Type: "answer", Room: room, From: "a", To: "b"})

	got := <-dst.send
	if got.Type != "offer" {
		t.Fatalf("expected first message (offer), got %s", got.Type)
	}

	select {
	case msg := <-dst.send:
		t.Fatalf("expected no second message, got %s", msg.Type)
	default:
	}
}

func TestIsOriginAllowedInvalidURL(t *testing.T) {
	h := NewHub()
	r := &http.Request{Host: "localhost:8080", Header: http.Header{}}
	r.Header.Set("Origin", "://invalid")
	if h.isOriginAllowed(r) {
		t.Error("expected invalid origin URL to be rejected")
	}
}

func TestNewHubDefaultOptions(t *testing.T) {
	h := NewHub()
	if h.rooms == nil {
		t.Fatal("rooms map should be initialized")
	}
	if h.allowAllOrigins {
		t.Fatal("allowAllOrigins should default to false")
	}
	if len(h.allowedOrigins) != 0 {
		t.Fatalf("allowedOrigins should be empty by default, got %v", h.allowedOrigins)
	}
}

func TestNewHubWithOptionsCopiesSlice(t *testing.T) {
	origins := []string{"https://example.com"}
	h := NewHubWithOptions(Options{AllowedOrigins: origins})

	// Mutating the original slice should not affect the hub
	origins[0] = "https://evil.com"
	if h.allowedOrigins[0] != "https://example.com" {
		t.Fatal("hub should have a defensive copy of allowedOrigins")
	}
}
