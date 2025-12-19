package main

import (
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"lessup/webrtc/internal/signal"
)

func main() {
	addr := ":8080"
	if v := os.Getenv("ADDR"); v != "" {
		addr = v
	}

	var wsAllowAll bool
	var wsAllowed []string
	if v := os.Getenv("WS_ALLOWED_ORIGINS"); v != "" {
		if v == "*" {
			wsAllowAll = true
		} else {
			parts := strings.Split(v, ",")
			wsAllowed = make([]string, 0, len(parts))
			for _, p := range parts {
				p = strings.TrimSpace(p)
				if p != "" {
					wsAllowed = append(wsAllowed, p)
				}
			}
		}
	}

	hub := signal.NewHubWithOptions(signal.Options{
		AllowedOrigins:  wsAllowed,
		AllowAllOrigins: wsAllowAll,
	})

	mux := http.NewServeMux()
	mux.HandleFunc("/ws", hub.HandleWS)

	webDir := filepath.Join("web")
	fs := http.FileServer(http.Dir(webDir))
	mux.Handle("/", fs)

	srv := &http.Server{Addr: addr, Handler: mux}
	log.Println("server: listening", addr)
	log.Fatal(srv.ListenAndServe())
}
