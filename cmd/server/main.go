package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	sig "lessup/webrtc/internal/signal"
)

func parseOrigins(raw string) (origins []string, allowAll bool) {
	if raw == "" {
		return nil, false
	}
	if raw == "*" {
		return nil, true
	}
	parts := strings.Split(raw, ",")
	origins = make([]string, 0, len(parts))
	for _, p := range parts {
		if p = strings.TrimSpace(p); p != "" {
			origins = append(origins, p)
		}
	}
	return origins, false
}

func main() {
	addr := ":8080"
	if v := os.Getenv("ADDR"); v != "" {
		addr = v
	}

	wsAllowed, wsAllowAll := parseOrigins(os.Getenv("WS_ALLOWED_ORIGINS"))

	hub := sig.NewHubWithOptions(sig.Options{
		AllowedOrigins:  wsAllowed,
		AllowAllOrigins: wsAllowAll,
	})

	mux := http.NewServeMux()
	mux.HandleFunc("/ws", hub.HandleWS)
	mux.Handle("/", http.FileServer(http.Dir("web")))

	srv := &http.Server{Addr: addr, Handler: mux}

	// Graceful shutdown on SIGINT / SIGTERM.
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		log.Println("server: listening", addr)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal(err)
		}
	}()

	<-quit
	log.Println("server: shutting down ...")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	if err := srv.Shutdown(ctx); err != nil {
		log.Print("server: forced shutdown:", err)
		cancel()
		os.Exit(1)
	}
	cancel()
	log.Println("server: stopped")
}
