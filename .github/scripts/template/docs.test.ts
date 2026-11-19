import assert from "node:assert/strict";
import { test } from "node:test";

import { createModule, readModuleFile, scripts } from "./helpers/scaffold.ts";

/** pnpm's own commands, which the README names without the module declaring them. */
const PNPM_COMMANDS = new Set(["install", "add", "pack"]);

await test("scaffold-docs", async () => {
  const module = await createModule();
  const declared = await scripts(module);
  const readme = readModuleFile(module, "README.md") ?? "";
  const named = [
    ...new Set(
      [...readme.matchAll(/`pnpm (?:run )?([a-z:]+)`/g)].map(
        (found) => found[1] ?? "",
      ),
    ),
  ].filter((name) => !PNPM_COMMANDS.has(name));
  assert.deepEqual(
    named.filter((name) => !declared.includes(name)),
    [],
    "every command the README names is a script",
  );
  assert.deepEqual(
    ["services:up", "dev", "frontend:dev", "build", "frontend:verify"].filter(
      (name) => !named.includes(name),
    ),
    [],
    "the README names the services, dev, frontend and build commands",
  );
  assert.match(
    readModuleFile(module, "CONTRIBUTING.md") ?? "",
    /./,
    "CONTRIBUTING.md is not empty",
  );
  assert.match(
    readModuleFile(module, "LICENSE") ?? "",
    /License/i,
    "LICENSE holds the license",
  );
  assert.notEqual(
    readModuleFile(module, "AGENTS.md"),
    undefined,
    "AGENTS.md exists",
  );
});
