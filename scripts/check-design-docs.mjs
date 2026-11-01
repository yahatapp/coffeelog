import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve, dirname, extname } from "node:path";
import stylelint from "stylelint";
import { moduleIssues } from "./check-css-modules.mjs";
const required = [
  "README",
  "tokens",
  "components",
  "patterns",
  "accessibility",
  "exceptions",
  "changelog",
].map((name) => `docs/design-system/${name}.md`);
const files = [
  ...required,
  "docs/design-system-assessment.md",
  "docs/design-system-implementation-plan.md",
  "AGENTS.md",
  "apps/brewlog/AGENTS.md",
  "apps/brewlog/src/components/AGENTS.md",
  "apps/brewlog/src/pages/AGENTS.md",
  "apps/cafelog/AGENTS.md",
];
const issues = [];
for (const file of files) {
  if (!existsSync(file)) {
    issues.push(`Missing guide: ${file}`);
    continue;
  }
  const text = readFileSync(file, "utf8");
  for (const [, url] of text.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
    if (/^(?:https?:|#|plugin:|app:)/.test(url)) continue;
    const [path, fragment] = url.split("#"),
      target = resolve(dirname(file), path);
    if (!existsSync(target)) {
      issues.push(`${file}: broken link ${url}`);
      continue;
    }
    if (fragment && extname(target) === ".md") {
      const headings = [...readFileSync(target, "utf8").matchAll(/^#{1,6}\s+(.+)$/gm)].map((m) =>
        m[1]
          .toLowerCase()
          .replace(/[^\p{L}\p{N}_ -]/gu, "")
          .replaceAll(" ", "-"),
      );
      if (!headings.includes(decodeURIComponent(fragment)))
        issues.push(`${file}: missing heading ${url}`);
    }
  }
  for (const [, css] of text.matchAll(/```css\s*\n([\s\S]*?)```/g)) {
    const result = await stylelint.lint({
      code: css,
      codeFilename: "packages/ui/src/styles/guide-example.css",
      configFile: resolve("stylelint.config.mjs"),
    });
    if (result.errored) issues.push(`${file}: invalid CSS example`);
    if (css.includes("@layer pages"))
      issues.push(...moduleIssues(css, "pages").errors.map((e) => `${file}: CSS example: ${e}`));
  }
}
if (issues.length) throw Error(issues.join("\n"));
console.log(`Design guides, local links and CSS examples verified (${files.length} files).`);
