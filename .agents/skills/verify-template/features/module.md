---
covers:
  - src/**
  - package.json
  - pnpm-lock.yaml
  - pnpm-workspace.yaml
  - .nvmrc
docs:
  - README.md
journeys:
  - scaffold-shape
  - module-build
---

# Module

The module the user gets: the backend that registers a DMS module and one page, the manifest that points the runtime at `dist`, and the pnpm workspace that installs the backend and the frontend together.

## Sub-features

- `scaffold-shape`: `ajs module init` creates a `package.json` naming `antelopejs-dms-module`, `dist/index.js` and the documented scripts, with the backend page, the Vue frontend package, the playground and the compose file in place.
- `module-build`: `pnpm run build` writes `dist/index.js` whose exports are exactly `construct,start`, and `dist/pages/welcome.js` defines `WelcomePage`.

## How to get to it (user POV)

- `ajs module init my-module --template "DMS Module Typescript"`, then `pnpm install` and `pnpm build`.

## Driving it with antelopejs-verify

```bash
pnpm exec antelopejs-verify journey "$RUN" module
```

## Gotchas

- Every journey creates the module from an offline manifest of this working tree and installs with `pnpm install --frozen-lockfile`; nothing reaches GitHub.
