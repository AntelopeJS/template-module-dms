import { readFileSync } from "node:fs";
import { createServer, type AddressInfo, type Server } from "node:net";
import { join } from "node:path";

import {
  equal,
  exists,
  exitIs,
  fileHas,
  has,
  interrupted,
  type JourneyContext,
  type VerifyConfig,
} from "@antelopejs/tooling-configs/verify";

const TEMPLATE = "DMS Module Typescript";
const HOOKS = "construct,start";

function isAddress(address: ReturnType<Server["address"]>): address is AddressInfo {
  return address !== null && typeof address === "object";
}

/** A TCP port the kernel just handed out, so the playground's API does not clash with another run. */
function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!isAddress(address)) {
        reject(new Error("the server did not bind a TCP port"));
        return;
      }
      server.close(() => resolve(address.port));
    });
  });
}

/** Prints, with the module's own Node, the manifest fields a journey compares. */
const MANIFEST_FIELDS = "const m = require('./package.json'); console.log(JSON.stringify({ name: m.name, main: m.main, types: m.types }))";

/**
 * Creates a module from the template with `ajs module init`, as a user does, and installs it; returns its folder.
 * The harness scaffolds only projects, so the first step uses it for what it also does: pointing `ajs` at the offline manifest.
 */
async function scaffolded(context: JourneyContext, install = true): Promise<string> {
  const module = join(context.work, "my-module");
  const offline = await context.scaffold("point ajs at the offline manifest", module, ["--help"]);
  context.expect(offline.folder, [exitIs(offline, 0)], { critical: true });
  const init = await context.command("ajs module init", "pnpm", ["exec", "ajs", "module", "init", module, "--template", TEMPLATE, "--pm", "pnpm", "--git-init"], {
    cwd: context.repo,
  });
  context.expect(init.folder, [exitIs(init, 0), exists(join(module, "package.json")), exists(join(module, "src/index.ts"))], { critical: true });
  context.tree("scaffolded tree", module);
  if (install) {
    const done = await context.command("pnpm install", "pnpm", ["install", "--frozen-lockfile", "--prefer-offline"], { cwd: module });
    context.expect(done.folder, [exitIs(done, 0)], { critical: true });
  }
  return module;
}

async function built(context: JourneyContext): Promise<string> {
  const module = await scaffolded(context);
  const build = await context.command("pnpm run build", "pnpm", ["run", "build"], { cwd: module });
  context.expect(build.folder, [exitIs(build, 0), exists(join(module, "dist/index.js")), exists(join(module, "dist/index.d.ts"))], { critical: true });
  return module;
}

