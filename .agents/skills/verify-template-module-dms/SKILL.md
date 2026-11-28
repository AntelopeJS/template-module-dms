---
name: verify-template-module-dms
description: How to check a change in AntelopeJS/template-module-dms before you push it, scoped to what you touched. The command for each kind of change (backend, Vue frontend, playground, template tests, docs, synced files), the tools, the services, the worker cap, and what CI and the merge queue run instead of you. Use after you edit this template, before you commit or push.
---

# Verify template-module-dms

CI runs every check on every pull request, and the merge queue runs the full suite again on the merged result. You check only what you changed. Run every command from the repository root.

## Setup

Once per checkout: `.agents/setup`. It switches to the Node major of `.nvmrc` (24), activates the pnpm of `packageManager` through corepack and runs `pnpm install --frozen-lockfile`, which also installs `frontend-vue/` from its own lockfile.

## What to run for your change

| You changed | Run |
| --- | --- |
| Any `.ts` file outside `frontend-vue/` | `pnpm exec oxlint <files>` and `pnpm exec oxfmt --check <files>`. |
| Backend source in `src/`, or `playground/` | `pnpm run typecheck`. It checks `src/` and `playground/` in about 3 s, so run it whole. |
| A page, a `CustomComponent`, or `src/frontend-module.ts` | `pnpm --dir frontend-vue lint`. Its last step checks every `CustomComponent` name against the frontend's registration. |
| A `.vue` or `.ts` file in `frontend-vue/` | `pnpm --dir frontend-vue exec eslint <files>` and `pnpm --dir frontend-vue exec prettier --check <files>`, with the paths relative to `frontend-vue/`. |
| Frontend behaviour | `pnpm --dir frontend-vue exec vitest run tests/<file>.test.ts --maxWorkers=4`. |
| A frontend dependency, `dms.frontend.ts` or the `engines` range | `pnpm frontend:verify`. It builds and type-checks the frontend against the installed DMS in about 30 s, with no backend. |
| A template test in `.github/scripts/template/` | `pnpm exec tsc -p .github/scripts/template`, then `node --test --test-concurrency=4 .github/scripts/template/<file>.test.ts`. Each file runs `ajs module init` and installs the new module from the registry, so it needs the network and takes minutes. |
| `README.md`, `AGENTS.md` or another Markdown file | `pnpm exec oxfmt --check <files>`. A command the README names must be a `package.json` script: `docs.test.ts` checks it. |
| A lint directive, `@ts-expect-error` or `SAFETY:` comment | `pnpm run suppressions`. After you remove one, run `pnpm run suppressions:update` and commit `guardrails.suppressions.json`. |
| A file `antelopejs-sync` writes (`ci.yml`, `lefthook.yml`, the Guardrails block of `AGENTS.md`, the synced skills) | Nothing by hand. Bump `@antelopejs/tooling-configs`, run `pnpm run sync`, then `pnpm run sync:check`. |

The commit hook formats and lints the staged files again.

## Services

No check above needs a service. `compose.yaml` starts MongoDB and Mailpit only for the running module (`pnpm services:up`, `pnpm dev`, `pnpm frontend:dev`), which CI does not drive and this skill does not ask for.

## Left to CI

`ci.yml` calls `AntelopeJS/.github/.github/workflows/ci-node.yml@v2`. Its `ci / checks` job and the `verdict` job are the required checks. Do not run these locally:

- `pnpm run checks` in full: typecheck, oxlint and the frontend's ESLint and Prettier, oxfmt, knip, the Vitest suite, size and sync.
- `pnpm build` and `pnpm frontend:verify` on every run, from the `extra-commands` of the `ci` job.
- The template tests of `.github/scripts/template/`, on Linux, in every tier except fast.
- The Windows legs, in the nightly tier and on a manual run with `nightly`.
- The module locks, in the `module-locks` job.

When a CI check fails, reproduce that check or test file with its row above, fix it, and push.

## Done

The change is checked when every row its diff touches passed, with each command and its output shown in your reply or pull request. A row that cannot run, such as a template test without the network, says why, and you name it as left to CI.
