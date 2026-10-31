---
covers:
  - README.md
  - CONTRIBUTING.md
  - AGENTS.md
  - CLAUDE.md
  - LICENSE
docs:
  - README.md
journeys:
  - scaffold-docs
---

# Docs

The pages the user reads first.

## Sub-features

- `scaffold-docs`: every `pnpm` command the README names exists as a script, it names the services, dev, frontend, build and verify commands, and CONTRIBUTING, AGENTS.md and the license are in the new module.

## How to get to it (user POV)

- Opening the README of a new module.

## Driving it with antelopejs-verify

```bash
pnpm exec antelopejs-verify journey "$RUN" docs
```

## Gotchas

- The check reads the README of the created copy, not of this repository.
