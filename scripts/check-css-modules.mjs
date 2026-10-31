import { readFileSync, readdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import postcss from "postcss";
const roots = ["packages/ui/src", "apps/brewlog/src", "apps/cafelog/src"];
const files = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? files(`${dir}/${e.name}`) : [`${dir}/${e.name}`],
  );
export function moduleIssues(css, layer) {
  const errors = [];
  const classes = new Set();
  const local = new Set();
  const tree = postcss.parse(css);
  tree.walkDecls((d) => {
    if (d.prop.startsWith("--")) local.add(d.prop);
  });
  tree.walkRules((rule) => {
    if(rule.parent.type==="atrule"&&rule.parent.name.endsWith("keyframes"))return;
    for (const match of rule.selector.matchAll(/\.([a-zA-Z_][\w-]*)/g)) classes.add(match[1]);
    if (!rule.selector.startsWith(".")) errors.push(`Selector needs local class: ${rule.selector}`);
    if (rule.selector.includes(":global")) errors.push("Global selector");
    let p = rule.parent;
    while (p && !(p.type === "atrule" && p.name === "layer")) p = p.parent;
    if (!p || p.params !== layer) errors.push(`Expected layer ${layer}`);
  });
  tree.walkDecls((d) => {
    if (/var\(--cl-ref-/.test(d.value)) errors.push("Primitive token reference");
    if (
      /^(color|background-color|border-color|outline-color|accent-color|fill|stroke)$/.test(
        d.prop,
      ) &&
      !/^var\(|^(currentColor|transparent|none|inherit)$/.test(d.value)
    )
      errors.push(`Unapproved color in ${d.prop}`);
    if (/#[\da-f]{3,8}\b|\b(?:rgb|hsl)a?\(/i.test(d.value)) errors.push(`Raw color in ${d.prop}`);
    const withoutVars = d.value.replace(/var\([^)]*\)/g, "");
    if (/\b\d*\.?\d+(?:px|rem|ms|s)\b/.test(withoutVars)) errors.push(`Raw dimension in ${d.prop}`);
    if (
      ["font-weight", "opacity", "z-index"].includes(d.prop) &&
      /^\d/.test(d.value) &&
      !["0", "1"].includes(d.value)
    )
      errors.push(`Raw number in ${d.prop}`);
    for (const [, name] of d.value.matchAll(/var\((--[\w-]+)/g)) {
      if (name.startsWith("--cl-") && !contractNames.has(name) && !local.has(name))
        errors.push(`Unknown public token: ${name}`);
      if (name.startsWith("--_") && !local.has(name))
        errors.push(`Missing local variable: ${name}`);
    }
  });
  return { errors: [...new Set(errors)], classes };
}
const contractNames = new Set(
  Object.keys(JSON.parse(readFileSync("packages/ui/src/styles/tokens/contract.json", "utf8"))),
);
export function classReferenceIssues(source, directory, modules) {
  const issues = [];
  for (const [, name, path] of source.matchAll(
    /import\s+(\w+)\s+from\s+["']([^"']+\.module\.css)["']/g,
  )) {
    const classes = modules.get(resolve(directory, path));
    const access = new RegExp(String.raw`\b${name}\.(\w+)`, "g");
    for (const [, className] of source.matchAll(access))
      if (!classes?.has(className)) issues.push(`Missing class ${name}.${className}`);
  }
  return issues;
}
export function checkModules() {
  const issues = [];
  const modules = new Map();
  for (const file of roots.flatMap(files).filter((f) => f.endsWith(".module.css"))) {
    const result = moduleIssues(
      readFileSync(file, "utf8"),
      file.includes("packages/ui")
        ? "components"
        : file.includes("/pages/")
          ? "pages"
          : "components",
    );
    issues.push(...result.errors.map((e) => `${file}: ${e}`));
    modules.set(resolve(file), result.classes);
    const declaration = file + ".d.ts";
    if (!existsSync(declaration)) {
      issues.push(`Missing CSS declaration: ${declaration}`);
      continue;
    }
    const declared = new Set(
      [...readFileSync(declaration, "utf8").matchAll(/readonly\s+(\w+)\s*:/g)].map((m) => m[1]),
    );
    if (
      [...result.classes].some((c) => !declared.has(c)) ||
      [...declared].some((c) => !result.classes.has(c))
    )
      issues.push(`Stale CSS declaration: ${declaration}`);
  }
  for (const file of roots.flatMap(files).filter((f) => /\.tsx?$/.test(f))) {
    const source = readFileSync(file, "utf8");
    issues.push(
      ...classReferenceIssues(source, dirname(file), modules).map((issue) => `${file}: ${issue}`),
    );
  }

  return issues;
}
if (
  process.argv[1]?.endsWith("/check-css-modules.mjs") ||
  process.argv[1] === "scripts/check-css-modules.mjs"
) {
  const issues = checkModules();
  if (issues.length) throw new Error(issues.join("\n"));
  console.log("CSS Modules, layers, values and declarations verified.");
}
