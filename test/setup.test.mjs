import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

await test("setup creates private, independent secrets and preserves an existing environment", async () => {
  const directory = await mkdtemp(join(tmpdir(), "dms-module-setup-"));
  try {
    await mkdir(join(directory, "scripts"));
    await mkdir(join(directory, "playground"));
    await copyFile(
      new URL("../scripts/setup.mjs", import.meta.url),
      join(directory, "scripts/setup.mjs"),
    );
    await copyFile(
      new URL("../playground/.env.example", import.meta.url),
      join(directory, "playground/.env.example"),
    );
    const run = () =>
      execFileSync(process.execPath, [join(directory, "scripts/setup.mjs")]);
    run();
    const envPath = join(directory, "playground/.env");
    const environment = await readFile(envPath, "utf8");
    const secrets = [
      ...environment.matchAll(
        /^(?:DMS_SESSION_SECRET|DMS_JWT_SECRET|AUTH_JWT_SECRET)=([a-f0-9]{64})$/gm,
      ),
    ].map((match) => match[1]);
    assert.equal(secrets.length, 3);
    assert.equal(new Set(secrets).size, 3);
    if (process.platform !== "win32")
      assert.equal((await stat(envPath)).mode & 0o777, 0o600);
    const customized = `${environment}CUSTOM_SETTING=keep-me\n`;
    await writeFile(envPath, customized);
    run();
    assert.equal(await readFile(envPath, "utf8"), customized);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
