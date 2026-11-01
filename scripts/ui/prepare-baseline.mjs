import { execFileSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
// Historical sources are isolated. Their old dependency graph never enters the current workspace.
const output = mkdtempSync(join(tmpdir(), "coffeelog-baseline-"));
const archive = execFileSync("git", ["archive", "5054e9e"], { maxBuffer:20*1024*1024 });
execFileSync("tar", ["-x", "-C", output], { input:archive });
console.log(`Historical sources (5054e9e): ${output}`);
console.log("The immutable before/ screenshots are the visual record. Install the historical frozen lockfile inside this directory if you need its original build.");
