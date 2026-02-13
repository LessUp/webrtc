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
