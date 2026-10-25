import { antelopeFmtPreset } from "@antelopejs/tooling-configs/oxc/fmt";

/** Markdown is never formatted; Prettier owns the Vue frontend. */
export default antelopeFmtPreset({
  ignorePatterns: ["frontend-vue/**", "**/*.md"],
});
