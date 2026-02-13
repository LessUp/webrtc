# ── Build stage ───────────────────────────────────────────────────────────────
FROM golang:1.22-alpine AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -ldflags="-s -w" -o /out/server ./cmd/server

# ── Runtime stage ─────────────────────────────────────────────────────────────
FROM alpine:3.20
RUN apk --no-cache add ca-certificates
WORKDIR /app
COPY --from=build /out/server .
COPY web/ ./web/
EXPOSE 8080
ENV ADDR=":8080"
ENTRYPOINT ["./server"]
