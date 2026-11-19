import assert from "node:assert/strict";
import { test } from "node:test";

import {
  installedModule,
  removeModuleFile,
  run,
  writeModuleFile,
} from "./helpers/scaffold.ts";

const BROKEN_TEST = "frontend-vue/tests/broken.test.ts";

const module = await installedModule();

await test("frontend-test", async () => {
  const result = await run("pnpm", ["test"], module);
  assert.equal(result.code, 0, result.stdout + result.stderr);
  assert.match(
    result.stdout,
    /Tests\s+\d+ passed/,
    "vitest reports the passing tests",
  );
});

await test("frontend-test-fails", async (t) => {
  writeModuleFile(
    module,
    BROKEN_TEST,
    "import { expect, it } from 'vitest';\n\nit('fails', () => {\n  expect('template-broken').toBe('template-fixed');\n});\n",
  );
  t.after(() => removeModuleFile(module, BROKEN_TEST));
  const result = await run("pnpm", ["test"], module);
  assert.notEqual(result.code, 0, "the run failed");
  assert.match(
    result.stdout + result.stderr,
    /template-broken/,
    "the failure is reported",
  );
});

await test("frontend-verify", async () => {
  const result = await run("pnpm", ["frontend:verify"], module);
  assert.equal(result.code, 0, result.stdout + result.stderr);
});
