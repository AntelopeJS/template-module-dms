import { antelopeKnipConfig } from "@antelopejs/tooling-configs/knip";

/**
 * `dotenv` is loaded only by `playground/antelope.config.ts`, which the preset
 * ignores. `#dms/frontend-module` is a virtual module the DMS frontend build
 * provides.
 */
export default Object.assign(
  antelopeKnipConfig({ ignoreDependencies: ["dotenv"] }),
  { ignoreUnresolved: ["#dms/frontend-module"] },
);
