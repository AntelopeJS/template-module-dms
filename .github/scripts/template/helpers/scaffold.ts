import { execFileSync, spawn } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readlinkSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { type AddressInfo, createServer, type Server } from "node:net";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

/** The repository root: the template a user creates a module from. */
const REPO = resolve(import.meta.dirname, "../../../..");

/** The listing name users pass to `--template`. */
const TEMPLATE = "DMS Module Typescript";

/** The folder name of every created module. */
const MODULE = "my-module";

const AJS = join(REPO, "node_modules/.bin/ajs");

const GIT_IDENTITY = [
  "-c",
  "user.name=template-test",
  "-c",
  "user.email=template-test@antelopejs.invalid",
  "-c",
  "init.defaultBranch=main",
  "-c",
  "commit.gpgsign=false",
];

/** A new empty folder under the OS temp directory, which honours `TMPDIR`. */
function scratch(name: string): string {
  return mkdtempSync(join(tmpdir(), `template-${name}-`));
}

function git(cwd: string, args: string[]): string {
  return execFileSync("git", [...GIT_IDENTITY, ...args], {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });
}

/** Commits `folder` as a new repository and returns the `file://` URL of a bare clone of it. */
function publish(folder: string): string {
  git(folder, ["init", "-q"]);
  git(folder, ["add", "-A", "--force"]);
  git(folder, ["commit", "-q", "-m", "template source"]);
  git(dirname(folder), ["clone", "-q", "--bare", folder, `${folder}.git`]);
  return pathToFileURL(`${folder}.git`).href;
}

/** Copies the working tree, uncommitted changes included, as `ajs` would fetch it from GitHub once merged. */
function copyWorkingTree(target: string): void {
  const files = git(REPO, [
    "ls-files",
    "-z",
    "--cached",
    "--others",
    "--exclude-standard",
  ])
    .split("\0")
    .filter(Boolean);
  for (const file of new Set(files)) {
    const source = join(REPO, file);
    const stat = lstatSync(source, { throwIfNoEntry: false });
    if (stat === undefined) continue;
    mkdirSync(dirname(join(target, file)), { recursive: true });
    if (stat.isSymbolicLink())
      symlinkSync(readlinkSync(source), join(target, file));
    else copyFileSync(source, join(target, file));
  }
}

/** An interfaces repository whose manifest lists this working tree as the template, so no step reaches GitHub. */
function offlineManifest(): string {
  const sources = scratch("sources");
  const template = join(sources, "template");
  mkdirSync(template);
  copyWorkingTree(template);
  const manifest = join(sources, "interfaces");
  mkdirSync(manifest);
  const listing = {
    interfaces: {},
    starredInterfaces: [],
    projectTemplates: [],
    templates: [
      {
        name: TEMPLATE,
        repository: publish(template),
        branch: "main",
        packageManager: "pnpm",
      },
    ],
  };
  writeFileSync(
    join(manifest, "manifest.json"),
    `${JSON.stringify(listing, null, 2)}\n`,
  );
  return publish(manifest);
}

let environment: NodeJS.ProcessEnv | undefined;

/** The variables of the CI job running this suite, which a user's shell never has: `antelopejs-checks` reads them as the template's own pull request. */
const CI_JOB_VARIABLE = /^(GITHUB|RUNNER|ANTELOPEJS)_/;

/** The environment of every command: a user's shell with its own `HOME`, and `ajs` pointed at the offline manifest. */
function env(): NodeJS.ProcessEnv {
  environment ??= {
    ...Object.fromEntries(
      Object.entries(process.env).filter(
        ([name]) => !CI_JOB_VARIABLE.test(name),
      ),
    ),
    HOME: scratch("home"),
    CI: "1",
    AJS_NO_UPDATE_CHECK: "1",
    NO_COLOR: "1",
    ANTELOPEJS_GIT: offlineManifest(),
  };
  return environment;
}

/** What a finished command printed and how it exited; `code` is `null` when a signal ended it. */
export interface Result {
  code: number | null;
  signal: NodeJS.Signals | null;
  stdout: string;
  stderr: string;
}

/** Runs `program` to completion and never rejects on a non-zero exit, so a test can assert a failure. */
export function run(
  program: string,
  args: string[],
  cwd: string = REPO,
): Promise<Result> {
  return new Promise((done, fail) => {
    const child = spawn(program, args, {
      cwd,
      env: env(),
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk: Buffer) => (stdout += chunk.toString()));
    child.stderr.on("data", (chunk: Buffer) => (stderr += chunk.toString()));
    child.once("error", fail);
    child.once("close", (code, signal) =>
      done({ code, signal, stdout, stderr }),
    );
  });
}

