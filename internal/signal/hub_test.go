package signal

import (
	"io"
	"log"
	"net/http"
	"os"
	"testing"

	"github.com/gorilla/websocket"
)

const testRoom = "room1"

func TestMain(m *testing.M) {
	log.SetOutput(io.Discard)
	os.Exit(m.Run())
}

func newTestClient(id, room string, buffer int) *Client {
	if buffer <= 0 {
		buffer = 4
	}
	return &Client{
		id:     id,
		room:   room,
		conn:   &websocket.Conn{},
		send:   make(chan Message, buffer),
		closed: make(chan struct{}),
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

func TestHubAddClientBroadcastsMembers(t *testing.T) {
	h := NewHub()

	c1 := newTestClient("a", testRoom, 4)
	c2 := newTestClient("b", testRoom, 4)

	if err := h.addClient(c1); err != nil {
		t.Fatalf("addClient(c1) error: %v", err)
	}
	h.broadcastMembers(testRoom)
	drainMessages(c1.send)

	if err := h.addClient(c2); err != nil {
		t.Fatalf("addClient(c2) error: %v", err)
	}
	h.broadcastMembers(testRoom)

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
	room := testRoom

	c1 := newTestClient("a", room, 4)
	c2 := newTestClient("b", room, 4)

	if err := h.addClient(c1); err != nil {
		t.Fatalf("addClient(c1) error: %v", err)
	}
	if err := h.addClient(c2); err != nil {
		t.Fatalf("addClient(c2) error: %v", err)
	}
	h.broadcastMembers(room)
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
	room := testRoom

	src := newTestClient("a", room, 4)
	dst := newTestClient("b", room, 1)
	h.rooms[room] = map[string]*Client{"a": src, "b": dst}

	msg := Message{Type: "offer", Room: "spoofed", From: "spoofed", To: "b"}
	if err := h.forward(src, msg); err != nil {
		t.Fatalf("forward error: %v", err)
	}

	select {
	case got := <-dst.send:
		if got.Type != msg.Type || got.From != "a" || got.Room != room || got.To != "b" {
			t.Fatalf("unexpected forwarded message: %#v", got)
		}
	default:
		t.Fatalf("expected message to be forwarded to target client")
	}
}

func TestHubAddClientRejectsEmptyRoomOrID(t *testing.T) {
	h := NewHub()

	if err := h.addClient(newTestClient("", testRoom, 4)); err == nil {
		t.Fatal("expected empty id to be rejected")
	}
	if len(h.rooms) != 0 {
		t.Fatalf("expected no rooms for empty id, got %d", len(h.rooms))
	}

	if err := h.addClient(newTestClient("a", "", 4)); err == nil {
		t.Fatal("expected empty room to be rejected")
	}
	if len(h.rooms) != 0 {
		t.Fatalf("expected no rooms for empty room, got %d", len(h.rooms))
	}
}

func TestHubRemoveClientIdempotent(t *testing.T) {
	h := NewHub()

	c := newTestClient("a", testRoom, 4)
	if err := h.addClient(c); err != nil {
		t.Fatalf("addClient error: %v", err)
	}
	h.broadcastMembers(testRoom)
	drainMessages(c.send)

	h.removeClient(c)
	if _, ok := h.rooms[testRoom]; ok {
		t.Fatalf("room should be deleted after last member leaves")
	}

	h.removeClient(c)
	if _, room := c.identity(); room != "" {
		t.Fatalf("room should remain empty after second remove")
	}
}

func TestHubForwardToNonExistentRoom(t *testing.T) {
	h := NewHub()
	src := newTestClient("a", "ghost", 4)
	if err := h.forward(src, Message{Type: "offer", To: "b"}); err == nil {
		t.Fatal("expected missing room error")
	}
}

func TestHubForwardToNonExistentClient(t *testing.T) {
	h := NewHub()
	room := testRoom
	c := newTestClient("a", room, 4)
	if err := h.addClient(c); err != nil {
		t.Fatalf("addClient error: %v", err)
	}
	drainMessages(c.send)

	if err := h.forward(c, Message{Type: "offer", To: "nonexistent"}); err == nil {
		t.Fatal("expected target not found error")
	}
}

func TestHubMultipleRoomsIsolation(t *testing.T) {
	h := NewHub()

	c1 := newTestClient("a", testRoom, 4)
	c2 := newTestClient("b", "room2", 4)

	if err := h.addClient(c1); err != nil {
		t.Fatalf("addClient(c1) error: %v", err)
	}
	if err := h.addClient(c2); err != nil {
		t.Fatalf("addClient(c2) error: %v", err)
	}
	drainMessages(c1.send)
	drainMessages(c2.send)

	if err := h.forward(c1, Message{Type: "offer", To: "b"}); err == nil {
		t.Fatal("expected isolation to prevent cross-room forwarding")
	}

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

	for i := 0; i < MaxRooms; i++ {
		room := "room" + string(rune('A'+i%26)) + string(rune('0'+i/26%10)) + string(rune('0'+i/260%10)) + string(rune('0'+i/2600%10))
		c := newTestClient("user", room, 4)
		if err := h.addClient(c); err != nil {
			t.Fatalf("unexpected addClient error at %d: %v", i, err)
		}
	}

	if len(h.rooms) != MaxRooms {
		t.Fatalf("expected %d rooms, got %d", MaxRooms, len(h.rooms))
	}

	overflow := newTestClient("overflow", "overflow_room", 4)
	if err := h.addClient(overflow); err == nil {
		t.Fatal("expected room limit error")
	}

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
		c := newTestClient(id, room, 4)
		if err := h.addClient(c); err != nil {
			t.Fatalf("unexpected addClient error at %d: %v", i, err)
		}
	}

	if len(h.rooms[room]) != MaxClientsPerRoom {
		t.Fatalf("expected %d clients, got %d", MaxClientsPerRoom, len(h.rooms[room]))
	}

	overflow := newTestClient("overflow", room, 4)
	if err := h.addClient(overflow); err == nil {
		t.Fatal("expected room full error")
	}

	if len(h.rooms[room]) != MaxClientsPerRoom {
		t.Fatalf("expected client count to remain %d after overflow, got %d", MaxClientsPerRoom, len(h.rooms[room]))
	}
}

func TestHubForwardFailsWhenBufferFull(t *testing.T) {
	h := NewHub()
	room := testRoom

	src := newTestClient("a", room, 4)
	dst := newTestClient("b", room, 1)
	h.rooms[room] = map[string]*Client{"a": src, "b": dst}

	if err := h.forward(src, Message{Type: "offer", To: "b"}); err != nil {
		t.Fatalf("unexpected first forward error: %v", err)
	}
	if err := h.forward(src, Message{Type: "answer", To: "b"}); err == nil {
		t.Fatal("expected second forward to fail when buffer is full")
	}

	got := <-dst.send
	if got.Type != "offer" {
		t.Fatalf("expected first message (offer), got %s", got.Type)
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
	if h.clients == nil {
		t.Fatal("clients map should be initialized")
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

	origins[0] = "https://evil.com"
	if h.allowedOrigins[0] != "https://example.com" {
		t.Fatal("hub should have a defensive copy of allowedOrigins")
	}
}

func TestHubRejectsDuplicateClientID(t *testing.T) {
	h := NewHub()
	first := newTestClient("dup", testRoom, 4)
	second := newTestClient("dup", testRoom, 4)

	if err := h.addClient(first); err != nil {
		t.Fatalf("unexpected first add error: %v", err)
	}
	if err := h.addClient(second); err == nil {
		t.Fatal("expected duplicate id to be rejected")
	}
	if h.rooms[testRoom]["dup"] != first {
		t.Fatal("original client should remain registered")
	}
}

func TestHandleJoinAllowsHumanReadableRoomNames(t *testing.T) {
	h := NewHub()
	client := newTestClient("", "", 4)

	err := h.handleJoin(client, Message{Type: "join", From: "user_01", Room: "团队 room.1"})
	if err != nil {
		t.Fatalf("expected readable room name to be accepted, got %v", err)
	}
	if _, room := client.identity(); room != "团队 room.1" {
		t.Fatalf("expected room to be preserved, got %q", room)
	}
}

func TestClientCloseHandlesZeroValueConn(t *testing.T) {
	client := newTestClient("a", testRoom, 1)

	client.close()
	select {
	case <-client.closed:
	default:
		t.Fatal("expected client closed channel to be closed")
	}

	client.close()
}

func TestHubRemoveClientDoesNotRemoveReplacementConnection(t *testing.T) {
	h := NewHub()
	room := testRoom
	first := newTestClient("dup", room, 4)
	second := newTestClient("dup", room, 4)
	h.rooms[room] = map[string]*Client{"dup": second}

	h.removeClient(first)
	if h.rooms[room]["dup"] != second {
		t.Fatal("removing old connection should not remove replacement client")
	}
}
