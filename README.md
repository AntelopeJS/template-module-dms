# AntelopeJS DMS Module Template

<div align="center">
<a href="./LICENSE"><img alt="License" src="https://img.shields.io/badge/License-Apache_2.0-000000?style=for-the-badge&labelColor=000000"></a>
<a href="https://discord.gg/sjK28QHrA7"><img alt="Discord" src="https://img.shields.io/badge/Discord-18181B?logo=discord&style=for-the-badge&color=000000"></a>
<a href="https://github.com/AntelopeJS/dms/tree/main/packages/dms/docs"><img alt="Docs" src="https://img.shields.io/badge/Docs-18181B?style=for-the-badge&color=000000"></a>
</div>

A starter for a reusable [AntelopeJS](https://github.com/AntelopeJS/antelopejs) DMS module: one backend page, one Vue component, and a playground that runs both. Use [DMS Demo](https://github.com/AntelopeJS/template-dms-demo) instead when you want a complete project showcasing the DMS features.

## What you get

```text
my-dms-module/
├── src/
│   ├── index.ts                  # registers the module and its frontend
│   └── pages/welcome.ts          # backend page and props for the Vue component
├── frontend-vue/                 # separate package, loaded by the DMS frontend
│   ├── dms.frontend.ts           # registers ExampleWelcome
│   ├── app/components/Welcome.vue
│   └── tests/welcome.test.ts
├── playground/
│   ├── antelope.config.ts        # local module + DMS and its providers
│   └── .env.example              # optional local overrides
├── compose.yaml                 # local MongoDB and Mailpit
└── package.json                 # backend, frontend, build and check commands
```

The module consumes `@antelopejs/interface-dms`; it does not invent another interface. Its playground supplies DMS, MongoDB, JWT authentication, the HTTP API, local file storage and email. There is no dependency on Stripe or any paid service.

## Create it

Use **Node.js 24**, **pnpm** and **MongoDB**. Docker Compose supplies MongoDB and a local email inbox; you can use existing local services instead.

Clone the template today:

```bash
git clone https://github.com/AntelopeJS/template-module-dms.git my-dms-module
cd my-dms-module
pnpm install
```

`pnpm install` installs both backend and frontend packages through the pnpm workspace. Each package keeps its existing lockfile to preserve its dependency resolution.

No setup script or `.env` is required for development. The playground uses development JWT secrets, and the frontend loader generates an ephemeral session secret. Restarting the frontend can invalidate sessions. Do not deploy the playground with its default secrets; `build` and `start` require an explicit `DMS_SESSION_SECRET` of at least 32 characters.

The **DMS Module Typescript** entry is prepared for the [CLI registry](https://github.com/AntelopeJS/interfaces), but is not available until that registry update is published. Once it appears in the selector, you can use:

```bash
ajs module init my-dms-module --template "DMS Module Typescript" --pm pnpm --yes
cd my-dms-module
```

The CLI installs both workspace packages; continue directly with the commands below.

## Run it

Start the development services and backend from the module root:

```bash
pnpm services:up
pnpm dev
```

In a second terminal, also from the module root:

```bash
pnpm frontend:dev
```

Wait for the backend to print its API listening address before starting the frontend. The first run downloads the DMS providers and frontend runtime, so it takes longer than subsequent starts. Open the URL printed by the frontend, complete onboarding to create the first administrator, then open **Modules → Example → Welcome**. There are no default credentials.

The backend normally listens on port 5010 and the dashboard on port 3001. The development frontend discovers the backend through `playground/.antelope/`, so there is no hard-coded `DMS_API_BASE_URL`. The `frontend:dev` script changes into `playground/` for that discovery; the backend script selects the same project with `-p playground`.

Mailpit captures emails locally; its inbox listens on port 8025. If you do not use Docker, configure `MONGODB_URL`, `MONGODB_DATABASE`, `SMTP_HOST` and `SMTP_PORT` in `playground/.env`. `services:down` stops the containers and keeps the MongoDB volume. This playground is for development, not production deployment.

| Command | What it does |
| --- | --- |
| `pnpm services:up` | Starts MongoDB and Mailpit with Docker Compose |
| `pnpm services:down` | Stops the containers without deleting the database volume |
| `pnpm dev` | Builds the local module and runs the backend in watch mode |
| `pnpm frontend:dev` | Starts the Vue dashboard with hot reload |
| `pnpm frontend:build -b <backend-url>` | Builds a dashboard from the running backend; unlike dev, build requires an explicit URL |
| `pnpm frontend:verify` | Builds and type-checks the frontend against the installed DMS, without starting a backend |
| `pnpm build` | Compiles the reusable backend module to `dist/` |
| `pnpm typecheck` | Checks backend TypeScript types |
| `pnpm lint` | Lints the backend with oxlint and the frontend with ESLint and Prettier |
| `pnpm format:check` | Checks backend formatting |
| `pnpm test` | Tests Vue rendering |
| `pnpm run checks` | Runs typecheck, lint, format, knip, the tests, size, ratchet and sync checks |
| `pnpm format` | Formats backend and frontend sources |
| `pnpm pack` | Builds a tarball containing the module and its frontend sources |

## Make it yours

1. Change the npm package `name`, `description` and `repository` in `package.json`.
2. Rename the `example` module ID in `src/index.ts` and `src/pages/welcome.ts`, then update the playground's module key and `homepage` URL.
3. Rename `example-frontend-vue` in `src/index.ts` and `frontend-vue/package.json`. Keep the frontend registration names aligned: `componentPrefix: 'Example'` plus `registerComponent('Welcome', ...)` resolves `CustomComponent("example-welcome")` from the backend.
4. Add pages under `src/pages/` and import them inside `construct()`, after `RegisterModule()`. Registering pages before their module exists fails at startup.

`start()` registers the frontend after DMS connects. Its absolute `sourcePath` works both in this checkout and when the module is installed from a package. Backend watch mode compiles in place rather than removing the running `dist/` directory.

Pages under `/modules/example/` are **platform-owner-only**. The initial administrator created by onboarding has this access. Use the DMS application/page APIs for pages intended for ordinary application users; changing a role alone does not make module pages public.

## Use it in another project

Build the module, then add it to an existing DMS project's `antelope.config.ts`:

```typescript
modules: {
  example: {
    source: { type: "local", path: "../my-dms-module" },
  },
  // Keep the project's existing DMS and provider configuration.
}
```

Install both packages with `pnpm install` when working from a checkout. After publishing your renamed module, use a `package` source instead of `local`. The package includes `dist/` and the Vue frontend sources; it excludes the playground, credentials and local data. `frontend:build` builds a whole dashboard for the playground; it is not required to publish the reusable module.

## Next steps

- [Creating a module](https://framework.antelopejs.com/docs/module-development/creating-a-module): AntelopeJS lifecycle and package layout.
- [DMS documentation](https://github.com/AntelopeJS/dms/tree/main/packages/dms/docs): pages, components, data and permissions.
- [Frontend modules](https://github.com/AntelopeJS/dms/blob/main/packages/dms/docs/02.building/08.frontend-layer.md): the Vue SDK and component naming.

Using an AI coding agent? Install the [AntelopeJS agent skills plugin](https://github.com/AntelopeJS/agent-skills). See [AGENTS.md](./AGENTS.md) for the DMS-specific guidance shipped with the installed packages.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). Run `pnpm run checks`, `pnpm build` and `pnpm frontend:verify` before opening a pull request.

## License

[Apache-2.0](./LICENSE)
