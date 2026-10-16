import { randomBytes } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const SECRET_BYTES = 32;
const example = await readFile(
  new URL("../playground/.env.example", import.meta.url),
  "utf8",
);
const environment = example.replace(
  /^(DMS_SESSION_SECRET|DMS_JWT_SECRET|AUTH_JWT_SECRET)=$/gm,
  (_, name) => `${name}=${randomBytes(SECRET_BYTES).toString("hex")}`,
);

try {
  await writeFile(new URL("../playground/.env", import.meta.url), environment, {
    flag: "wx",
    mode: 0o600,
  });
  console.log("Created playground/.env with separate random secrets.");
} catch (error) {
  if (error.code !== "EEXIST") throw error;
  console.log("Kept the existing playground/.env unchanged.");
}

console.log(
  "Run pnpm services:up for MongoDB and Mailpit, or configure your local services in playground/.env.",
);
console.log("Run pnpm dev, then pnpm frontend:dev in a second terminal.");
console.log(
  "Open the printed dashboard URL and create the first administrator. There are no default credentials.",
);
