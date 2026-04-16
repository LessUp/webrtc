# 2026-03-10 — Workflow Standardization

> Type: `chore` | Impact: Low

## Summary

GitHub Actions workflow standardization and optimization.

## Changes

- **chore:** Renamed CI workflow `go.yml` → `ci.yml`
- **chore:** Unified `permissions` and `concurrency` configuration
- **feat:** Added `actions/configure-pages@v5` step
- **feat:** Added `paths` filter to reduce unnecessary builds

## Files Changed

- `.github/workflows/ci.yml`
- `.github/workflows/pages.yml`

## Benefits

- Consistent workflow naming
- Reduced CI minutes with path filtering
- Better concurrency handling
