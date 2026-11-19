import assert from "node:assert/strict";
import { test } from "node:test";

import {
  builtModule,
  createModule,
  readModuleFile,
  scripts,
  succeed,
} from "./helpers/scaffold.ts";

const DOCUMENTED_SCRIPTS = [
  "services:up",
  "services:down",
  "dev",
  "frontend:dev",
  "frontend:build",
  "frontend:verify",
  "build",
  "typecheck",
  "lint",
  "format",
  "test",
  "checks",
];

const PROMISED_FILES = [
  "src/pages/welcome.ts",
  "frontend-vue/package.json",
  "frontend-vue/dms.frontend.ts",
  "frontend-vue/app/components/WelcomeCard.vue",
  "frontend-vue/tests/welcome-card.test.ts",
  "playground/antelope.config.ts",
  "playground/.env.example",
  "compose.yaml",
  ".nvmrc",
];

/** Files of the template repository that `ajs module init` leaves out, so a created module never runs or ships them. */
const TEMPLATE_ONLY_FILES = [".github/scripts/template/tsconfig.json"];

const PROMISED_SOURCES: [string, RegExp][] = [
  ["src/index.ts", /RegisterModule/],
  ["src/index.ts", /export async function construct/],
  ["src/index.ts", /AddFrontendModule/],
  ["src/pages/welcome.ts", /RegisterPage/],
  ["frontend-vue/dms.frontend.ts", /Welcome/],
  ["playground/antelope.config.ts", /@antelopejs\/dms/],
];

await test("scaffold-shape", async () => {
  const module = await createModule();
  const manifest = await succeed(
    "node",
    [
      "-e",
      "const m = require('./package.json'); console.log(JSON.stringify({ name: m.name, main: m.main, types: m.types }))",
    ],
    module,
  );
  assert.deepEqual(
    JSON.parse(manifest.stdout),
    {
      name: "antelopejs-dms-module",
      main: "dist/index.js",
      types: "dist/index.d.ts",
    },
    "the manifest names the module and its compiled entry",
  );
  const declared = await scripts(module);
  assert.deepEqual(
    DOCUMENTED_SCRIPTS.filter((name) => !declared.includes(name)),
    [],
    "every documented script exists",
  );
  assert.deepEqual(
    PROMISED_FILES.filter((file) => readModuleFile(module, file) === undefined),
    [],
    "every file the README promises exists",
  );
  assert.deepEqual(
    TEMPLATE_ONLY_FILES.filter(
      (file) => readModuleFile(module, file) !== undefined,
    ),
    [],
    "the template's own tests stay out of the created module",
  );
  for (const [file, pattern] of PROMISED_SOURCES)
    assert.match(
      readModuleFile(module, file) ?? "",
      pattern,
      `${file} holds ${pattern}`,
    );
});

await test("module-build", async () => {
  const module = await builtModule();
  const hooks = await succeed(
    "node",
    ["-p", "Object.keys(require('./dist/index.js')).sort().join()"],
    module,
  );
  assert.equal(
    hooks.stdout.trim(),
    "construct,start",
    "dist/index.js exports the lifecycle hooks",
  );
  assert.notEqual(
    readModuleFile(module, "dist/index.d.ts"),
    undefined,
    "the build emits its declarations",
  );
  assert.match(
    readModuleFile(module, "dist/pages/welcome.js") ?? "",
    /WelcomePage/,
    "the page is compiled",
  );
});
