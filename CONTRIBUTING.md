# Contributing to AntelopeJS

Search existing issues before opening a new one, and discuss substantial behavior changes in an issue first. Follow the [Code of Conduct](https://github.com/AntelopeJS/.github/blob/main/CODE_OF_CONDUCT.md) and report vulnerabilities privately through the [security policy](https://github.com/AntelopeJS/.github/blob/main/SECURITY.md).

## Development

1. Create a focused branch from `main`.
2. Follow the setup instructions in [README.md](./README.md), keeping both pnpm lockfiles intact.
3. Make the smallest change that solves the problem.
4. Run `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm test` and `pnpm frontend:verify`.
5. For runtime changes, run the playground with `pnpm dev` and `pnpm frontend:dev` and check the affected page in the browser.

Keep backend code in `src/`, frontend code in `frontend-vue/` and development infrastructure in `playground/`. Never commit `.env` files, generated runtimes, credentials or local data.

## Commits and pull requests

Use [Conventional Commits](https://www.conventionalcommits.org/) for commit and pull request titles. Explain the problem, link the relevant issue, call out breaking changes and provide the commands or runtime checks you used to verify the result.

This repository is a template, not an automatically published npm package. Publishing a module built from it is a separate decision.
