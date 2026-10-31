---
covers:
  - frontend-vue/**
docs:
  - README.md
journeys:
  - frontend-test
  - frontend-test-fails
  - frontend-verify
---

# Frontend

The Vue frontend package the DMS loader mounts: the `example-welcome` component and its registration.

## Sub-features

- `frontend-test`: `pnpm test` renders the welcome component under Vitest and passes.
- `frontend-test-fails`: a failing test added under `frontend-vue/tests` makes `pnpm test` fail with its message.
- `frontend-verify`: `pnpm frontend:verify` builds and type-checks the frontend against the installed DMS without a backend.

## How to get to it (user POV)

- `pnpm test` and `pnpm frontend:verify` in a new module.

## Driving it with antelopejs-verify

```bash
pnpm exec antelopejs-verify journey "$RUN" frontend
```

## Gotchas

- The frontend is a separate pnpm workspace package with its own lockfile; the root install covers it.
