---
covers:
docs:
  - README.md
journeys:
  - module-build
---

# Smoke

The fixed journey every verdict runs, whatever the diff touches: create a module through `ajs module init` from an offline manifest, install, build, and load what the build wrote.

## Sub-features

- `module-build`: as in [module](module.md).

## How to get to it (user POV)

- `ajs module init my-module --template "DMS Module Typescript" --pm pnpm`, then `pnpm install` and `pnpm build`.

## Driving it with antelopejs-verify

```bash
pnpm exec antelopejs-verify journey "$RUN" smoke
```

## Gotchas

- The smoke feature covers no glob, so it never marks a file as mapped.
