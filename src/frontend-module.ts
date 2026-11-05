import { resolve } from "node:path";
import type { FrontendModuleRegistration } from "@antelopejs/interface-dms/page";

/**
 * The module's Vue frontend registration, named by `dmsFrontend` in
 * package.json. `ajs dms dev`, `build` and `start` load this file on its own,
 * so it imports nothing at runtime beyond Node built-ins.
 */
export function frontendModule(): FrontendModuleRegistration {
  return {
    name: "example-frontend-vue",
    sourcePath: resolve(__dirname, "../frontend-vue"),
    renderer: { name: "vue", version: "3" },
  };
}
