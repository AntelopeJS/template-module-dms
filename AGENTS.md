# AntelopeJS DMS module

A reusable AntelopeJS DMS module built from the `template-module-dms` template. Every file here, this one included, is the starting point of a generated module; `antelopejs-dms-module`, the `example` module ID and `example-frontend-vue` are placeholders to rename (see the README's "Make it yours").

## Layout

- `src/` is the backend module: `index.ts` holds the lifecycle, `pages/` the DMS pages. Register modules before importing their pages in `construct()`, and register the frontend in `start()` after DMS connects.
- `frontend-vue/` is the Vue frontend, a pnpm workspace package with its own lockfile (`shared-workspace-lockfile=false`). ESLint, Prettier and Vitest own it, not oxlint and oxfmt. Keep `CustomComponent` names aligned with its `componentPrefix` and registration names, and its `engines` range on `@antelopejs/dms-frontend` including the root devDependency's version and capped below the next minor: the loader refuses the module outside it.
- `playground/` is the development host, not part of the published package. Keep DMS providers and development credentials there. The frontend scripts run from `playground/` so the loader finds the backend's `.antelope` discovery files.

Module pages require platform-owner access.

## Checks

Finish every change with `pnpm run checks`: typecheck, lint (oxlint and the frontend's ESLint and Prettier), format, knip, `pnpm test` (the frontend's Vitest suite), size, ratchet and sync, printing only what failed. `guardrails.ratchet.json` records accepted lint findings and oversize files; its numbers only go down, and a rule listed there is checked by the ratchet instead of `oxlint`. After you remove debt, run `pnpm run ratchet:update` and commit the lowered file. The pre-commit hook rejects new findings on the lines you add. `prepare` installs the hooks only inside a git work tree: in a new project, run `pnpm install` again after `git init`.

`pnpm run checks` does not cover these; CI runs the first two after it:

- `pnpm build`, which compiles the published module to `dist/`.
- `pnpm frontend:verify`, which builds and type-checks the frontend against the installed DMS without a backend.
- The running module: start `pnpm services:up`, `pnpm dev` and `pnpm frontend:dev`, then check the affected page in the browser.

## DMS guidance

For DMS architecture, page or component changes, load the `dms`, `dms-module` and `dms-pages` skills shipped with the installed `@antelopejs/dms` package. For frontend SDK changes, read the [frontend module guide](https://github.com/AntelopeJS/dms/blob/main/packages/dms/docs/02.building/08.frontend-layer.md); for the development workflow, use `dms-project` and this repository's README.

If these skills are missing, install the [AntelopeJS agent skills plugin](https://github.com/AntelopeJS/agent-skills). Claude Code can run `/antelopejs:sync-skills`; Codex can run `npx -y github:AntelopeJS/agent-skills sync --target codex` from the module root after dependency installation.

<!-- antelopejs-guardrails:start -->
<!-- Managed by @antelopejs/tooling-configs. `antelopejs-sync` rewrites everything between these markers; write repository-specific guidance outside them. -->

## Guardrails

Lint with `oxlint` and format with `oxfmt`; both read the configs at the repository root. Fix every finding: no rule warns.

### Comments

Say it in code. A constraint belongs in a type, a lint rule, or a test. A public item's contract belongs in TSDoc (`/** */`) on that item. The only other comments are lint directives that name their rules, `@ts-expect-error <reason>`, `SAFETY: <reason>` above a type assertion, `/*!` license headers, and bundler or formatter directives.

### Tests

Hold every test you write or keep to this checklist:

- Name the wrong implementation this test fails on. A test with no answer is deleted, not kept.
- No test reads the file it tests. Drive the behaviour through the public interface.
- An invariant over many files is a lint rule, not a test.

### What enforces what

| Rule                                                                           | Enforced by                               |
| ------------------------------------------------------------------------------ | ----------------------------------------- |
| Formatting                                                                     | oxfmt                                     |
| Lint findings are errors; no rule warns                                        | oxlint preset                             |
| Comments are TSDoc, directives, or `SAFETY:` only                              | `antelopejs/no-comments`                  |
| Every test asserts                                                             | `antelopejs/require-assertion`            |
| Tests read no files outside fixtures, helpers, locales                         | `antelopejs/no-fs-read-in-tests`          |
| No assertion that restates a constant                                          | `antelopejs/no-constant-value-assertion`  |
| No test whose only check is "is a function"                                    | `antelopejs/no-typeof-function-only-test` |
| Params ≤ 5, function ≤ 120 lines, file ≤ 500 lines, depth ≤ 4, complexity ≤ 20 | `eslint/max-*`, `eslint/complexity`       |

<!-- antelopejs-guardrails:end -->
