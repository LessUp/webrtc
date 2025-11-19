package signal

import "encoding/json"

type Message struct {
	Type      string          `json:"type"`
	Room      string          `json:"room"`
	From      string          `json:"from"`
	To        string          `json:"to,omitempty"`
	SDP       json.RawMessage `json:"sdp,omitempty"`
	Candidate json.RawMessage `json:"candidate,omitempty"`
	Members   []string        `json:"members,omitempty"`
}
