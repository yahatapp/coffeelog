import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, relative } from "node:path";
const source = resolve(process.env.UI_SOURCE || "/tmp/coffeelog-baseline");
function files(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory()
      ? e.name === "node_modules"
        ? []
        : files(resolve(dir, e.name))
      : [resolve(dir, e.name)],
  );
}
const inputs = ["packages/ui/src", "apps/brewlog/src", "apps/cafelog/src"]
  .flatMap((p) => files(resolve(source, p)))
  .filter((p) => /\.(tsx|ts|css)$/.test(p));
const rows = [];
for (const path of inputs) {
  const code = readFileSync(path, "utf8");
  if (!/className|\bstyle=|--app-color|@theme|twMerge|@yahatapp\/ui/.test(code)) continue;
  const file = relative(source, path);
  const reexportOnly = /^\s*export\s*\{[^}]+\}\s*from\s*"@yahatapp\/ui";?\s*$/.test(code);
  let task = file.startsWith("packages/") ? "T04" : file.includes("brewlog") ? "T07" : "T09";
  if (/\/(layout|notices|status|log-list-controls|store-history)\.tsx$/.test(file)) task = "T05";
  if (file.includes("/pages/") && !/(AddBean|EditBean|AddLog|EditLog|CreateLog)/.test(file))
    task = file.includes("brewlog") ? "T08" : "T10";
  if (/\/(App|main)\.tsx$/.test(file)) task = "T06";
  if (file.endsWith(".css")) task = "T02/T11";
  if (reexportOnly) task = "T07";
  rows.push({
    file,
    task,
    reexportOnly,
    classNameUses: (code.match(/className/g) || []).length,
    inlineStyles: (code.match(/\bstyle=/g) || []).length,
  });
}
for (const file of [
  "packages/ui/package.json",
  "apps/brewlog/package.json",
  "apps/cafelog/package.json",
  "apps/brewlog/vite.config.ts",
  "apps/cafelog/vite.config.ts",
  "pnpm-workspace.yaml",
  "pnpm-lock.yaml",
  "AGENTS.md",
  "apps/brewlog/AGENTS.md",
  "apps/brewlog/src/components/AGENTS.md",
  "apps/brewlog/src/pages/AGENTS.md",
  ".github/workflows/ci.yml",
])
  rows.push({
    file,
    task: file.endsWith("AGENTS.md") || file.includes("ci.yml") ? "T12" : "T11",
    configuration: true,
  });
writeFileSync("docs/design-system/evidence/inventory.json", JSON.stringify(rows, null, 2) + "\n");
console.log(`Inventoried ${rows.length} UI and configuration files.`);
