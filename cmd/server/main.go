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
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		log.Fatal("server: forced shutdown:", err)
	}
	log.Println("server: stopped")
}