const config: VerifyConfig = {
  doors: {
    data: null,
    format: null,
    contract: null,
    outbound: null,
    exposure: {
      globs: [".gitignore", ".npmrc", "frontend-vue/.gitignore", "frontend-vue/.npmrc", "playground/.env.example"],
      funnels: [],
      containments: [],
      why: "every module created from the template inherits what git and npm leave out; a dropped .env line commits secrets (the playground reads its JWT secrets and database URL from playground/.env) in modules a revert never reaches",
    },
    publish: null,
  },
  services: {
    mongo: {
      image: "mongo:8.0",
      port: 27017,
      ready: ["mongosh", "--quiet", "--eval", "db.adminCommand('ping').ok"],
      reset: ["mongosh", "--quiet", "--eval", "db.getSiblingDB('dms_module_playground').dropDatabase()"],
    },
  },
  template: {
    name: TEMPLATE,
    probe: { log: /listening/ },
  },
  journeys: {
    "scaffold-shape": {
      title: "the created module has the manifest, the backend page, the Vue frontend package, the compose file and the playground the README promises",
      entryPoint: `\`ajs module init my-module --template "${TEMPLATE}" --pm pnpm\``,
      async run(context) {
        const module = await scaffolded(context, false);
        const manifest = await context.command("read the manifest", "node", ["-e", MANIFEST_FIELDS], { cwd: module });
        const scripts = await context.command("list the scripts", "node", ["-p", "Object.keys(require('./package.json').scripts).join()"], { cwd: module });
        context.expect(manifest.folder, [
          exitIs(manifest, 0),
          equal(
            "the manifest names the module and its compiled entry",
            manifest.stdout.trim(),
            JSON.stringify({ name: "antelopejs-dms-module", main: "dist/index.js", types: "dist/index.d.ts" }),
          ),
          equal(
            "every documented script exists",
            ["services:up", "services:down", "dev", "frontend:dev", "frontend:build", "frontend:verify", "build", "typecheck", "lint", "format", "test", "checks"].filter((name) => !scripts.stdout.trim().split(",").includes(name)),
            [],
          ),
        ]);
        context.expect(context.tree("created files", module).folder, [
          exists(join(module, "src/pages/welcome.ts")),
          exists(join(module, "frontend-vue/package.json")),
          exists(join(module, "frontend-vue/dms.frontend.ts")),
          exists(join(module, "frontend-vue/app/components/Welcome.vue")),
          exists(join(module, "frontend-vue/tests/welcome.test.ts")),
          exists(join(module, "playground/antelope.config.ts")),
          exists(join(module, "playground/.env.example")),
          exists(join(module, "compose.yaml")),
          exists(join(module, ".nvmrc")),
          fileHas(join(module, "src/index.ts"), /RegisterModule/),
          fileHas(join(module, "src/index.ts"), /export async function construct/),
          fileHas(join(module, "src/index.ts"), /AddFrontendModule/),
          fileHas(join(module, "src/pages/welcome.ts"), /RegisterPage/),
          fileHas(join(module, "frontend-vue/dms.frontend.ts"), /Welcome/),
          fileHas(join(module, "playground/antelope.config.ts"), /@antelopejs\/dms/),
        ]);
      },
    },
    "module-build": {
      title: "the built module exports its construct and start hooks, and the page is compiled",
      entryPoint: "`pnpm run build`, then loading `dist/index.js`",
      async run(context) {
        const module = await built(context);
        const keys = await context.command("exports of dist/index.js", "node", ["-p", "Object.keys(require('./dist/index.js')).sort().join()"], { cwd: module });
        context.expect(keys.folder, [exitIs(keys, 0), equal("the lifecycle hooks", keys.stdout.trim(), HOOKS)]);
        context.expect(context.tree("built files", join(module, "dist")).folder, [exists(join(module, "dist/pages/welcome.js")), fileHas(join(module, "dist/pages/welcome.js"), /WelcomePage/)]);
      },
    },
    "frontend-test": {
      title: "`pnpm test` renders the Vue welcome component and passes",
      entryPoint: "`pnpm test` in the created module",
      async run(context) {
        const module = await scaffolded(context);
        const test = await context.command("pnpm test", "pnpm", ["test"], { cwd: module });
        context.expect(test.folder, [exitIs(test, 0), has("vitest summary", test.stdout, /Tests\s+\d+ passed/)]);
      },
    },
    "frontend-test-fails": {
      title: "a failing test added to the frontend makes `pnpm test` fail and be reported",
      entryPoint: "`pnpm test` after adding `frontend-vue/tests/broken.test.ts`",
      async run(context) {
        const module = await scaffolded(context);
        context.edit("add a failing test", join(module, "frontend-vue/tests/broken.test.ts"), "import { expect, it } from 'vitest';\n\nit('fails', () => {\n  expect('verify-broken').toBe('verify-fixed');\n});\n");
        const test = await context.command("pnpm test", "pnpm", ["test"], { cwd: module });
        context.expect(test.folder, [equal("the run failed", test.exitCode !== 0, true), has("output", test.stdout + test.stderr, /verify-broken/)]);
      },
    },
    "frontend-verify": {
      title: "`pnpm frontend:verify` builds and type-checks the frontend against the installed DMS without a backend",
      entryPoint: "`pnpm frontend:verify` in the created module",
      async run(context) {
        const module = await scaffolded(context);
        const verify = await context.command("pnpm frontend:verify", "pnpm", ["frontend:verify"], { cwd: module, timeoutMs: 900_000 });
        context.expect(verify.folder, [exitIs(verify, 0)]);
      },
    },
    "scaffold-lint": {
      title: "the created module passes its typecheck, lint (oxlint, ESLint and Prettier) and knip",
      entryPoint: "`pnpm run typecheck`, `pnpm run lint` and `pnpm run knip`",
      async run(context) {
        const module = await scaffolded(context);
        for (const script of ["typecheck", "lint", "knip"]) {
          const done = await context.command(`pnpm run ${script}`, "pnpm", ["run", script], { cwd: module });
          context.expect(done.folder, [exitIs(done, 0)]);
        }
      },
    },
    "scaffold-lint-rejects": {
      title: "typecheck rejects an implicitly typed parameter, and lint rejects a debugger statement, so the configs are live",
      entryPoint: "`pnpm run typecheck` and `pnpm run lint` after editing `src/`",
      async run(context) {
        const module = await scaffolded(context);
        context.edit("add an untyped parameter", join(module, "src/unused.ts"), "export function untyped(value) {\n  return value;\n}\n");
        const typecheck = await context.command("pnpm run typecheck", "pnpm", ["run", "typecheck"], { cwd: module });
        context.expect(typecheck.folder, [equal("typecheck failed", typecheck.exitCode !== 0, true), has("typecheck output", typecheck.stdout + typecheck.stderr, /implicitly has an .any. type/)]);
        context.edit("replace it with a debugger statement", join(module, "src/unused.ts"), "debugger;\nexport {};\n");
        const lint = await context.command("pnpm run lint", "pnpm", ["run", "lint"], { cwd: module });
        context.expect(lint.folder, [equal("lint failed", lint.exitCode !== 0, true), has("lint output", lint.stdout + lint.stderr, /debugger/)]);
      },
    },
    "scaffold-checks": {
      title: "the created module passes `pnpm run checks` after its first commit, as AGENTS.md tells the user to do before changing anything",
      entryPoint: "the first `git commit`, whose hook formats the `package.json` the CLI rewrote, then `pnpm run checks`",
      async run(context) {
        const module = await scaffolded(context);
        const add = await context.command("git add", "git", ["add", "-A"], { cwd: module });
        context.expect(add.folder, [exitIs(add, 0)], { critical: true });
        const commit = await context.command("first commit", "git", ["-c", "user.name=verify", "-c", "user.email=verify@example.com", "commit", "-m", "chore: initial commit"], { cwd: module });
        context.expect(commit.folder, [exitIs(commit, 0)], { critical: true });
        const checks = await context.command("pnpm run checks", "pnpm", ["run", "checks"], { cwd: module });
        context.expect(checks.folder, [exitIs(checks, 0)]);
      },
    },
    "playground-dev": {
      title: "the playground starts the module next to DMS and MongoDB: DMS logs the module's welcome route as owner-only, the API answers on the chosen port, and MongoDB holds the default tenant",
      entryPoint: "`pnpm build`, then `ajs project dev` in the playground (what `pnpm dev` runs) against a MongoDB container",
      async run(context) {
        const module = await built(context);
        const mongo = context.service("mongo");
        const port = await freePort();
        const config = join(module, "playground/antelope.config.ts");
        context.edit("move the API to a free port", config, readFileSync(config, "utf8").replace("port: 5010", `port: ${port}`));
        const app = await context.dev("ajs project dev", join(module, "playground"), { env: { MONGODB_URL: `mongodb://${mongo.host}:${mongo.port}` } });
        const api = await context.http("GET the API root", `http://127.0.0.1:${port}/`);
        context.expect(api.folder, [equal("the API answers on the chosen port", api.status !== null && api.error === null, true)]);
        const collections = await context.native("mongosh lists the playground collections", "mongo", ["mongosh", "--quiet", "--eval", "JSON.stringify(db.getSiblingDB('dms_module_playground').getCollectionNames())"]);
        context.expect(collections.folder, [exitIs(collections, 0), has("DMS created its tenant collection", collections.stdout, /tenant/)]);
        const stopped = await context.stop("SIGINT", app);
        context.expect(stopped.folder, [
          interrupted(stopped),
          has("DMS registered the welcome route owner-only", stopped.stdout, /Module route \/modules\/example\/welcome\/\.\.\. gated owner-only/),
          has("the API listens on the chosen port", stopped.stdout, new RegExp(`listening on http://127\\.0\\.0\\.1:${port}`)),
        ]);
      },
    },
    "scaffold-docs": {
      title: "every command the README names exists in the created module, and the files it points at are there",
      entryPoint: "reading `README.md` and `CONTRIBUTING.md` of the created module",
      async run(context) {
        const module = await scaffolded(context, false);
        const listed = await context.command("list the scripts", "node", ["-p", "Object.keys(require('./package.json').scripts).join()"], { cwd: module });
        const scripts = listed.stdout.trim().split(",");
        const readme = readFileSync(join(module, "README.md"), "utf8");
        const named = [...new Set([...readme.matchAll(/`pnpm (?:run )?([a-z:]+)`/g)].map((match) => match[1] ?? ""))].filter((name) => name !== "install" && name !== "add" && name !== "pack");
        context.expect(context.tree("created files", module).folder, [
          exitIs(listed, 0),
          equal("README commands without a script", named.filter((name) => !scripts.includes(name)), []),
          equal("README names the services, dev, frontend and build commands", ["services:up", "dev", "frontend:dev", "build", "frontend:verify"].filter((name) => !named.includes(name)), []),
          fileHas(join(module, "CONTRIBUTING.md"), /./),
          fileHas(join(module, "LICENSE"), /License/i),
          exists(join(module, "AGENTS.md")),
        ]);
      },
    },
    "scaffold-gitignore": {
      title: "the created module's git ignores secrets, dependencies and build output, and keeps its sources tracked",
      entryPoint: "`git check-ignore` and `git status` in the created module",
      async run(context) {
        const module = await built(context);
        context.edit("create a playground .env", join(module, "playground/.env"), "DMS_JWT_SECRET=verify\n");
        for (const path of [".env", "playground/.env", "node_modules/x", "dist/index.js", "frontend-vue/node_modules/x", "playground/.antelope/cache/x"]) {
          const ignored = await context.command(`git check-ignore ${path}`, "git", ["check-ignore", "-q", path], { cwd: module });
          context.expect(ignored.folder, [equal(`${path} is ignored`, ignored.exitCode, 0)]);
        }
        for (const path of ["src/index.ts", "package.json", "README.md", "frontend-vue/package.json", "frontend-vue/app/components/Welcome.vue", "playground/antelope.config.ts", "playground/.env.example", "compose.yaml"]) {
          const kept = await context.command(`git check-ignore ${path}`, "git", ["check-ignore", "-q", path], { cwd: module });
          context.expect(kept.folder, [equal(`${path} is not ignored`, kept.exitCode, 1)]);
        }
        const status = await context.command("untracked files after install, build and a playground .env", "git", ["ls-files", "--others", "--exclude-standard"], { cwd: module });
        const leaked = status.stdout.split("\n").filter((path) => /^(node_modules|dist|frontend-vue\/node_modules|playground\/\.antelope)\/|(^|\/)\.env$/.test(path));
        context.expect(status.folder, [equal("no secret, dependency or build output is left untracked", leaked, [])]);
      },
    },
  },
};

export default config;