/** Runs `program` and throws with its output when it does not exit 0. */
export async function succeed(
  program: string,
  args: string[],
  cwd: string = REPO,
): Promise<Result> {
  const result = await run(program, args, cwd);
  if (result.code !== 0)
    throw new Error(
      `${program} ${args.join(" ")} exited ${result.code ?? result.signal}\n${result.stdout}\n${result.stderr}`,
    );
  return result;
}

/** A process left running, such as `ajs project dev`, with what it printed so far. */
export interface Running {
  output(): string;
  /** Resolves once the output matches `pattern`; rejects when the process exits first or `timeoutMs` passes. */
  waitFor(pattern: RegExp, timeoutMs: number): Promise<void>;
  /** Sends SIGINT, as Ctrl+C does, and resolves with how the process ended. */
  interrupt(): Promise<Result>;
  /** Kills the whole process group, what it spawned included. */
  kill(): void;
}

/** Starts `program` in a process group of its own, so {@link Running.kill} also stops what it spawned. */
export function start(
  program: string,
  args: string[],
  cwd: string,
  extraEnv: NodeJS.ProcessEnv,
): Running {
  const child = spawn(program, args, {
    cwd,
    env: { ...env(), ...extraEnv },
    stdio: ["ignore", "pipe", "pipe"],
    detached: true,
  });
  let stdout = "";
  let stderr = "";
  let exited = false;
  child.stdout.on("data", (chunk: Buffer) => (stdout += chunk.toString()));
  child.stderr.on("data", (chunk: Buffer) => (stderr += chunk.toString()));
  const ended = new Promise<Result>((done) =>
    child.once("close", (code, signal) => {
      exited = true;
      done({ code, signal, stdout, stderr });
    }),
  );
  return {
    output: () => stdout + stderr,
    async waitFor(pattern, timeoutMs) {
      const deadline = Date.now() + timeoutMs;
      while (!pattern.test(stdout + stderr)) {
        if (exited)
          throw new Error(
            `${program} exited before printing ${pattern}\n${stdout}\n${stderr}`,
          );
        if (Date.now() > deadline)
          throw new Error(
            `${program} did not print ${pattern} within ${timeoutMs} ms\n${stdout}\n${stderr}`,
          );
        await new Promise((wait) => setTimeout(wait, 250));
      }
    },
    async interrupt() {
      child.kill("SIGINT");
      return ended;
    },
    kill() {
      if (child.pid === undefined) return;
      try {
        process.kill(-child.pid, "SIGKILL");
      } catch {
        return;
      }
    },
  };
}

/** Creates a module from the template with `ajs module init`, as a user does, and returns its folder. */
export async function createModule(): Promise<string> {
  const module = join(scratch("module"), MODULE);
  await succeed(AJS, [
    "module",
    "init",
    module,
    "--template",
    TEMPLATE,
    "--pm",
    "pnpm",
    "--git-init",
  ]);
  if (!existsSync(join(module, "package.json")))
    throw new Error(`ajs module init created no package.json in ${module}`);
  return module;
}

/** A created module with its dependencies installed. */
export async function installedModule(): Promise<string> {
  const module = await createModule();
  await succeed(
    "pnpm",
    ["install", "--frozen-lockfile", "--prefer-offline"],
    module,
  );
  return module;
}

/** A created, installed and built module. */
export async function builtModule(): Promise<string> {
  const module = await installedModule();
  await succeed("pnpm", ["run", "build"], module);
  return module;
}

/** The names of the scripts the module's `package.json` declares. */
export async function scripts(module: string): Promise<string[]> {
  const listed = await succeed(
    "node",
    ["-p", "Object.keys(require('./package.json').scripts).join()"],
    module,
  );
  return listed.stdout.trim().split(",");
}

/** The text of `path` in the module, or `undefined` when it does not exist. */
export function readModuleFile(
  module: string,
  path: string,
): string | undefined {
  return existsSync(join(module, path))
    ? readFileSync(join(module, path), "utf8")
    : undefined;
}

/** Writes `text` to `path` in the module, as a user editing it does. */
export function writeModuleFile(
  module: string,
  path: string,
  text: string,
): void {
  writeFileSync(join(module, path), text);
}

export function removeModuleFile(module: string, path: string): void {
  rmSync(join(module, path));
}

/** Whether `address` is a TCP address, the only kind a server listening on a port reports. */
function isTcpAddress(
  address: ReturnType<Server["address"]>,
): address is AddressInfo {
  return address !== null && typeof address === "object";
}

/** A TCP port the kernel just handed out, so the playground's API does not clash with another run. */
export function freePort(): Promise<number> {
  return new Promise((done, fail) => {
    const server = createServer();
    server.once("error", fail);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      server.close(() =>
        isTcpAddress(address)
          ? done(address.port)
          : fail(new Error(`the server bound ${address}, not a TCP port`)),
      );
    });
  });
}
