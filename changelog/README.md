# Changelog

All notable changes to this project are documented here, organized by [Semantic Versioning](https://semver.org/).

---

## Version History

| Version | Date | Description | Impact |
|:--------|:-----|:------------|:-------|
| **[v1.0.0](1.0.0.md)** | 2026-04-16 | 🎉 Production release with full documentation | High |
| **[v0.9.0](0.9.0.md)** | 2026-02-13 | Major refactoring, modular architecture | High |
| **[v0.8.0](0.8.0.md)** | 2025-12-18 | DataChannel chat, Mesh multi-party calls | High |
| **[v0.1.0](0.1.0.md)** | 2025-02-13 | Project infrastructure, initial setup | Low |

---

## Versioning Schema

This project follows [Semantic Versioning](https://semver.org/):

```
MAJOR.MINOR.PATCH
```

| Component | When to Increment | Example |
|:----------|:------------------|:--------|
| **MAJOR** | Incompatible API changes, breaking features | 1.0.0 → 2.0.0 |
| **MINOR** | New features, backward compatible | 1.0.0 → 1.1.0 |
| **PATCH** | Bug fixes, backward compatible | 1.0.0 → 1.0.1 |

---

## Change Categories

Each change is tagged with a category prefix:

| Prefix | Category | Description |
|:-------|:---------|:------------|
| `feat:` | Features | New functionality |
| `fix:` | Bug Fixes | Fixes for existing features |
| `refactor:` | Refactoring | Code improvements without feature changes |
| `docs:` | Documentation | Documentation updates |
| `test:` | Tests | Test additions or improvements |
| `chore:` | Chores | Build, CI, tooling changes |
| `perf:` | Performance | Performance improvements |
| `security:` | Security | Security-related changes |

---

## Feature Highlights by Version

### v1.0.0 — Production Ready
- ✅ Complete bilingual documentation (EN/ZH)
- ✅ API reference and troubleshooting guides
- ✅ Docker Compose deployment with HTTPS/TURN
- ✅ Comprehensive test coverage

### v0.9.0 — Code Quality
- ✅ Modular frontend architecture
- ✅ Go multi-version CI testing
- ✅ Static analysis with staticcheck
- ✅ Multi-stage Docker builds

### v0.8.0 — Multi-party Support
- ✅ WebSocket signaling with room management
- ✅ Mesh topology for multi-party calls
- ✅ DataChannel peer-to-peer chat
- ✅ Screen sharing and local recording

### v0.1.0 — Foundation
- ✅ Basic 1-on-1 WebRTC calls
- ✅ Go backend with Gorilla WebSocket
- ✅ Project documentation setup

---

## Archived Changelogs

Earlier development logs are preserved in the [`archive/`](archive/) directory:

- `2025-02-13_project-infrastructure.md`
- `2025-12-18.md`
- `2026-02-13.md`
- `2026-03-09_pages-and-quality.md`
- `2026-03-09_stability-and-security.md`
- `2026-03-10_pages-optimization.md`
- `2026-03-10_workflow-deep-standardization.md`

---

## Contributing

When submitting changes, please categorize your contribution:

1. Use appropriate commit prefixes (`feat:`, `fix:`, `docs:`, etc.)
2. Update the relevant changelog file
3. For major changes, update this README index

See [CONTRIBUTING.md](../CONTRIBUTING.md) for detailed guidelines.

---

**Latest Release**: [v1.0.0](1.0.0.md) · **Updated**: 2026-04-16
