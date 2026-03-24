package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	sig "lessup/webrtc/internal/signal"
)

type appConfig struct {
	RTCConfig json.RawMessage `json:"rtcConfig,omitempty"`
}

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

func loadAppConfig() appConfig {
	raw := strings.TrimSpace(os.Getenv("RTC_CONFIG_JSON"))
	if raw == "" {
		return appConfig{}
	}
	if !json.Valid([]byte(raw)) {
		log.Printf("server: ignoring invalid RTC_CONFIG_JSON")
		return appConfig{}
	}
	return appConfig{RTCConfig: json.RawMessage(raw)}
}

func configJSHandler(cfg appConfig) http.HandlerFunc {
	payload, err := json.Marshal(cfg)
	if err != nil {
		log.Printf("server: marshal config failed: %v", err)
		payload = []byte("{}")
	}
	body := fmt.Sprintf("window.__APP_CONFIG__ = %s;\n", payload)

	return func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/javascript; charset=utf-8")
		_, _ = io.WriteString(w, body)
	}
}

func main() {
	addr := ":8080"
	if v := os.Getenv("ADDR"); v != "" {
		addr = v
	}

	wsAllowed, wsAllowAll := parseOrigins(os.Getenv("WS_ALLOWED_ORIGINS"))
	appCfg := loadAppConfig()

	hub := sig.NewHubWithOptions(sig.Options{
		AllowedOrigins:  wsAllowed,
		AllowAllOrigins: wsAllowAll,
	})

	mux := http.NewServeMux()
	mux.HandleFunc("/ws", hub.HandleWS)
	mux.HandleFunc("/config.js", configJSHandler(appCfg))
	mux.HandleFunc("/healthz", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "text/plain; charset=utf-8")
		_, _ = io.WriteString(w, "ok\n")
	})
	mux.Handle("/", http.FileServer(http.Dir("web")))

	srv := &http.Server{
		Addr:              addr,
		Handler:           mux,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       15 * time.Second,
		WriteTimeout:      15 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

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
	hub.Close()
	if err := srv.Shutdown(ctx); err != nil {
		log.Print("server: forced shutdown:", err)
		cancel()
		os.Exit(1)
	}
	cancel()
	log.Println("server: stopped")
}
