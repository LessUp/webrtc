# 2026-03-09 — GitHub Pages & Code Quality

> Type: `feat` | Impact: Medium

## Summary

GitHub Pages setup with Jekyll, comprehensive linting configuration, and expanded test coverage.

## Changes

### GitHub Pages

- **feat:** Jekyll configuration with SEO support
- **feat:** Custom homepage (`index.md`)
- **feat:** Custom 404 page
- **feat:** Changelog index page

### Go Backend

- **feat:** `.golangci.yml` with 11 linters
- **test:** 11 new test cases for edge cases

### CI/CD

- **feat:** Separate `lint` job
- **feat:** Coverage output

### Frontend

- **feat:** Meta description and theme-color tags
- **feat:** SVG emoji favicon

## Files Changed

- `_config.yml`
- `index.md`
- `404.md`
- `CHANGELOG.md`
- `.golangci.yml`
- `internal/signal/hub_test.go`
- `.github/workflows/ci.yml`
- `web/index.html`
