# Testing Specification

## Overview

This document defines testing requirements and conventions for the WebRTC project.

## Test Categories

### 1. Unit Tests (Go)

**Location**: `internal/signal/*_test.go`

**Framework**: Go standard `testing` package with `-race` flag.

**Commands**:
```bash
# Run all tests
go test -race -count=1 ./...

# Run single test
go test -race -run TestName ./internal/signal/
```

**Coverage Targets**:
- Hub join/leave logic
- Message routing
- Client cleanup sequence
- Origin validation
- Room limit enforcement

### 2. Unit Tests (JavaScript)

**Location**: `web/*_test.js` (if applicable)

**Framework**: Vitest + jsdom

**Commands**:
```bash
cd web && npm test
```

**Coverage Targets**:
- Config functions (createClientId, getCapabilities)
- Media track manipulation
- UI state updates

### 3. Integration Tests

**Scope**: End-to-end signaling flow

**Scenarios**:
1. Two clients join same room
2. SDP exchange via server relay
3. ICE candidate relay
4. Client disconnect cleanup
5. Room auto-deletion on empty

### 4. E2E Tests (Playwright)

**Location**: `e2e/` (if configured)

**Framework**: Playwright

**Commands**:
```bash
cd e2e && npx playwright test
```

**Scenarios**:
1. Open two browser tabs
2. Both join same room
3. Initiate call
4. Verify media streams established
5. Hangup and verify cleanup

## BDD Feature Files

### Room Join Feature

```gherkin
Feature: Room Join
  As a user
  I want to join a room
  So that I can communicate with other users

  Scenario: Successful join
    Given a WebSocket connection to the server
    When I send a "join" message with room "test-room" and id "alice"
    Then I receive a "joined" message
    And I receive a "room_members" message with ["alice"]

  Scenario: Duplicate ID
    Given "alice" has joined "test-room"
    When another client sends a "join" message with id "alice"
    Then I receive an "error" message with code "duplicate_id"

  Scenario: Room full
    Given "test-room" has 50 clients
    When a new client sends a "join" message for "test-room"
    Then I receive an "error" message with code "room_full"
```

### Call Establishment Feature

```gherkin
Feature: Call Establishment
  As a user
  I want to call another user
  So that we can have a peer-to-peer conversation

  Scenario: SDP exchange
    Given "alice" and "bob" are in "test-room"
    When "alice" sends an "offer" to "bob"
    Then "bob" receives the "offer" with "from" set to "alice"
    And "from" field is overridden by the server

  Scenario: ICE relay
    Given "alice" and "bob" are connected
    When "alice" sends a "candidate" to "bob"
    Then "bob" receives the "candidate"
```

### Cleanup Feature

```gherkin
Feature: Connection Cleanup
  As a system
  I want to clean up resources on disconnect
  So that no zombie connections remain

  Scenario: Client disconnect
    Given "alice" and "bob" are in "test-room"
    When "alice" disconnects
    Then "bob" receives a "room_members" message with ["bob"]
    And "alice" is removed from Hub.clients
    And "alice"'s WebSocket is closed

  Scenario: Empty room deletion
    Given "alice" is alone in "test-room"
    When "alice" disconnects
    Then "test-room" is deleted from Hub.rooms
```

## Performance Benchmarks

| Benchmark | Target |
|:----------|:-------|
| 100 concurrent joins | < 1s |
| Message routing (1000 msgs) | < 50ms avg |
| Memory at 50 clients/room | < 3 MB |

## CI Integration

All tests run on every PR via GitHub Actions (`.github/workflows/ci.yml`):

```yaml
- Run tests
  run: go test -race -count=1 ./...

- Run linter
  run: golangci-lint run
```
