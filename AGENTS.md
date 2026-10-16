# AntelopeJS DMS module

This repository is a reusable module; `playground/` is its development host, not part of the published package. Keep DMS providers and development credentials in the playground. The frontend is a separate Vue package with its own ESLint, Prettier and Vitest configuration.

For DMS architecture, page or component changes, load the `dms`, `dms-module` and `dms-pages` skills shipped with the installed `@antelopejs/dms` package. For frontend SDK changes, read the [frontend module guide](https://github.com/AntelopeJS/dms/blob/main/packages/dms/docs/02.building/08.frontend-layer.md); for the development workflow, use `dms-project` and this repository's README. The frontend scripts run from `playground/` so the loader finds the backend's `.antelope` discovery files.

If these skills are missing, install the [AntelopeJS agent skills plugin](https://github.com/AntelopeJS/agent-skills). Claude Code can run `/antelopejs:sync-skills`; Codex can run `npx -y github:AntelopeJS/agent-skills sync --target codex` from the module root after dependency installation.

Register modules before importing their pages in `construct()`, and register the frontend in `start()` after DMS connects. Keep `CustomComponent` names aligned with the frontend SDK prefix and registration names. Module pages require platform-owner access.
