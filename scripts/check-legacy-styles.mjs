import { readFileSync, readdirSync } from "node:fs";
const files = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? files(`${dir}/${e.name}`) : [`${dir}/${e.name}`],
  );
export function legacyStyleIssues(source) {
  const issues = [];
  if (
    /--app-color-|--color-(?:coffee|cafe|primary|secondary)|@(?:theme|source|plugin)\b|tailwindcss|tailwind-merge|twMerge/.test(
      source,
    )
  )
    issues.push("Legacy style definition or import");
  if (/className\s*=\s*["'][^"']+["']/.test(source))
    issues.push("Literal className: use a CSS Module");
  if (/\b(?:bg|text|border|ring|shadow)-(?:coffee|cafe)-[\w/-]+/.test(source))
    issues.push("Legacy utility class");
  return issues;
}
export function checkLegacyStyles() {
  const issues = [];
  for (const file of ["apps/brewlog/src", "apps/cafelog/src", "packages/ui/src"]
    .flatMap(files)
    .filter((x) => /\.(?:tsx?|css)$/.test(x)))
    issues.push(...legacyStyleIssues(readFileSync(file, "utf8")).map((x) => `${file}: ${x}`));
  for (const file of [
    "package.json",
    "apps/brewlog/package.json",
    "apps/cafelog/package.json",
    "packages/ui/package.json",
    "pnpm-workspace.yaml",
    "pnpm-lock.yaml",
    "apps/brewlog/vite.config.ts",
    "apps/cafelog/vite.config.ts",
  ])
    if (/tailwind|autoprefixer/.test(readFileSync(file, "utf8")))
      issues.push(`${file}: removed dependency`);
  return issues;
}
if (process.argv[1]?.endsWith("check-legacy-styles.mjs")) {
  const issues = checkLegacyStyles();
  if (issues.length) throw Error(issues.join("\n"));
  console.log("Legacy styles and dependencies absent.");
}
