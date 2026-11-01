import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { moduleIssues } from "./check-css-modules.mjs";
const files = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? files(`${dir}/${e.name}`) : [`${dir}/${e.name}`],
  );
for (const file of ["packages/ui/src", "apps/brewlog/src", "apps/cafelog/src", "scripts/ui"]
  .flatMap(files)
  .filter((file) => file.endsWith(".module.css"))) {
  const classes = [
    ...moduleIssues(
      readFileSync(file, "utf8"),
      file.startsWith("packages/ui")
        ? "components"
        : file.includes("/pages/") || file.startsWith("scripts/ui/")
          ? "pages"
          : "components",
    ).classes,
  ].sort();
  writeFileSync(
    file + ".d.ts",
    "declare const styles: {\n" +
      classes.map((name) => `  readonly ${name}: string;\n`).join("") +
      "};\nexport default styles;\n",
  );
}
