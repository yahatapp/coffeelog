import { execFileSync } from "node:child_process";
import { mkdirSync, existsSync, symlinkSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
const repo = process.cwd();
const output = "/tmp/coffeelog-baseline";
mkdirSync(output, { recursive: true });
const archive = execFileSync("git", ["archive", "5054e9e"], { maxBuffer: 20 * 1024 * 1024 });
execFileSync("tar", ["-x", "-C", output], { input: archive });
for (const dir of [
  "",
  "apps/brewlog",
  "apps/cafelog",
  ...readdirSync("packages").map((name) => `packages/${name}`),
]) {
  const target = resolve(output, dir, "node_modules");
  const source = resolve(repo, dir, "node_modules");
  if (existsSync(source) && !existsSync(target)) symlinkSync(source, target);
}
console.log(`Baseline 5054e9e prepared at ${output}`);
