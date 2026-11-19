import assert from "node:assert/strict";
import { test } from "node:test";

import {
  installedModule,
  removeModuleFile,
  run,
  succeed,
  writeModuleFile,
} from "./helpers/scaffold.ts";

const PROBE = "src/unused.ts";

const module = await installedModule();

await test("scaffold-checks", async () => {
  await succeed("git", ["add", "-A"], module);
  await succeed(
    "git",
    [
      "-c",
      "user.name=template-test",
      "-c",
      "user.email=template-test@antelopejs.invalid",
      "commit",
      "-m",
      "chore: initial commit",
    ],
    module,
  );
  const checks = await run("pnpm", ["run", "checks"], module);
  assert.equal(checks.code, 0, checks.stdout + checks.stderr);
  assert.match(
    checks.stdout + checks.stderr,
    /^Checks: \d+ passed, 0 failed\.$/m,
    "every check step ran and none was skipped",
  );
});

await test("scaffold-lint-rejects", async (t) => {
  t.after(() => removeModuleFile(module, PROBE));
  writeModuleFile(
    module,
    PROBE,
    "export function untyped(value) {\n  return value;\n}\n",
  );
  const typecheck = await run("pnpm", ["run", "typecheck"], module);
  assert.notEqual(typecheck.code, 0, "typecheck failed");
  assert.match(
    typecheck.stdout + typecheck.stderr,
    /implicitly has an .any. type/,
    "typecheck names the implicit any",
  );
  writeModuleFile(module, PROBE, "debugger;\nexport {};\n");
  const lint = await run("pnpm", ["run", "lint"], module);
  assert.notEqual(lint.code, 0, "lint failed");
  assert.match(
    lint.stdout + lint.stderr,
    /debugger/,
    "lint names the debugger statement",
  );
});
