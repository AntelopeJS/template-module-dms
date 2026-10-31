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

Prove a change works with the verification skill in [`.agents/skills/verify-template/SKILL.md`](.agents/skills/verify-template/SKILL.md) before you call it done.

### Comments

Say it in code. A constraint belongs in a type, a lint rule, or a test. A public item's contract belongs in TSDoc (`/** */`) on that item. The only other comments are lint directives that name their rules, `@ts-expect-error <reason>`, `SAFETY: <reason>` above a type assertion, `/*!` license headers, and bundler or formatter directives.

Before suppressing a type rule, try inference or a type derived from its owner with `Parameters`, `ReturnType`, or indexed access. A private alias can still appear in a published declaration. Keep a suppression only after checking the published contract and the unchecked boundary it protects.

Check each directive reason against the current line and its callers. Returning a value is not the same as awaiting and discarding it. A reason must describe what the code does now.

### Tests

Hold every test you write or keep to this checklist:

- Name the wrong implementation this test fails on. A test with no answer is deleted, not kept.
- No test reads the file it tests. Drive the behaviour through the public interface.
- An invariant over many files is a lint rule, not a test.

### Cleanup proof

A behaviour-preserving cleanup PR shows `antelopejs-api-diff <base-ref>` passing. Published declarations, built runtime exports and the names and signatures a DMS frontend module auto-imports stay unchanged; pass `--allow-added <glob>` (repeatable, e.g. `'**/internal/**'`) to let added entries under that glob pass when their module is `@internal`, and copy its "Added (allowed)" list. Every export under a directory that `dms.frontend.build.ts` auto-imports is published, `@internal` or not; a helper that must stay private goes under `app/build/`. A comment-only PR shows `antelopejs-comment-proof <base-ref>` passing instead of a verifier. Both compare committed HEAD.

Copy the proof's whole output into the PR body, down to its closing `<!-- antelopejs-proof ... -->` line, which stamps the command, base, committed head and a digest. Never type counts by hand. List the lint findings a PR leaves in place by pasting the block `antelopejs-body-check --findings` prints and replacing each `<why>`. `antelopejs-body-check <body.md>` fails an edited or stale proof block, proof output outside one, and a findings line that is not a live diagnostic at HEAD; counts in prose are not checked, so leave them out. The table counts a lint directive once per rule it names, inline directives included.

Pass `--probe <file.cjs>` to api-diff when changing receivers, positional calls, or modules that no published entry reaches. The same captured script runs against both worktree roots, supplied as `argv[2]`, and prints JSON observations. Matching metadata alone does not prove those behaviours.

An entry-only rule exempts only its own module. Add a second module entry rather than exempting another importer. A no-upward rule must reject peers in the same tier as well as higher tiers. Probe the rank decision with an import, not just a reading of the configuration.

Moving a method body into a function keeps how it is called: the same receiver, argument count, read order and laziness.

Verify a boundary against the imports a developer or agent would plausibly write: static and dynamic imports, re-exports, Vue `src`, CSS `@import`, and worker or child-process entries in normally named files. A construction only an evasion would write, an edit to resolution configuration (`package.json` `browser`, `exports`, `main` or `imports`, bundler aliases, tsconfig `paths`), and a difference observable only by patching private fields or internal methods go under Attention and never block. Public API and ordinary subclass behaviour stay part of the contract.

### What enforces what

| Rule                                                                           | Enforced by                                         |
| ------------------------------------------------------------------------------ | --------------------------------------------------- |
| Formatting                                                                     | oxfmt                                               |
| Lint findings are errors; no rule warns                                        | oxlint preset                                       |
| Comments are TSDoc, directives, or `SAFETY:` only                              | `antelopejs/no-comments`                            |
| Every test asserts                                                             | `antelopejs/require-assertion`                      |
| Tests read no files outside fixtures, helpers, locales                         | `antelopejs/no-fs-read-in-tests`                    |
| Tests import the code under test from local source, not their own package name | `antelopejs/no-self-import-in-tests`                |
| No assertion that restates a constant                                          | `antelopejs/no-constant-value-assertion`            |
| No test whose only check is "is a function"                                    | `antelopejs/no-typeof-function-only-test`           |
| String-keyed object tables are read through own keys only                      | `antelopejs/no-inherited-key-lookup`                |
| A type guard checks each member it narrows to; keys with `Object.hasOwn`       | `antelopejs/no-presence-only-type-guard`            |
| A type guard checks the nested elements and values it claims                   | review; no tool                                     |
| Params ≤ 5, function ≤ 120 lines, file ≤ 500 lines, depth ≤ 4, complexity ≤ 20 | `eslint/max-*`, `eslint/complexity`                 |
| Cleanup preserves declarations, runtime exports and DMS auto-imports           | `antelopejs-api-diff <base-ref>`                    |
| Comment-only changes preserve JavaScript emit                                  | `antelopejs-comment-proof <base-ref>`               |
| PR-body proof tables are copied unedited from the current head                 | `antelopejs-body-check <body.md>`                   |
| PR-body findings-left lines are live diagnostics at HEAD                       | `antelopejs-body-check <body.md>`                   |
| Receiver, positional and unpublished-module behaviour                          | `antelopejs-api-diff <base-ref> --probe <file.cjs>` |
| Directive and `SAFETY:` reasons are true of the code                           | review; no tool                                     |
| Evasion-only and patched-internal findings go under Attention                  | review; no tool                                     |
| No-upward rules reject same-tier peers                                         | review and import probes                            |
| No `@ts-ignore`                                                                | `typescript/ban-ts-comment`                         |
| No once-used type parameter standing in for `unknown`                          | `typescript/no-unnecessary-type-parameters`         |
| No `any` passed, assigned or returned where a type is declared                 | `typescript/no-unsafe-{argument,assignment,return}` |

<!-- antelopejs-guardrails:end -->
