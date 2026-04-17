# ── Build stage ───────────────────────────────────────────────────────────────
FROM golang:1.23-alpine3.21 AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -ldflags="-s -w" -o /out/server ./cmd/server

# ── Runtime stage ─────────────────────────────────────────────────────────────
FROM alpine:3.21
RUN apk --no-cache add ca-certificates netcat-openbsd
WORKDIR /app

# Create nonroot user
RUN adduser -D -H -s /sbin/nologin nonroot

COPY --from=build /out/server .
COPY web/ ./web/

# Health check using shell (no wget needed)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD sh -c 'echo "GET /healthz HTTP/1.0" | nc -w 2 localhost 8080 | grep -q "ok"' || exit 1

# Switch to nonroot user
USER nonroot

EXPOSE 8080
ENV ADDR=":8080"
ENTRYPOINT ["./server"]
