# Specifications Index

This directory is the **Single Source of Truth** for the WebRTC project. All code implementations must comply with these specifications.

---

## Table of Contents

- [Directory Structure](#directory-structure)
- [Quick Links](#quick-links)
- [Development Workflow](#development-workflow)
- [How to Write Specs](#how-to-write-specs)

---

## Directory Structure

| Directory | Purpose | Files |
|:----------|:--------|:------|
| **[product/](product/webrtc-platform.md)** | Product feature definitions and acceptance criteria | [WebRTC Platform](product/webrtc-platform.md) |
| **[rfc/](rfc/)** | Technical design documents and architecture decisions (RFCs) | [RFC-0001: Signaling Server](rfc/0001-signaling-server.md), [RFC-0002: Frontend Architecture](rfc/0002-frontend-architecture.md) |
| **[api/](api/signaling.yaml)** | API interface definitions (OpenAPI, protocols) | [Signaling API](api/signaling.yaml) |
| **[db/](db/schema.md)** | Database/storage schema specifications | [Schema](db/schema.md) |
| **[testing/](testing/testing-spec.feature)** | BDD test specifications and acceptance criteria | [Testing Spec](testing/testing-spec.feature) |

---

## Quick Links

| Spec | Description |
|:-----|:------------|
| **[Product Spec](product/webrtc-platform.md)** | Features, user roles, acceptance criteria, state machine |
| **[RFC-0001: Signaling Server](rfc/0001-signaling-server.md)** | Go backend architecture, Hub/Client design |
| **[RFC-0002: Frontend Architecture](rfc/0002-frontend-architecture.md)** | Vanilla JS modules, state management |
| **[API Spec (OpenAPI)](api/signaling.yaml)** | WebSocket message types and schemas |
| **[Testing Spec](testing/testing-spec.feature)** | BDD scenarios with Gherkin syntax |

---

## Development Workflow

This project follows **Spec-Driven Development (SDD)**. The four-step workflow:

| Step | Action | Description |
|:-----|:-------|:------------|
| **1. Review Specs** | Read this directory | Understand existing definitions before coding |
| **2. Spec-First Update** | Update spec first | For new features or interface changes, update spec before code |
| **3. Implementation** | Write code | Code must 100% comply with spec definitions |
| **4. Test Against Spec** | Write tests | Cover all acceptance criteria from spec |

**See [AGENTS.md](../AGENTS.md) for the complete workflow.**

---

## How to Write Specs

### Product Spec (product/)

Product specs define **what** the system should do:

```markdown
# Feature Name - Product Specification

## Overview
Brief description of the feature.

## Core Features
- Feature 1
- Feature 2

## User Roles
| Role | Capabilities |
|:-----|:-------------|
| User | ... |
| Admin | ... |

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2

## State Machine (if applicable)
State diagram showing transitions.
```

### RFC (rfc/)

RFCs define **how** the system should be built:

```markdown
# RFC-NNNN: Title

## Summary
Brief summary of the proposal.

## Motivation
Why this change is needed.

## Detailed Design
Technical approach, architecture decisions.

## Alternatives Considered
Other approaches and why they were rejected.

## Security Implications
Security considerations.

## References
Links to related specs or external resources.
```

### API Spec (api/)

API specs use OpenAPI 3.0 format:

```yaml
openapi: 3.0.0
info:
  title: API Title
  version: 1.0.0

components:
  schemas:
    Message:
      type: object
      properties:
        type:
          type: string
        # ...
```

### Testing Spec (testing/)

Testing specs use Gherkin syntax:

```gherkin
Feature: Feature Name

  Scenario: Scenario description
    Given some precondition
    When some action
    Then some expected result
```

---

## Spec-Code Synchronization

| Rule | Description |
|:-----|:------------|
| **Spec is Truth** | Code must match spec, not vice versa |
| **Spec-First** | Update spec before implementing changes |
| **No Gold-Plating** | Don't add features not in spec |
| **Test Coverage** | Tests must cover all acceptance criteria |

---

**See Also**: [AGENTS.md](../AGENTS.md) | [CONTRIBUTING.md](../CONTRIBUTING.md)
