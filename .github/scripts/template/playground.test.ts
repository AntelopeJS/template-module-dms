import assert from "node:assert/strict";
import { join } from "node:path";
import { test } from "node:test";

import {
  builtModule,
  freePort,
  readModuleFile,
  run,
  start,
  succeed,
  writeModuleFile,
} from "./helpers/scaffold.ts";

const MONGO_IMAGE = "mongo:8.0";

const CONFIG = "playground/antelope.config.ts";

/** Starts a MongoDB container on a free loopback port and resolves with its URL once it answers a ping. */
async function mongo(container: string): Promise<string> {
  await succeed("docker", [
    "run",
    "-d",
    "--rm",
    "--name",
    container,
    "-p",
    "127.0.0.1::27017",
    MONGO_IMAGE,
  ]);
  const mapped = await succeed("docker", ["port", container, "27017/tcp"]);
  const port = /:(\d+)\s*$/m.exec(mapped.stdout)?.[1];
  if (port === undefined)
    throw new Error(`docker port printed no host port: ${mapped.stdout}`);
  for (let attempt = 0; attempt < 120; attempt += 1) {
    const ping = await run("docker", [
      "exec",
      container,
      "mongosh",
      "--quiet",
      "--eval",
      "db.adminCommand('ping').ok",
    ]);
    if (ping.code === 0 && ping.stdout.trim() === "1")
      return `mongodb://127.0.0.1:${port}`;
    await new Promise((wait) => setTimeout(wait, 500));
  }
  throw new Error(`${container} did not answer a ping`);
}

await test("playground-dev", async (t) => {
  const module = await builtModule();
  const container = `template-module-dms-mongo-${process.pid}`;
  t.after(() => run("docker", ["rm", "-f", container]));
  const mongoUrl = await mongo(container);
  const port = await freePort();
  const config = readModuleFile(module, CONFIG) ?? "";
  assert.match(config, /port: 5010/, "the playground names its API port");
  writeModuleFile(
    module,
    CONFIG,
    config.replace("port: 5010", `port: ${port}`),
  );

  const app = start(
    join(module, "node_modules/.bin/ajs"),
    ["project", "dev", "-p", "playground", "-w"],
    module,
    { MONGODB_URL: mongoUrl },
  );
  t.after(() => app.kill());
  await app.waitFor(
    new RegExp(`listening on http://127\\.0\\.0\\.1:${port}`),
    600_000,
  );

  const answer = await fetch(`http://127.0.0.1:${port}/`, {
    signal: AbortSignal.timeout(5_000),
  });
  assert.ok(answer.status > 0, "the API answers on the chosen port");
  const deadline = Date.now() + 60_000;
  let collections = "";
  while (!/tenant/.test(collections) && Date.now() < deadline) {
    collections = (
      await succeed("docker", [
        "exec",
        container,
        "mongosh",
        "--quiet",
        "--eval",
        "JSON.stringify(db.getSiblingDB('dms_module_playground').getCollectionNames())",
      ])
    ).stdout;
    if (!/tenant/.test(collections))
      await new Promise((wait) => setTimeout(wait, 1_000));
  }
  assert.match(collections, /tenant/, "DMS created its tenant collection");

  const stopped = await app.interrupt();
  assert.ok(
    stopped.code === 130 || stopped.signal === "SIGINT",
    `Ctrl+C ends the backend: exit ${stopped.code}, signal ${stopped.signal}\n${app.output()}`,
  );
  assert.match(
    app.output(),
    /Module route \/modules\/example\/welcome\/\.\.\. gated owner-only/,
    "DMS registered the welcome route owner-only",
  );
});
