# Feature map

One file per feature. `covers:` lists the source globs it owns, `docs:` the pages a verdict judges, and `journeys:` the journeys it runs. `pnpm exec antelopejs-verify map` checks that every user-facing file is covered: in a template that is every file `ajs` copies.

| Feature | What the user does | Journeys |
|---|---|---|
| [module](module.md) | Creates a DMS module and builds it. | scaffold-shape, module-build |
| [frontend](frontend.md) | Tests and verifies the Vue frontend. | frontend-test, frontend-test-fails, frontend-verify |
| [tooling](tooling.md) | Runs typecheck, lint, knip and `pnpm run checks`. | scaffold-lint-rejects, scaffold-checks |
| [docs](docs.md) | Reads the README, CONTRIBUTING and the license. | scaffold-docs |
| [git](git.md) | Commits in a module whose `.gitignore` the template wrote. | scaffold-gitignore |
| [smoke](smoke.md) | The fixed journey every verdict runs: create, install, build. | module-build |

## Driving it with antelopejs-verify

```bash
pnpm exec antelopejs-verify journey "$RUN" smoke
```

## Gotchas

- The smoke feature covers no glob, so it never marks a file as mapped.
- `covers:` lists every file a feature's journeys read, install included: `pnpm install` reads `.npmrc` and the frontend's `package.json` and `pnpm-lock.yaml`, and runs `lefthook install` from `prepare`, which reads `lefthook.yml`. A broken copy of any of them fails every journey that installs, so every feature with such a journey covers them. `pnpm run checks` type-checks, lints and formats `src/`, `frontend-vue/` and `playground/`, and `sync:check` compares the managed block of `AGENTS.md`, so `tooling` covers them too. The first commit's hook checks the size of every file it commits, so `tooling` covers every file the template copies. The shared files (`package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `tsconfig.json`) are left out of every `covers:`: a change to one runs every feature. A `**` glob skips dotfiles, so `tooling` names each dotfile.
- The template creates modules, not projects: the journeys run `ajs module init` against the offline manifest. The shared `scaffold-dev` and `scaffold-checks` journeys run `ajs project init`, so no feature names them.
- The playground needs MongoDB, Mailpit and the DMS providers downloaded at start, with the first administrator created in a browser, so no journey starts it; see the Attention section of the PR that added this layer.
