import { spawnSync } from "node:child_process";
const env = {
  ...process.env,
  UI_ALL: "1",
  UI_CATALOG: "1",
  UI_COMPOSITES: "1",
  UI_SHELL: "1",
  UI_BREW_FORMS: "1",
  UI_BREW_PAGES: "1",
  UI_CAFE_FORMS: "1",
  UI_CAFE_PAGES: "1",
  UI_OUTPUT: process.env.UI_OUTPUT || "test-results/ui",
};
const result = spawnSync(process.execPath, ["scripts/ui/baseline.mjs"], { stdio: "inherit", env });
const report = spawnSync(process.execPath, ["scripts/ui/report.mjs"], { stdio: "inherit", env });
process.exit(result.status === 0 ? (report.status ?? 1) : (result.status ?? 1));
