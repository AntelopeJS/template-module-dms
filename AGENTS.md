# AntelopeJS DMS module

A reusable AntelopeJS DMS module built from the `template-module-dms` template. Every file here, this one included, is the starting point of a generated module; `antelopejs-dms-module`, the `example` module ID and `example-frontend-vue` are placeholders to rename (see the README's "Make it yours").

## Layout

- `src/` is the backend module: `index.ts` holds the lifecycle, `pages/` the DMS pages, and `frontend-module.ts` the frontend registration that `dmsFrontend` in `package.json` names for `ajs dms`. Keep that file free of runtime imports beyond Node built-ins: `ajs dms` loads it without the backend. Register modules before importing their pages in `construct()`, and register the frontend in `start()` after DMS connects.
- `frontend-vue/` is the Vue frontend, a pnpm workspace package with its own lockfile (`shared-workspace-lockfile=false`). ESLint, Prettier and Vitest own it, not oxlint and oxfmt. Keep `CustomComponent` names aligned with its `componentPrefix` and registration names, and its `engines` range on `@antelopejs/dms-frontend` including the root devDependency's version and capped below the next minor: the loader refuses the module outside it.
- `playground/` is the development host, not part of the published package. Keep DMS providers and development credentials there. The frontend scripts run from `playground/` so the loader finds the backend's `.antelope` discovery files.

Module pages require platform-owner access.

## Checks

Finish every change with `pnpm run checks`: typecheck, lint (oxlint and the frontend's ESLint and Prettier), format, knip, `pnpm test` (the frontend's Vitest suite), size and sync, printing only what failed. The pre-commit hook rejects new findings on the lines you add. `prepare` installs the hooks only inside a git work tree: in a new project, run `pnpm install` again after `git init`.

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

CI runs `pnpm run checks` in full on every pull request and reports what failed. The commit hook formats and lints the staged files. Locally, check only what you touched, one test file and not the suite, as the [`verify-template-module-dms`](.agents/skills/verify-template-module-dms/SKILL.md) skill says.

### Comments

Say it in code: a constraint in a type, a lint rule or a test, a public item's contract in TSDoc. Other comments are lint directives naming their rules, `@ts-expect-error <reason>`, `SAFETY: <reason>` above a type assertion, and license or tool directives. A reason states what the code does now.

### Tests

Each test names the wrong implementation it fails on, or is deleted. Drive behaviour through the public interface. An invariant over many files is a lint rule.

### Review

No tool checks these:

- A type guard checks the nested elements and values it claims.
- A no-upward import rule rejects same-tier peers; probe it with an import.
- A finding only an evasion or a patched internal can trigger goes under Attention and never blocks.

### Suppressions

`guardrails.suppressions.json` caps lint directives, `@ts-expect-error`, `SAFETY:` comments and rules a lint config turns off. Over a cap, fix the code or remove another suppression of that kind; only the operator raises a number. After removing suppressions, run `pnpm run suppressions:update` and commit the file.

<!-- antelopejs-guardrails:end -->
