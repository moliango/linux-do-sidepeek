# AGENTS.md

## Project Overview
- This repository is an unpacked Chromium extension for `linux.do` topic-list drawer preview.
- There is no build step; source files are shipped directly.

## Files That Matter
- `manifest.json`: extension metadata, permissions, and content script matches.
- `src/content.js`: drawer behavior, preview rendering, settings, and keyboard interactions.
- `src/content.css`: drawer layout and settings panel styles.
- `assets/post/`: README and post screenshots only; not required for release packaging.
- `.github/workflows/release.yml`: GitHub Release packaging workflow.

## Working Rules
- Keep changes minimal and focused; avoid broad refactors.
- Use plain JavaScript and CSS compatible with Chromium Manifest V3 content scripts.
- Prefer updating `README.md`, `manifest.json`, and `POST_OVERVIEW.md` together when product name, version, or user-facing behavior changes.
- If you add permissions or matched pages, update both `manifest.json` and `README.md`.
- Keep release artifacts limited to runtime files unless the task explicitly asks otherwise.

## Release Notes
- Release packaging should include `manifest.json` and `src/`.
- GitHub Releases are created from tags matching `v*`.
