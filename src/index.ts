import { resolve } from "node:path";
import {
  AddFrontendModule,
  RegisterModule,
} from "@antelopejs/interface-dms/page";

export async function construct(): Promise<void> {
  RegisterModule({
    id: "example",
    title: "Example",
    description: "Your first DMS module",
    icon: "i-ph-cube",
  });
  await import("./pages/welcome");
}

export async function start(): Promise<void> {
  await AddFrontendModule({
    name: "example-frontend-vue",
    sourcePath: resolve(__dirname, "../frontend-vue"),
    renderer: { name: "vue", version: "3" },
  });
}
