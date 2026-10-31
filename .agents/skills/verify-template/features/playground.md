---
covers:
  - playground/**
  - compose.yaml
docs:
  - README.md
journeys:
  - playground-dev
---

# Playground

The development host the README tells the user to run: DMS, MongoDB and the providers around the module, with the module's welcome page behind the platform-owner gate.

## Sub-features

- `playground-dev`: after `pnpm build`, `ajs project dev` in `playground/` against a MongoDB container starts the API, registers `/modules/example/welcome/...` owner-only, refuses an anonymous request to it, creates the default tenant in MongoDB (read back with mongosh), and Ctrl+C exits 130. The journey moves the API from port 5010 to a free port in the created copy so two runs never clash.

## How to get to it (user POV)

- `pnpm services:up`, then `pnpm dev` in a new module.

## Driving it with antelopejs-verify

```bash
pnpm exec antelopejs-verify journey "$RUN" playground
```

## Gotchas

- The first start downloads the DMS providers from the package registry, so this journey needs network access and takes minutes.
- Creating the first administrator and reading the page as the owner is a browser flow (`pnpm frontend:dev`); no journey reaches it, so the owner-only page itself is not shown, only that anonymous access is refused.
- The compose file's MongoDB and Mailpit are stood in for by the run's own MongoDB container; the email provider is configured but never sends in this journey.
