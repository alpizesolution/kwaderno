# Kwaderno

**Ang sarili mong kwaderno sa gitna ng ingay.**

Kwaderno is a private, offline-first digital diary designed for everyday reflection. The app is built mobile-first, with a warm paper-inspired interface and local-first storage.

## Principles

- Writing comes first; no streaks, scores, or guilt-driven engagement.
- Diary entries stay on the device by default.
- Offline access is a core requirement, not an afterthought.
- Backup and restore must be explicit and understandable.
- Security claims must match the implementation.

## Planned stack

- Vite + React + TypeScript
- Dexie.js / IndexedDB for local persistence
- Vite PWA / Workbox for app-shell caching
- Web Crypto API for a carefully designed encryption layer

## Development status

Initial setup. Encryption, vault/key lifecycle, diary persistence, and backup flows must be implemented and tested before storing real private entries.
