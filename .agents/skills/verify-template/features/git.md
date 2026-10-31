---
covers:
  - .gitignore
  - .npmrc
  - frontend-vue/.gitignore
  - frontend-vue/.npmrc
  - playground/.env.example
docs:
  - README.md
journeys:
  - scaffold-gitignore
---

# Git

What git and npm leave out of every module created from the template; a dropped line commits secrets or build output.

## Sub-features

- `scaffold-gitignore`: `.env` (also in `playground/`), `node_modules`, `dist`, the frontend's `node_modules` and the playground's `.antelope` are ignored, sources and `.env.example` are not, and after install, build and a playground `.env` no secret, dependency or build file is left untracked. This is the Exposure door's journey.

## How to get to it (user POV)

- `git status` in a new module.

## Driving it with antelopejs-verify

```bash
pnpm exec antelopejs-verify journey "$RUN" git
```

## Gotchas

- `.agents/skills/` and `.claude/skills/` are ignored by the template, so the created module does not carry this repository's verification skill.
