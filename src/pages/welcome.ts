import { CustomComponent } from "@antelopejs/interface-dms/base/custom";
import { PageController, RegisterPage } from "@antelopejs/interface-dms/page";

@RegisterPage()
export class WelcomePage extends PageController("welcome", {
  displayName: "Welcome",
  module: "example",
  urlSlug: "welcome",
  icon: "i-ph-hand-waving",
}) {
  static welcome = CustomComponent("example-welcome").options({
    title: "Your DMS module is running",
    message:
      "This page comes from your backend. The card comes from your Vue frontend.",
  });
}
