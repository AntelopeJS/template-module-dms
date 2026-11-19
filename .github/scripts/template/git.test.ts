import assert from "node:assert/strict";
import { test } from "node:test";

import {
  builtModule,
  run,
  succeed,
  writeModuleFile,
} from "./helpers/scaffold.ts";

const IGNORED = [
  ".env",
  "playground/.env",
  "node_modules/x",
  "dist/index.js",
  "frontend-vue/node_modules/x",
  "playground/.antelope/cache/x",
];

const KEPT = [
  "src/index.ts",
  "package.json",
  "README.md",
  "frontend-vue/package.json",
  "frontend-vue/app/components/WelcomeCard.vue",
  "playground/antelope.config.ts",
  "playground/.env.example",
  "compose.yaml",
];

async function ignored(module: string, path: string): Promise<boolean> {
  const result = await run("git", ["check-ignore", "-q", path], module);
  if (result.code !== 0 && result.code !== 1)
    throw new Error(
      `git check-ignore ${path} exited ${result.code}\n${result.stderr}`,
    );
  return result.code === 0;
}

await test("scaffold-gitignore", async () => {
  const module = await builtModule();
  writeModuleFile(module, "playground/.env", "DMS_JWT_SECRET=template-test\n");
  const verdicts = await Promise.all(
    [...IGNORED, ...KEPT].map(async (path) => ({
      path,
      ignored: await ignored(module, path),
    })),
  );
  assert.deepEqual(
    verdicts
      .filter((verdict) => IGNORED.includes(verdict.path) !== verdict.ignored)
      .map((verdict) => verdict.path),
    [],
    "git ignores secrets, dependencies and build output, and keeps the sources",
  );
  const untracked = await succeed(
    "git",
    ["ls-files", "--others", "--exclude-standard"],
    module,
  );
  const leaked = untracked.stdout
    .split("\n")
    .filter((path) =>
      /^(node_modules|dist|frontend-vue\/node_modules|playground\/\.antelope)\/|(^|\/)\.env$/.test(
        path,
      ),
    );
  assert.deepEqual(
    leaked,
    [],
    "no secret, dependency or build output is left untracked after install, build and a playground .env",
  );
});
