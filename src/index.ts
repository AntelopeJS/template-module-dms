import {
  AddFrontendModule,
  RegisterModule,
} from "@antelopejs/interface-dms/page";
import { frontendModule } from "./frontend-module";

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
  await AddFrontendModule(frontendModule());
}
